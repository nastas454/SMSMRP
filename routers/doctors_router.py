from fastapi import APIRouter, Depends
from core.auth_tools import get_current_doctor
from services.doctors_service import DoctorsService

router = APIRouter(prefix="/doctors", tags=["doctors"], dependencies=[Depends(get_current_doctor)])
doctors_service = DoctorsService()

@router.get("/me")
def get_me(doctor_id: int = Depends(get_current_doctor)):
    return doctors_service.get_doctor(doctor_id)

@router.delete("/delete_me")
def delete_me(doctor_id: int = Depends(get_current_doctor)):
    return doctors_service.delete_doctor(doctor_id)
