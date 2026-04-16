from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Body
from starlette.responses import JSONResponse

from core.auth_tools import get_current_payload, require_doctor, require_doctor_or_patient
from services.courses_service import CoursesService
from shcemas.course_schemas import CoursesCreate

router = APIRouter(prefix="/courses", tags=["course"], dependencies=[Depends(get_current_payload)])
Service = Annotated[CoursesService, Depends(CoursesService)]

@router.post("/create", dependencies= [Depends(require_doctor)])
async def create_course(course_service: Service, course: CoursesCreate = Body(), doctor_id: dict = Depends(get_current_payload)):
    await course_service.create_course(course, doctor_id.get("id"))
    return JSONResponse(
            status_code=200,
            content={"message": "Course created successfully", "status": "ok"}
        )

@router.get("/{course_id:uuid}", dependencies=[Depends(require_doctor_or_patient)])
async def get_course(course_service: Service, course_id: UUID):
    return await course_service.get_course(course_id)

@router.get("/{course_id:uuid}/patients", dependencies=[Depends(require_doctor)])
async def get_patients_on_course(course_service: Service, course_id: UUID):
    return await course_service.get_patients_on_course(course_id)

@router.delete("/{course_id:uuid}", dependencies= [Depends(require_doctor)])
async def delete_course(course_service: Service, course_id: UUID, doctor_id: dict = Depends(get_current_payload)):
    return await course_service.delete_course(course_id, doctor_id.get("id"))


@router.get("/{course_id:uuid}/content", dependencies=[Depends(require_doctor_or_patient)])
async def get_course_content(course_service: Service, course_id: UUID):
    content = await course_service.get_course_content(course_id)
    if isinstance(content, dict) and "message" in content and len(content) == 1:
        return JSONResponse(status_code=404, content=content)
    return content
