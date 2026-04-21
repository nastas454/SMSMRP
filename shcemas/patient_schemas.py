from typing import Optional
from pydantic import EmailStr, BaseModel, ConfigDict
from models.enums.sex_enum import Sex
from shcemas.users_schemas import UsersCreate


class PatientCreate(BaseModel):
    age: int
    sex: Sex

class PatientsResponse(BaseModel):
    age: int
    sex: Sex

    model_config = ConfigDict(from_attributes=True)

class ChangePatient(BaseModel):
    age: Optional[int]|None = None

class ChangePatientPassword(BaseModel):
    password: str
    confirm_password: str