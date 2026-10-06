from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from services.auth import (create_access_token, verify_password, hash_password, get_current_user, require_admin)
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.task import Task as TaskModel
from schemas.user import UserCreate, UserResponse, AdminUserResponse

router = APIRouter()


class DeleteAccountRequest(BaseModel):
    password: str


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "name": current_user.name or "there",
        "email": current_user.email,
        "is_admin": current_user.is_admin
    }


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

    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        is_verified=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


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