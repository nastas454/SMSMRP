import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CoursesCreate(BaseModel):
    course_name: str
    description : str
    injuries: list[str]
    course_content : dict[str, Any]

class CoursesResponse(BaseModel):
    id: uuid.UUID
    course_name: str
    injuries: list[str]
    doctor_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
