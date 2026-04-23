import uuid
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from models.enums.sex_enum import Sex

class CoursesCreate(BaseModel):
    course_name: str
    description : str
    injuries: list[str]
    course_length: int
    course_content : dict[str, Any]

class CoursesResponse(BaseModel):
    id: uuid.UUID
    course_name: str
    injuries: list[str]
    description: str
    doctor_id: uuid.UUID
    course_s3_key: str
    doctor_name: str
    doctor_lastname: str
    is_active: bool = True
    progress: int = 0
    course_length: int = 0

    model_config = ConfigDict(from_attributes=True)

class CoursesUpdate(BaseModel):
    course_name: Optional[str] = None
    description: Optional[str] = None
    injuries: Optional[list[str]] = None
    course_length: Optional[int] = None
    course_content: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class PatientsOnCourseResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name:str
    sex: Sex
    age: int
    email: EmailStr
    current_unlocked_day: int
    is_course_active: bool

    model_config = ConfigDict(from_attributes=True)