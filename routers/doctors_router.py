from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends

from core.auth_tools import get_current_payload, require_doctor
from services.doctors_service import DoctorsService

router = APIRouter(prefix="/doctors", tags=["doctors"], dependencies=[Depends(get_current_payload),Depends(require_doctor)])
Service = Annotated[DoctorsService, Depends(DoctorsService)]

@router.get("/courses")
async def get_courses(course_service: Service, doctor_id: dict = Depends(get_current_payload)):
    return await course_service.get_doctor_courses(doctor_id.get("id"))

