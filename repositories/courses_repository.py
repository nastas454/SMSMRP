from uuid import UUID

from psycopg2._psycopg import List
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload

from models.associations import PatientCourse
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

    async def get_patient_courses(self, patient: Patients) -> List[Courses]:
        stmt = (
            select(Courses, PatientCourse.is_active, PatientCourse.progress)
            .join(PatientCourse, Courses.id == PatientCourse.course_id)
            .where(PatientCourse.patient_id == patient.id)
        )
        result = await self.db.execute(stmt)
        courses_with_status = []
        for course_obj, is_active_status, progress_val in result.all():
            course_obj.is_active = is_active_status
            course_obj.progress = progress_val
            courses_with_status.append(course_obj)
        return courses_with_status

    async def add_patient_to_course(self, course_id: UUID, patient_id: UUID):
        new_enrollment = PatientCourse(
            course_id=course_id,
            patient_id=patient_id
        )
        self.db.add(new_enrollment)
        await self.db.commit()