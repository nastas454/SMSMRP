from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID

class CourseFeedbackCreate(BaseModel):
    pain_level: int = Field(..., ge=1, le=10, description="Рівень болю від 1 до 10")
    difficulty_level: int = Field(..., ge=1, le=10, description="Рівень тяжкості від 1 до 10")
    session_number: int = Field(..., gt=0, description="Номер заняття")
    note: Optional[str] = None

class CourseFeedbackResponse(CourseFeedbackCreate):
    id: UUID
    patient_course_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)