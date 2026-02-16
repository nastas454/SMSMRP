from pydantic import BaseModel, ConfigDict

class CoursesCreate(BaseModel):
    course_name: str
    injuries: list[str]

class CoursesResponse(BaseModel):
    id: int
    course_name: str
    injuries: list[str]
    doctor_id: int

    model_config = ConfigDict(from_attributes=True)
