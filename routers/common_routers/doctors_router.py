from fastapi import APIRouter, Depends
from fastapi.params import Form
from core.auth_tools import get_current_doctor
from services.common_services.doctors_service import DoctorsService
from shcemas.doctor_schemas import ChangeDoctorPassword

router = APIRouter(prefix="/doctors", tags=["doctors"], dependencies=[Depends(get_current_doctor)])
doctors_service = DoctorsService()

@router.get("/me")
def get_me(doctor_id: int = Depends(get_current_doctor)):
    return doctors_service.get_doctor(doctor_id)

@router.patch("/password")
def change_password_doctor(new_password: ChangeDoctorPassword = Form(), doctor_id: int = Depends(get_current_doctor)):
    return doctors_service.change_doctor_password(doctor_id, new_password)

@router.delete("/delete_me")
def delete_me(doctor_id: int = Depends(get_current_doctor)):
    return doctors_service.delete_doctor(doctor_id)
