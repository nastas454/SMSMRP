from fastapi import APIRouter
from fastapi.params import Depends, Form
from core.auth_tools import get_current_admin
from services.admin_services.admin_service import AdminService
from shcemas.admin_schemas import AdminCreate

router = APIRouter(prefix="/admin", tags=["management admin (admin only)"], dependencies=[Depends(get_current_admin)])
admin_service = AdminService()

@router.post("/create")
def create_admin(create_dto: AdminCreate=Form(), admin_id: int=Depends(get_current_admin)):
    return admin_service.create_admin(create_dto, admin_id)

@router.get("/me")
def get_me(admin_id: int = Depends(get_current_admin)):
    return admin_service.get_admin(admin_id)

@router.get("/{admin_id:int}")
def get_admin(admin_id: int):
    return admin_service.get_admin(admin_id)

@router.get("")
def get_all_admins():
    return admin_service.get_all_admins()

@router.patch("/{admin_id:int}/deactivate")
def deactivate_admin(admin_id:int, performer_id: int=Depends(get_current_admin)):
    return admin_service.deactivate_admin(admin_id, performer_id)