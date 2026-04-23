from typing import Optional
from pydantic import BaseModel, ConfigDict
from models.enums.sex_enum import Sex

class PatientCreate(BaseModel):
    age: int
    sex: Sex

class PatientsResponse(BaseModel):
    age: int
    sex: Sex

    model_config = ConfigDict(from_attributes=True)

class ChangePatient(BaseModel):
    age: Optional[int]|None = None

