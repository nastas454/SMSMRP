from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from repositories.courses_repository import CoursesRepository
from shcemas.course_schemas import CoursesResponse

class CoursesAdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = CoursesRepository(db=self.db)

    async def get_course(self, course_id: int):
        course = await self.repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        return CoursesResponse.model_validate(course)

    async def get_all_courses(self):
        courses = await self.repo.get_all()
        if not courses:
            return {"message": "No courses found"}
        return [CoursesResponse.model_validate(course) for course in courses]
