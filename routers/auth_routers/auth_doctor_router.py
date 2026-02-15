from fastapi import APIRouter
from fastapi.params import Form
from services.auth_services.auth_doctor_service import AuthDoctorsService
from shcemas.doctor_schemas import DoctorLogin

router = APIRouter(prefix="/auth/doctors", tags=["authorization"])
doctor_service = AuthDoctorsService()

@router.post("/login")
def login_doctor(login_dto: DoctorLogin=Form()):
    return doctor_service.login_doctor(login_dto)
