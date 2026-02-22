from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Form, Depends, Body

from services.auth_service import AuthService
from shcemas.patient_schemas import PatientCreate
from shcemas.users_schemas import UsersLogin, UsersCreate

router = APIRouter(prefix="/auth/users", tags=["authorization"])
Service = Annotated[AuthService, Depends(AuthService)]

@router.post("/login")
async def login_user(auth_service: Service, login_dto: UsersLogin=Form()):
    return await auth_service.login_user(login_dto)

@router.post("/register")
async def register_user(auth_service: Service, register_user_dto: UsersCreate=Body, register_patient_dto: PatientCreate=Body):
    return await auth_service.register_patient(register_user_dto, register_patient_dto)

