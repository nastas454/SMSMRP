from typing import Optional
from pydantic import EmailStr, BaseModel, ConfigDict
from models.enums.sex_enum import Sex

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: Sex

    email: EmailStr
    login: str
    password: str

class UsersResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: int
    sex: Sex
    email: EmailStr
    login: str

    model_config = ConfigDict(from_attributes=True)

class LoginUser(BaseModel):
    username: str
    password: str

class ChangeUser(BaseModel):
    first_name: Optional[str]|None = None
    last_name: Optional[str]|None = None
    age: Optional[str]|None = None

class ChangeUserPassword(BaseModel):
    password: str
    confirm_password: str