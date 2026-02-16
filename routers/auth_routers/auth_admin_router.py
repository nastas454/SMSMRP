from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Form, Depends
from services.auth_services.auth_admin_service import AuthAdminService
from shcemas.admin_schemas import AdminLogin

router = APIRouter(prefix="/auth/admin", tags=["authorization"])
Service = Annotated[AuthAdminService, Depends(AuthAdminService)]

@router.post("/login")
async def login_admin(admin_service: Service, login_dto: AdminLogin=Form()):
    return await admin_service.login_admin(login_dto)

