from sqlalchemy import select, exists, UUID
from sqlalchemy.ext.asyncio import AsyncSession
from models.associations import PatientCourse
from models.courses import Courses
from models.patients import Patients
from repositories.common_repository import CommonRepository

class PatientsRepository(CommonRepository[Patients]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Patients)

    async def  get_patients_on_course(self, course: Courses):
        stmt = (
            select(Patients, PatientCourse.is_active, PatientCourse.current_unlocked_day)
            .join(PatientCourse, Patients.id == PatientCourse.patient_id)
            .where(PatientCourse.course_id == course.id)
        )
        result = await self.db.execute(stmt)
        patients= []
        for patient_obj, active, unlock_lesson in result.all():
            patient_obj.current_unlocked_day = unlock_lesson
            patient_obj.is_course_active = active
            patients.append(patient_obj)
        return patients

    async def get_enrollment(self, patient_id: UUID, course_id: UUID):
        stmt = select(PatientCourse).where(
            PatientCourse.patient_id == patient_id,
            PatientCourse.course_id == course_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()