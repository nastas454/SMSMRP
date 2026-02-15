from fastapi import APIRouter
from fastapi.params import Form
from services.auth_services.auth_admin_service import AuthAdminService
from shcemas.admin_schemas import AdminLogin

router = APIRouter(prefix="/auth/admin", tags=["authorization"])
admin_service = AuthAdminService()

@router.post("/login")
def login_admin(login_dto: AdminLogin=Form()):
    return admin_service.login_admin(login_dto)

