from pydantic import EmailStr, BaseModel
from core.database import Base
from models.sex_enum import Sex

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: Sex

    email: EmailStr
    login: str
    password: str

class LoginUser(BaseModel):
    login: str
    password: str