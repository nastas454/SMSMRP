from fastapi import APIRouter, Depends
from core.auth_tools import  get_current_admin
from services.admin_services.users_admin_service import UsersAdminService

router = APIRouter(prefix="/admin/users", tags=["management users (admin only)"], dependencies=[Depends(get_current_admin)])
users_admin_service = UsersAdminService()

@router.get("/{user_id:int}")
def get_user(user_id: int):
    return users_admin_service.get_user(user_id)

@router.get("")
def get_all_users():
    return users_admin_service.get_all_users()

@router.patch("/{user_id:int}")
def deactivate_user(user_id: int, performer_id: int=Depends(get_current_admin)):
    return users_admin_service.deactivate_user(user_id, performer_id)

