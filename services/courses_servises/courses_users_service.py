from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from repositories.courses_repository import CoursesRepository
from repositories.users_repository import UsersRepository
from shcemas.course_schemas import CoursesResponse

class CoursesUsersService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.course_repo = CoursesRepository(db=self.db)
        self.users_repo = UsersRepository(db=self.db)

    async def join_course(self, course_id: int, users_id: int):
        course = await self.course_repo.get_by_id(course_id)
        if course is None:
            return {"message": "Course not found"}
        user = await self.users_repo.get_by_id(users_id)
        course.users.append(user)
        await self.course_repo.change_entity(course)
        return {"message": "You have joined the course"}

    async def get_course(self, course_id: int, users_id: int):
        user = await self.users_repo.get_by_id(users_id)
        course = await self.course_repo.get_user_one_course(course_id, user)
        if course is None:
            return {"message": "Course not found"}
        return CoursesResponse.model_validate(course)

    async def get_all_courses(self, users_id: int):
        user = await self.users_repo.get_by_id(users_id)
        courses = await self.course_repo.get_user_courses(user)
        if not courses:
            return {"message": "No courses found"}
        return [CoursesResponse.model_validate(course) for course in courses]

    async def leave_course(self, course_id: int, users_id: int):
        user = await self.users_repo.get_by_id(users_id)
        course = await self.course_repo.get_user_one_course(course_id, user)
        if course is None:
            return {"message": "Course not found"}
        course.users.remove(user)
        await self.course_repo.change_entity(course)
        return {
            "massage": "You successfully leave the course"
        }