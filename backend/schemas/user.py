from pydantic import BaseModel, EmailStr
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr


class AdminUserResponse(UserResponse):
    is_verified: bool
    is_admin: bool

