from fastapi import APIRouter
from fastapi.params import Depends, Form
from core.auth_tools import get_current_admin
from services.admin_service import AdminService
from shcemas.admin_schemas import AdminCreate, AdminLogin

router = APIRouter(prefix="/admin", tags=["admin"])
admin_service = AdminService()

@router.post("/create")
def create_admin(create_dto: AdminCreate=Form(), admin_id: int=Depends(get_current_admin)):
    return admin_service.create_admin(create_dto, admin_id)

@router.post("login")
def login_admin(login_dto: AdminLogin=Form()):
    return admin_service.login_admin(login_dto)

@router.patch("/{admin_id:int}/deactivate", dependencies=[Depends(get_current_admin)])
def deactivate_admin(admin_id:int, performer_id: int=Depends(get_current_admin)):
    return admin_service.deactivate_admin(admin_id, performer_id)