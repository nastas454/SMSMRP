from typing import Annotated
from uuid import UUID

from fastapi import APIRouter
from fastapi.params import Depends, Form
from psycopg2.extras import UUID_adapter
from pydantic import EmailStr
from core.auth_tools import get_current_user
from services.patients_service import PatientsService
from shcemas.patient_schemas import ChangePatient, ChangePatientPassword

router = APIRouter(prefix="/patients", tags=["patients"], dependencies=[Depends(get_current_user)])
Service = Annotated[PatientsService, Depends(PatientsService)]

@router.get("/courses")
async def get_patient_courses(patients_service: Service, patient_id: UUID= Depends(get_current_user)):
    return await patients_service.get_courses(patient_id)

@router.post("/{course_id:uuid}/join")
async def join_to_course(patients_service: Service, course_id: UUID, patient_id: UUID= Depends(get_current_user)):
    return await patients_service.join_to_course(course_id, patient_id)

@router.delete("/{course_id:uuid}/leave")
async def leave_course(patients_service: Service, course_id: UUID, patient_id: UUID= Depends(get_current_user)):
    return await patients_service.leave_course(course_id, patient_id)