from typing import Annotated
from fastapi import APIRouter, Depends
from core.auth_tools import get_current_payload
from services.users_service import UsersService
from shcemas.users_schemas import ChangeUser, UsersResponse

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_payload)])
Service = Annotated[UsersService, Depends(UsersService)]

@router.get("/me", response_model= UsersResponse)
async def get_me(users_service: Service, user_id: dict= Depends(get_current_payload)):
    return await users_service.get_me(user_id.get("id"))

@router.patch("/password")
async def change_password(users_service: Service, new_password: str, user_id: dict= Depends(get_current_payload)):
    return await users_service.change_password(user_id.get("id"), new_password)

@router.patch("/login")
async def change_login(users_service: Service, new_login: str, user_id: dict= Depends(get_current_payload)):
    return await users_service.change_login(user_id.get("id"), new_login)

@router.patch("/email")
async def change_email(users_service: Service, new_email: str, user_id: dict= Depends(get_current_payload)):
    return await users_service.change_email(user_id.get("id"), new_email)

@router.patch("/change")
async def change_user(users_service: Service, update_user: ChangeUser, user_id: dict= Depends(get_current_payload)):
    return await users_service.change_user(user_id.get("id"), update_user)

@router.delete("/me")
async def delete_me(users_service: Service, user_id: dict= Depends(get_current_payload)):
    return await users_service.delete_me(user_id.get("id"))