from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default="")
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String, nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)
    reset_code = Column(String, nullable=True)