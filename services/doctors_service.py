from uuid import UUID
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session_local
from repositories.courses_repository import CoursesRepository
from repositories.doctors_repository import DoctorsRepository
from shcemas.course_schemas import CoursesResponse

class DoctorsService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.doctor_repo = DoctorsRepository(db=self.db)
        self.course_repo = CoursesRepository(db=self.db)

    async def get_doctor_courses(self, doctor_id: UUID):
        courses = await self.course_repo.get_doctor_courses(doctor_id)
        if courses is None:
            return {"message": "Course not found"}
        return [CoursesResponse.model_validate(course) for course in courses]