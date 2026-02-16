from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from models.courses import Courses
from repositories.courses_repository import CoursesRepository
from shcemas.course_schemas import CoursesCreate, CoursesResponse

class CoursesDoctorService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = CoursesRepository(db=self.db)

    async def create_course(self, course_create_dto: CoursesCreate, doctor_id: int):
        course = Courses(**course_create_dto.model_dump())
        course.doctor_id = doctor_id
        return CoursesResponse.model_validate(await self.repo.create_entity(course))

    async def get_course(self, course_id: int, doctor_id: int):
        course = await self.repo.get_doctor_one_course(course_id, doctor_id)
        if course is None:
            return {"message": "Course not found"}
        return CoursesResponse.model_validate(course)

    async def get_all_courses(self, doctor_id: int):
        courses = await self.repo.get_doctor_courses(doctor_id)
        if not courses:
            return {"message": "No courses found"}
        return [CoursesResponse.model_validate(course) for course in courses]

    async def delete_course(self, course_id: int, doctor_id: int):
        course = await self.repo.get_doctor_one_course(course_id, doctor_id)
        if course is None:
            return {"message": "Course not found"}
        await self.repo.delete_entity(course)
        return {
            "massage": "successfully deleted course"
        }