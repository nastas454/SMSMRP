from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Body
from starlette.responses import JSONResponse

from core.auth_tools import get_current_doctor, get_current_user
from services.courses_service import CoursesService
from shcemas.course_schemas import CoursesCreate

router = APIRouter(prefix="/courses", tags=["course"])
Service = Annotated[CoursesService, Depends(CoursesService)]

@router.post("/create")
async def create_course(course_service: Service, course: CoursesCreate = Body(), doctor_id: UUID = Depends(get_current_doctor)):
    await course_service.create_course(course, doctor_id)
    return JSONResponse(
            status_code=200,
            content={"message": "Course created successfully", "status": "ok"}
        )

@router.get("/{course_id:uuid}", dependencies=[Depends(get_current_doctor), Depends(get_current_user)])
async def get_course(course_service: Service, course_id: UUID):
    return await course_service.get_course(course_id)

@router.delete("/{course_id:uuid}")
async def delete_course(course_service: Service, course_id: UUID, doctor_id: UUID = Depends(get_current_doctor)):
    return await course_service.delete_course(course_id, doctor_id)

