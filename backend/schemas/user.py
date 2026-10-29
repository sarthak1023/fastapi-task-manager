from pydantic import BaseModel, EmailStr, Field
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


class EmailRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

