from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from models.courses import Courses
from repositories.courses_repository import CoursesRepository
from services.s3_service import S3Service
from shcemas.course_schemas import CoursesCreate, CoursesResponse

class CoursesDoctorService:
    def __init__(self, db: AsyncSession = Depends(get_session_local), s3_service: S3Service = Depends(S3Service)):
        self.db = db
        self.repo = CoursesRepository(db=self.db)
        self.s3 = s3_service

    async def create_course(self, course_create_dto: CoursesCreate, doctor_id: int):

        s3_key = self.s3.upload_course_json(course_create_dto.course_content)

        course_for_db = Courses(**course_create_dto.model_dump(exclude={"course_content"}))

        course_for_db.doctor_id = doctor_id
        course_for_db.course_s3_key = s3_key
        await self.repo.create_entity(course_for_db)


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