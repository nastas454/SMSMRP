from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from models.feedback import CourseFeedback

class CourseFeedbackRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, feedback_data: CourseFeedback) -> CourseFeedback:
        self.db.add(feedback_data)
        await self.db.commit()
        await self.db.refresh(feedback_data)
        return feedback_data

    async def get_by_id(self, feedback_id: UUID) -> CourseFeedback | None:
        stmt = select(CourseFeedback).where(CourseFeedback.id == feedback_id)
        result = await self.db.scalar(stmt)
        return result

    async def get_all_for_patient_course(self, patient_course_id: UUID):
        stmt = select(CourseFeedback).where(CourseFeedback.patient_course_id == patient_course_id).order_by(CourseFeedback.created_at.desc())
        result = await self.db.scalars(stmt)
        return result.all()