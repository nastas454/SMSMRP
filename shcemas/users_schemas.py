from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from models.enums.sex_enum import Sex


class UsersCreate(BaseModel):
    first_name: str
    last_name: str

    email: EmailStr
    login: str
    password: str

class UsersResponse(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    login: str

    model_config = ConfigDict(from_attributes=True)

class UsersLogin(BaseModel):
    username: str
    password: str

class ChangeUser(BaseModel):
    first_name: Optional[str] | None = None
    last_name: Optional[str] | None = None