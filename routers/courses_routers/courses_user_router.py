from typing import Annotated
from fastapi import APIRouter, Depends
from core.auth_tools import get_current_user
from services.courses_servises.courses_users_service import CoursesUsersService

router = APIRouter(prefix="/user/courses", tags=["course(user)"], dependencies=[Depends(get_current_user)])
Service = Annotated[CoursesUsersService, Depends(CoursesUsersService)]

@router.post("/join")
async def join_course(course_service: Service, course_id: int, user_id: int = Depends(get_current_user)):
    return await course_service.join_course(course_id, user_id)

@router.get("/{course_id:int}")
async def get_course(course_service: Service, course_id: int, user_id: int = Depends(get_current_user)):
    return await course_service.get_course(course_id, user_id)

@router.get("")
async def get_all_courses(course_service: Service, user_id: int = Depends(get_current_user)):
    return await course_service.get_all_courses(user_id)

@router.patch("/{course_id:int}")
async def leave_course(course_service: Service, course_id: int, user_id: int = Depends(get_current_user)):
    return await course_service.leave_course(course_id, user_id)

