from typing import Annotated
from fastapi import APIRouter, Depends
from core.auth_tools import  get_current_admin
from services.admin_services.users_admin_service import UsersAdminService

router = APIRouter(prefix="/admin/users", tags=["management users (admin only)"], dependencies=[Depends(get_current_admin)])
Service = Annotated[UsersAdminService, Depends(UsersAdminService)]

@router.get("/{user_id:int}")
async def get_user(users_admin_service: Service, user_id: int):
    return await users_admin_service.get_user(user_id)

@router.get("")
async def get_all_users(users_admin_service: Service):
    return await users_admin_service.get_all_users()

@router.patch("/{user_id:int}")
async def deactivate_user(users_admin_service: Service, user_id: int, performer_id: int=Depends(get_current_admin)):
    return await users_admin_service.deactivate_user(user_id, performer_id)

