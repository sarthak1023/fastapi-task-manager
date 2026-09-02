import code

from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta

from backend.schemas import user
from services.auth import (create_access_token, verify_password, hash_password)
from services.email_services import generate_verification_code, send_verification_email
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse
from models.task import Task as TaskModel

router = APIRouter()


class VerifyRequest(BaseModel):
    email: str
    code: str


class ResendCodeRequest(BaseModel):
    email: str


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    hashed_password = hash_password(user.password)

    code = generate_verification_code()
    expiry = datetime.utcnow() + timedelta(minutes=10)

    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        is_verified=False,
        verification_code=code,
        verification_code_expires=expiry
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    try:
             send_verification_email(user.email, code)
    except Exception as e:
             print(f"Failed to send verification email: {e}")
    # Don't crash signup just because email failed — user is created, they just won't get the code

    return db_user

@router.post("/verify")
def verify(request: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Already verified"}

    if user.verification_code_expires and datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    if user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-code")
def resend_code(request: ResendCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Already verified"}

    code = generate_verification_code()
    user.verification_code = code
    user.verification_code_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    send_verification_email(user.email, code)

    return {"message": "Verification code resent"}


@router.delete("/users/{email}")
def delete_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete this user's tasks first, to avoid a foreign key conflict in Postgres
    db.query(TaskModel).filter(TaskModel.user_id == user.id).delete()

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }