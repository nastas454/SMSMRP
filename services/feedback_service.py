from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from core.database import get_session_local
from models.associations import PatientCourse
from models.feedback import CourseFeedback
from repositories.feedback_repository import CourseFeedbackRepository
from repositories.patients_repository import PatientsRepository
from shcemas.feedback_schemas import CourseFeedbackCreate, CourseFeedbackResponse


class CourseFeedbackService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.feedback_repo = CourseFeedbackRepository(db)
        self.patients_repo = PatientsRepository(db)

    async def add_feedback(self, patient_id: UUID, course_id: UUID, feedback_in: CourseFeedbackCreate):
        course_exists = await self.patients_repo.get_enrollment(patient_id, course_id)
        if not course_exists:
            raise ValueError(f"Призначений курс не знайдено.")
        feedback_data = CourseFeedback(**feedback_in.model_dump())
        feedback_data.patient_course_id = course_exists.id
        new_feedback = await self.feedback_repo.create(feedback_data)
        return new_feedback

    async def get_feedbacks_for_course(self, patient_id: UUID, course_id: UUID):
        patient_course = await self.patients_repo.get_enrollment(patient_id, course_id)
        if not patient_course:
            raise Exception ("ID not found")
        result = await self.feedback_repo.get_all_for_patient_course(patient_course.id)
        return [CourseFeedbackResponse.model_validate(feedback) for feedback in result]