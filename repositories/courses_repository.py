from uuid import UUID

from psycopg2._psycopg import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from models.courses import Courses
from models.patients import Patients
from repositories.common_repository import CommonRepository

class CoursesRepository(CommonRepository[Courses]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Courses)

    async def get_doctor_one_course(self, course_id: UUID, doctor_id: UUID) -> Courses|None:
        stmt = select(Courses).where(Courses.id == course_id, Courses.doctor_id == doctor_id)
        return await self.db.scalar(stmt)

    async def get_doctor_courses(self, doctor_id: UUID ) -> List[Courses]:
        stmt = select(Courses).where(Courses.doctor_id == doctor_id)
        result = await self.db.scalars(stmt)
        return result.all()

    async def get_patient_courses(self, patient: Patients ) -> List[Courses]:
        stmt = select(Courses).where(Courses.patients.contains(patient))
        result = await self.db.scalars(stmt)
        return result.all()
