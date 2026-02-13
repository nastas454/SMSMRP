from fastapi import APIRouter, Depends
from fastapi.params import Form
from core.auth_tools import get_current_user
from services.doctors_admin_service import DoctorsAdminService
from shcemas.doctor_schemas import DoctorsResponse, DoctorCreate

router = APIRouter(prefix="/admin/doctors", tags=["лікарський адмін"], dependencies=[Depends(get_current_user)])
doctors_admin_service = DoctorsAdminService()

@router.post("/create", response_model=DoctorsResponse)
def create_doctor(doctor: DoctorCreate = Form()):
    return doctors_admin_service.register_doctor(doctor)

