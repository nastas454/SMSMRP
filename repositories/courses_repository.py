from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.associations import PatientCourse
from models.courses import Courses
from models.patients import Patients
from models.user import Users
from repositories.common_repository import CommonRepository

class CoursesRepository(CommonRepository[Courses]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Courses)

    async def get_course(self, course_id: UUID) -> Courses | None:
        stmt = (
            select(Courses, Users.first_name, Users.last_name)
            .join(Users, Courses.doctor_id == Users.id)
            .where(Courses.id == course_id)
        )
        result = await self.db.execute(stmt)
        row = result.first()
        course_obj, f_name, l_name = row
        course_obj.doctor_name = f_name
        course_obj.doctor_lastname = l_name
        return course_obj


    async def get_doctor_one_course(self, course_id: UUID, doctor_id: UUID) -> Courses|None:
        stmt = select(Courses).where(Courses.id == course_id, Courses.doctor_id == doctor_id)
        return await self.db.scalar(stmt)

    async def get_doctor_courses(self, doctor_id: UUID) -> list[Courses]:
        stmt = (
            select(Courses, Users.first_name, Users.last_name)
            .join(Users, Courses.doctor_id == Users.id)
            .where(Courses.doctor_id == doctor_id)
        )
        result = await self.db.execute(stmt)
        courses = []
        for course_obj, f_name, l_name in result.all():
            course_obj.doctor_name = f_name
            course_obj.doctor_lastname = l_name
            courses.append(course_obj)
        return courses

    async def get_patient_courses(self, patient: Patients) -> list[Courses]:
        stmt = (
            select(Courses, PatientCourse.is_active, PatientCourse.progress, Users.first_name, Users.last_name)
            .join(PatientCourse, Courses.id == PatientCourse.course_id)
            .join(Users, Courses.doctor_id == Users.id)
            .where(PatientCourse.patient_id == patient.id)
        )
        result = await self.db.execute(stmt)
        courses_with_status = []
        for course_obj, is_active_status, progress_val, f_name, l_name in result.all():
            course_obj.is_active = is_active_status
            course_obj.progress = progress_val
            course_obj.doctor_name = f_name
            course_obj.doctor_lastname = l_name
            courses_with_status.append(course_obj)
        return courses_with_status

    async def add_patient_to_course(self, course_id: UUID, patient_id: UUID):
        new_enrollment = PatientCourse(
            course_id=course_id,
            patient_id=patient_id
        )
        self.db.add(new_enrollment)
        await self.db.commit()

