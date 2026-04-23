from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

class UsersCreate(BaseModel):
    first_name: str
    last_name: str

    email: EmailStr
    login: str
    password: str

class UsersResponse(BaseModel):
    id: UUID
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