from typing import Annotated
from uuid import UUID
from fastapi import APIRouter
from fastapi.params import Depends, Form

from core.auth_tools import get_current_payload, RoleChecker, require_admin
from models.enums.role_enum import Role
from services.admin_service import AdminService
from shcemas.users_schemas import UsersCreate

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_payload, require_admin)])
Service = Annotated[AdminService, Depends(AdminService)]

@router.post("/create")
async def create_admin(admin_service:Service, create_dto: UsersCreate=Form(), admin_id: UUID=Depends(get_current_payload)):
    return await admin_service.create_admin(create_dto, admin_id)

@router.post("/doctor/create")
async def create_doctor(admin_service:Service, create_dto: UsersCreate=Form()):
    return await admin_service.create_doctor(create_dto)

@router.get("admins")
async def get_all_admins(admin_service:Service):
    return await admin_service.get_all_admins()

@router.get("doctors")
async def get_all_doctors(admin_service:Service):
    return await admin_service.get_all_doctors()

@router.get("patients")
async def get_all_patients(admin_service:Service):
    return await admin_service.get_all_patients()

@router.delete("/{user_id:uuid}/deactivate")
async def deactivate_user(admin_service:Service, user_id:UUID, performer_id: UUID=Depends(get_current_payload)):
    return await admin_service.change_activity_status(user_id, performer_id, False)

@router.patch("/{user_id:uuid}/activate")
async def activate_user(admin_service:Service, user_id:UUID, performer_id: UUID=Depends(get_current_payload)):
    return await admin_service.change_activity_status(user_id, performer_id, True)