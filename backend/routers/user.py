from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from backend.services.auth import (create_access_token, verify_password, hash_password)
from backend.services.email_services import generate_verification_code, send_verification_email
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserResponse

router = APIRouter()


# NEW: schema for the verify endpoint's request body
class VerifyRequest(BaseModel):
    email: str
    code: str


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

    # NEW: generate a code and store it, unverified for now
    code = generate_verification_code()

    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        is_verified=False,
        verification_code=code
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # NEW: actually send the email
    send_verification_email(user.email, code)

    return db_user


# NEW: verify endpoint
@router.post("/verify")
def verify(request: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Already verified"}

    if user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.is_verified = True
    user.verification_code = None  # clear it, no longer needed
    db.commit()

    return {"message": "Email verified successfully"}


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

    # NEW: block login if the account isn't verified yet
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

@router.delete("/users/{email}")
def delete_user(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}