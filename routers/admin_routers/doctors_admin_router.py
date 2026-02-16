from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.params import Form
from core.auth_tools import get_current_admin
from services.admin_services.doctors_admin_service import DoctorsAdminService
from shcemas.doctor_schemas import DoctorsResponse, DoctorCreate

router = APIRouter(prefix="/admin/doctors", tags=["management doctors (admin only)"], dependencies=[Depends(get_current_admin)])
Service = Annotated[DoctorsAdminService, Depends(DoctorsAdminService)]

@router.post("/create", response_model=DoctorsResponse)
async def create_doctor(doctors_admin_service: Service, doctor: DoctorCreate = Form()):
    return await doctors_admin_service.register_doctor(doctor)

@router.get("/{doctor_id:int}")
async def get_doctor(doctors_admin_service: Service, doctor_id: int):
    return await doctors_admin_service.get_doctor(doctor_id)

@router.get("")
async def get_all_doctors(doctors_admin_service: Service):
    return await doctors_admin_service.get_all_doctors()

@router.patch("/{doctor_id:int}")
async def deactivate_doctor(doctors_admin_service: Service, doctor_id: int, performer_id: int=Depends(get_current_admin)):
    return await doctors_admin_service.deactivate_doctor(doctor_id, performer_id)