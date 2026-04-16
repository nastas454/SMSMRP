from typing import Self
from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import SessionLocal, get_session_local
from models.courses import Courses
from repositories.courses_repository import CoursesRepository
from repositories.doctors_repository import DoctorsRepository
from repositories.patients_repository import PatientsRepository
from services.s3_service import S3Service
from shcemas.course_schemas import CoursesCreate, CoursesResponse
from shcemas.patient_schemas import PatientsResponse


class CoursesService:
    def __init__(self, db: AsyncSession = Depends(get_session_local), s3_service: S3Service = Depends(S3Service)):
        self.db = db
        self.course_repo = CoursesRepository(db=self.db)
        self.patient_repo = PatientsRepository(db=self.db)
        self.doctor_repo = DoctorsRepository(db=self.db)
        self.s3 = s3_service

    async def create_course(self, course_create_dto: CoursesCreate, doctor_id: UUID):
        s3_key = self.s3.upload_course_json(course_create_dto.course_content)
        course_for_db = Courses(**course_create_dto.model_dump(exclude={"course_content"}))
        course_for_db.doctor_id = doctor_id
        course_for_db.course_s3_key = s3_key
        doctor = await self.doctor_repo.get_by_id(doctor_id)
        course_for_db.doctor_name = doctor.first_name
        course_for_db.doctor_lastname = doctor.last_name
        await self.course_repo.create_entity(course_for_db)

    async def get_course(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        return CoursesResponse.model_validate(course)

    async def delete_course(self, course_id: UUID, doctor_id: UUID):
        course = await self.course_repo.get_doctor_one_course(course_id, doctor_id)
        if course is None:
            return {"message": "Course not found"}
        await self.course_repo.delete_entity(course)
        return {
            "massage": "successfully deleted course"
        }

    async def get_patients_on_course(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        patients = await self.patient_repo.get_patients_on_course(course)
        if not patients:
            return {"message": "Patients not found"}
        return patients

    async def get_course_content(self, course_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        s3_key = course.course_s3_key
        if not s3_key:
            return {"message": "Course content key is missing"}
        try:
            content = self.s3.get_course_json(s3_key)
            return content
        except Exception as e:
            return {"message": f"Failed to fetch content from storage: {str(e)}"}