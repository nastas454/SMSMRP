from typing import Annotated
from fastapi import APIRouter, Depends
from core.auth_tools import get_current_admin
from services.courses_servises.courses_admin_servise import CoursesAdminService

router = APIRouter(prefix="/admin/courses", tags=["course(admin)"], dependencies=[Depends(get_current_admin)])
Service = Annotated[CoursesAdminService, Depends(CoursesAdminService)]

@router.get("/{course_id:int}")
async def get_course(course_service: Service, course_id: int):
    return await course_service.get_course(course_id)

@router.get("")
async def get_all_courses(course_service: Service):
    return await course_service.get_all_courses()
