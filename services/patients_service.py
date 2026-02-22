from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from core.password_hasher import PasswordHasher
from models import courses
from repositories.courses_repository import CoursesRepository
from repositories.patients_repository import PatientsRepository
from shcemas.patient_schemas import ChangePatient, ChangePatientPassword, PatientsResponse


class PatientsService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.patient_repo = PatientsRepository(db=self.db)
        self.course_repo = CoursesRepository(db=self.db)

    async def join_to_course(self, course_id: UUID, patient_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            return {"message": "Patient not found"}
        course.patients.append(patient)
        await self.course_repo.change_entity(course)
        return {"message": "Patient added"}

    async def leave_course(self, course_id: UUID, patient_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            return {"message": "Patient not found"}
        course.patients.remove(patient)
        await self.course_repo.change_entity(course)
        return {"message": "Patient removed"}

    async def get_courses(self, patient_id: UUID):
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            return {"message": "Patient not found"}
        return await self.course_repo.get_patient_courses(patient)
