from typing import Optional

from pydantic import BaseModel, EmailStr

from models.enums.sex_enum import Sex


class UsersCreate(BaseModel):
    first_name: str
    last_name: str

    email: EmailStr
    login: str
    password: str

class UsersLogin(BaseModel):
    username: str
    password: str

class ChangeUser(BaseModel):
    first_name: Optional[str] | None = None
    last_name: Optional[str] | None = None