from pathlib import Path

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
from datetime import UTC, datetime, timedelta
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set. Copy backend/.env.example to backend/.env and fill it in.")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Same rules as the checklist in frontend/src/utils/password.js
PASSWORD_RULES = [
    (lambda p: len(p) >= 8, "at least 8 characters"),
    (lambda p: any(c.isupper() for c in p), "an uppercase letter"),
    (lambda p: any(c.islower() for c in p), "a lowercase letter"),
    (lambda p: any(c.isdigit() for c in p), "a number"),
    (lambda p: any(not c.isalnum() and not c.isspace() for c in p), "a special character"),
]


def check_password_strength(password: str):
    # Raise a 400 listing every rule the password breaks, e.g. "Password must contain a number, a special character"
    missing = [description for rule, description in PASSWORD_RULES if not rule(password)]
    if missing:
        raise HTTPException(status_code=400, detail="Password must contain " + ", ".join(missing))


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# protecting routes with JWT authentication


def get_current_user(token:str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user

        

