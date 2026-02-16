from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Form, Depends
from services.auth_services.auth_users_service import AuthUserService
from shcemas.user_schemas import UserCreate, LoginUser

router = APIRouter(prefix="/auth/users", tags=["authorization"])
Service = Annotated[AuthUserService, Depends(AuthUserService)]

@router.post("/register")
async def register_user(auth_service: Service, register_dto: UserCreate=Form()):
    return await auth_service.register_user(register_dto)

@router.post("/login")
async def login_user(auth_service: Service, login_dto: LoginUser=Form()):
    return await auth_service.login_user(login_dto)







