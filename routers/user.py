from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from services.auth import(create_access_token, verify_password, hash_password)
from  fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse 

router = APIRouter()

@router.post(
    "/signup",
    response_model = UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(user: UserCreate, db: Session = Depends(get_db)):
     hashed_password = hash_password(user.password)
     db_user = User(
          email=user.email,
          hashed_password=hashed_password
     )
     db.add(db_user)
     db.commit()
     db.refresh(db_user)
     return db_user


@router.post("/login")
def login(
    form_data:  OAuth2PasswordRequestForm = Depends(),
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

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
                                   