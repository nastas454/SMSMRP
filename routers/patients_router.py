from typing import Annotated
from uuid import UUID
from fastapi import APIRouter
from fastapi.params import Depends
from core.auth_tools import get_current_payload, require_patient
from services.patients_service import PatientsService
from shcemas.patient_schemas import PatientsResponse

router = APIRouter(prefix="/patients", tags=["patients"], dependencies=[Depends(get_current_payload), Depends(require_patient)])
Service = Annotated[PatientsService, Depends(PatientsService)]

@router.get("/me", response_model=PatientsResponse)
async def get_patient(patients_service: Service, patient_id: dict= Depends(get_current_payload)):
    return await patients_service.get_patient(patient_id.get("id"))

@router.get("/courses")
async def get_patient_courses(patients_service: Service, patient_id: dict= Depends(get_current_payload)):
    return await patients_service.get_courses(patient_id.get("id"))

@router.put("/me/age", response_model=PatientsResponse)
async def change_age(patients_service: Service, new_age: int, patient_id: dict= Depends(get_current_payload)):
    return await patients_service.change_age(patient_id.get("id"), new_age)

@router.post("/{course_id:uuid}/join")
async def join_to_course(patients_service: Service, course_id: UUID, patient_id: dict= Depends(get_current_payload)):
    return await patients_service.join_to_course(course_id, patient_id.get("id"))

@router.delete("/{course_id:uuid}/leave")
async def leave_course(patients_service: Service, course_id: UUID, patient_id: dict= Depends(get_current_payload)):
    return await patients_service.leave_course(course_id, patient_id.get("id"))