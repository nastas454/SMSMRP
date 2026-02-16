from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.params import Form
from core.auth_tools import get_current_doctor
from services.common_services.doctors_service import DoctorsService
from shcemas.doctor_schemas import ChangeDoctorPassword

router = APIRouter(prefix="/doctors", tags=["doctors"], dependencies=[Depends(get_current_doctor)])
Service = Annotated[DoctorsService, Depends(DoctorsService)]

@router.get("/me")
async def get_me(doctors_service: Service, doctor_id: int = Depends(get_current_doctor)):
    return await doctors_service.get_doctor(doctor_id)

@router.patch("/password")
async def change_password_doctor(doctors_service: Service, new_password: ChangeDoctorPassword = Form(), doctor_id: int = Depends(get_current_doctor)):
    return await doctors_service.change_doctor_password(doctor_id, new_password)

@router.delete("/delete_me")
async def delete_me(doctors_service: Service, doctor_id: int = Depends(get_current_doctor)):
    return await doctors_service.delete_doctor(doctor_id)
