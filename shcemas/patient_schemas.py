from typing import Optional
from pydantic import EmailStr, BaseModel, ConfigDict
from models.enums.sex_enum import Sex
from shcemas.users_schemas import UsersCreate


class PatientCreate(BaseModel):
    age: int
    sex: Sex

class PatientsResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: int
    sex: Sex
    email: EmailStr
    login: str

    model_config = ConfigDict(from_attributes=True)

class ChangePatient(BaseModel):
    first_name: Optional[str]|None = None
    last_name: Optional[str]|None = None
    age: Optional[str]|None = None

class ChangePatientPassword(BaseModel):
    password: str
    confirm_password: str