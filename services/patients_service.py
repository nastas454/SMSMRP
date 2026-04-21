from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

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

    async def get_patient(self, patient_id: UUID):
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            return {"message": "Patient not found"}
        return patient

    async def join_to_course(self, course_id: UUID, patient_id: UUID):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            return {"message": "Patient not found"}
        patient_course = await self.patient_repo.get_enrollment(patient_id, course_id)
        if patient_course is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ви вже доєднані до курсу"
            )
        await self.course_repo.add_patient_to_course(course_id, patient_id)
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

    async def change_age(self, patient_id: UUID, new_age: int):
        patient = await self.patient_repo.get_by_id(patient_id)
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пацієнта не знайдено"
            )
        patient.age = new_age
        return await self.patient_repo.change_entity(patient)

