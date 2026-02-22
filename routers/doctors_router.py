from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from core.auth_tools import get_current_doctor
from services.doctors_service import DoctorsService

router = APIRouter(prefix="/doctors", tags=["doctors"], dependencies=[Depends(get_current_doctor)])
Service = Annotated[DoctorsService, Depends(DoctorsService)]

@router.get("/courses")
async def get_courses(course_service: Service, doctor_id: UUID = Depends(get_current_doctor)):
    return await course_service.get_doctor_courses(doctor_id)