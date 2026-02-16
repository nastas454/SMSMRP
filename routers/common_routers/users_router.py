from typing import Annotated
from fastapi import APIRouter
from fastapi.params import Depends, Form
from pydantic import EmailStr
from core.auth_tools import get_current_user
from services.common_services.users_service import UsersService
from shcemas.user_schemas import ChangeUser, ChangeUserPassword

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])
Service = Annotated[UsersService, Depends(UsersService)]

@router.get("/me")
async def get_me(users_service: Service, user_id: int = Depends(get_current_user)):
    return await users_service.get_one_user(user_id)

@router.patch("/me")
async def update_me(users_service: Service, change_user: ChangeUser = Form(), user_id: int = Depends(get_current_user)):
    return await users_service.change_user(user_id, change_user)

@router.patch("/{new login: str}")
async def change_login_user(users_service: Service, new_login: str = Form(), user_id: int = Depends(get_current_user)):
    return await users_service.change_user_login(user_id, new_login)

@router.patch("/email")
async def change_email_user(users_service: Service, new_email: EmailStr = Form(), user_id: int = Depends(get_current_user)):
    return await users_service.change_user_email(user_id, str(new_email))

@router.patch("/password")
async def change_password_user(users_service: Service, new_password: ChangeUserPassword = Form(), user_id: int = Depends(get_current_user)):
    return await users_service.change_user_password(user_id, new_password)

@router.delete("/delete_me")
async def delete_me(users_service: Service, user_id: int = Depends(get_current_user)):
    return await users_service.delete_user(user_id)

