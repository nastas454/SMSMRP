from psycopg2._psycopg import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from models.courses import Courses
from models.users import Users
from repositories.common_repository import CommonRepository

class CoursesRepository(CommonRepository[Courses]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Courses)

    async def get_doctor_one_course(self, course_id: int, doctor_id: int) -> Courses|None:
        stmt = select(Courses).where(Courses.id == course_id, Courses.doctor_id == doctor_id)
        return await self.db.scalar(stmt)

    async def get_doctor_courses(self, doctor_id: int ) -> List[Courses]:
        stmt = select(Courses).where(Courses.doctor_id == doctor_id)
        result = await self.db.scalars(stmt)
        return result.all()

    async def get_user_one_course(self, course_id: int, user: Users) -> Courses|None:
        stmt = select(Courses).where(Courses.id == course_id, Courses.users.contains(user))
        return await self.db.scalar(stmt)

    async def get_user_courses(self, user: Users ) -> List[Courses]:
        stmt = select(Courses).where(Courses.users.contains(user))
        result = await self.db.scalars(stmt)
        return result.all()
