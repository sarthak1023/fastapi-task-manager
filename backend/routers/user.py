import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from services.auth import (create_access_token, verify_password, hash_password, get_current_user, require_admin,
                           check_password_strength)
from services.email import generate_code, send_verification_email, send_password_reset_email
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.task import Task as TaskModel
from schemas.user import (UserCreate, UserResponse, AdminUserResponse, EmailRequest, VerifyEmailRequest,
                          ResetPasswordRequest, UpdateProfileRequest, ChangePasswordRequest)

router = APIRouter(tags=["Auth & Users"])

CODE_EXPIRE_MINUTES = 10


def utc_now():
    # The database stores naive UTC datetimes
    return datetime.now(UTC).replace(tzinfo=None)


def code_is_valid(stored_code, expires_at, submitted_code: str):
    if not stored_code or not expires_at or utc_now() > expires_at:
        return False
    # compare_digest avoids leaking how many digits matched through response timing
    return secrets.compare_digest(stored_code, submitted_code.strip())


class DeleteAccountRequest(BaseModel):
    password: str


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name or "there",
        "email": current_user.email,
        "is_admin": current_user.is_admin
    }


@router.put("/me", summary="Update my profile (name)")
def update_profile(request: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    current_user.name = name
    db.commit()

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_admin": current_user.is_admin
    }


@router.post("/me/change-password", summary="Change my password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 400 (not 401) so the frontend doesn't treat a typo as an expired session and log the user out
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    check_password_strength(request.new_password)

    if verify_password(request.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the current one")

    current_user.hashed_password = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    check_password_strength(user.password)

    hashed_password = hash_password(user.password)
    code = generate_code()

    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        is_verified=False,
        verification_code=code,
        verification_code_expires=utc_now() + timedelta(minutes=CODE_EXPIRE_MINUTES)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send after the response so a slow SMTP server doesn't make signup slow
    background_tasks.add_task(send_verification_email, db_user.email, db_user.name, code)

    return db_user


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if user and user.is_verified:
        return {"message": "Email already verified"}

    if not user or not code_is_valid(user.verification_code, user.verification_code_expires, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(request: EmailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if user and not user.is_verified:
        code = generate_code()
        user.verification_code = code
        user.verification_code_expires = utc_now() + timedelta(minutes=CODE_EXPIRE_MINUTES)
        db.commit()
        background_tasks.add_task(send_verification_email, user.email, user.name, code)

    # Same reply either way, so this can't be used to discover which emails have accounts
    return {"message": "If that account needs verification, a new code has been sent."}


@router.post("/forgot-password")
def forgot_password(request: EmailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        code = generate_code()
        user.reset_code = code
        user.reset_code_expires = utc_now() + timedelta(minutes=CODE_EXPIRE_MINUTES)
        db.commit()
        background_tasks.add_task(send_password_reset_email, user.email, user.name, code)

    return {"message": "If an account exists for that email, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not code_is_valid(user.reset_code, user.reset_code_expires, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    check_password_strength(request.new_password)

    user.hashed_password = hash_password(request.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    user.is_verified = True  # receiving the code proves they own the email
    db.commit()

    return {"message": "Password reset successfully"}


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()


@router.delete("/users/{email}")
def delete_user(email: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account here")

    db.query(TaskModel).filter(TaskModel.user_id == user.id).delete()
    db.delete(user)
    db.commit()

    return {"message": "User deleted"}


@router.delete("/account")
def delete_account(
    request: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    db.query(TaskModel).filter(TaskModel.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()

    return {"message": "Account deleted successfully"}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }