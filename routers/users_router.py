from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends
from core.auth_tools import get_current_user
from services.users_service import UsersService
from shcemas.users_schemas import ChangeUser

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])
Service = Annotated[UsersService, Depends(UsersService)]

@router.get("/me")
async def get_me(users_service: Service, user_id: UUID= Depends(get_current_user)):
    return await users_service.get_me(user_id)

@router.patch("/password")
async def change_password(users_service: Service, new_password: str, user_id: UUID= Depends(get_current_user)):
    return await users_service.change_password(user_id, new_password)

@router.patch("/login")
async def change_login(users_service: Service, new_login: str, user_id: UUID= Depends(get_current_user)):
    return await users_service.change_login(user_id, new_login)

@router.patch("/email")
async def change_email(users_service: Service, new_email: str, user_id: UUID= Depends(get_current_user)):
    return await users_service.change_email(user_id, new_email)

@router.patch("/change")
async def change_user(users_service: Service, update_user: ChangeUser, user_id: UUID= Depends(get_current_user)):
    return await users_service.change_user(user_id, update_user)

@router.delete("/me")
async def delete_me(users_service: Service, user_id: UUID= Depends(get_current_user)):
    return await users_service.delete_me(user_id)