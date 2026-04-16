from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from models.courses import Courses
from models.patients import Patients
from repositories.common_repository import CommonRepository

class PatientsRepository(CommonRepository[Patients]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Patients)

    async def  get_patients_on_course(self, course: Courses):
        stmt = select(Patients).where(Patients.courses.contains(course))
        result = await self.db.scalars(stmt)
        return result.all()
