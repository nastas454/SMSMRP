from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Depends, Form
from core.auth_tools import get_current_admin
from services.admin_services.admin_service import AdminService
from shcemas.admin_schemas import AdminCreate

router = APIRouter(prefix="/admin", tags=["management admin (admin only)"], dependencies=[Depends(get_current_admin)])
Service = Annotated[AdminService, Depends(AdminService)]

@router.post("/create")
async def create_admin(admin_service:Service, create_dto: AdminCreate=Form(), admin_id: int=Depends(get_current_admin)):
    return await admin_service.create_admin(create_dto, admin_id)

@router.get("/me")
async def get_me(admin_service:Service, admin_id: int = Depends(get_current_admin)):
    return await admin_service.get_admin(admin_id)

@router.get("/{admin_id:int}")
async def get_admin(admin_service:Service, admin_id: int):
    return await admin_service.get_admin(admin_id)

@router.get("")
async def get_all_admins(admin_service:Service):
    return await admin_service.get_all_admins()

@router.patch("/{admin_id:int}/deactivate")
async def deactivate_admin(admin_service:Service, admin_id:int, performer_id: int=Depends(get_current_admin)):
    return await admin_service.deactivate_admin(admin_id, performer_id)