import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


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
