from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Form, Depends
from services.auth_services.auth_doctor_service import AuthDoctorsService
from shcemas.doctor_schemas import DoctorLogin

router = APIRouter(prefix="/auth/doctors", tags=["authorization"])
Service = Annotated[AuthDoctorsService, Depends(AuthDoctorsService)]

@router.post("/login")
async def login_doctor(doctor_service: Service, login_dto: DoctorLogin=Form()):
    return await doctor_service.login_doctor(login_dto)
