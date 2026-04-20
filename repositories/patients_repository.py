from sqlalchemy import select, exists, UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from models.associations import PatientCourse
from models.courses import Courses
from models.patients import Patients
from repositories.common_repository import CommonRepository

class PatientsRepository(CommonRepository[Patients]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Patients)

    async def  get_patients_on_course(self, course: Courses):
        stmt = (
            select(Patients)
            .join(PatientCourse, Patients.id == PatientCourse.patient_id)
            .where(PatientCourse.course_id == course.id)
        )
        result = await self.db.scalars(stmt)
        return result.all()

    async def get_enrollment(self, patient_id: UUID, course_id: UUID):
        stmt = select(PatientCourse).where(
            PatientCourse.patient_id == patient_id,
            PatientCourse.course_id == course_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()