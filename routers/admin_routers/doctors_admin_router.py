from fastapi import APIRouter, Depends
from fastapi.params import Form
from core.auth_tools import get_current_admin
from services.admin_services.doctors_admin_service import DoctorsAdminService
from shcemas.doctor_schemas import DoctorsResponse, DoctorCreate

router = APIRouter(prefix="/admin/doctors", tags=["management doctors (admin only)"], dependencies=[Depends(get_current_admin)])
doctors_admin_service = DoctorsAdminService()

@router.post("/create", response_model=DoctorsResponse)
def create_doctor(doctor: DoctorCreate = Form()):
    return doctors_admin_service.register_doctor(doctor)

@router.get("/{doctor_id:int}")
def get_doctor(doctor_id: int):
    return doctors_admin_service.get_doctor(doctor_id)

@router.get("")
def get_all_doctors():
    return doctors_admin_service.get_all_doctors()

@router.patch("/{doctor_id:int}")
def deactivate_doctor(doctor_id: int, performer_id: int=Depends(get_current_admin)):
    return doctors_admin_service.deactivate_doctor(doctor_id, performer_id)