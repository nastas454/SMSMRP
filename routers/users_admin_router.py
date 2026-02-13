from fastapi import APIRouter, Depends
from core.auth_tools import get_current_user
from models.role_enum import Role
from services.users_admin_service import UsersAdminService

router = APIRouter(prefix="/admin/users", tags=["admin"], dependencies=[Depends(get_current_user)])
users_admin_service = UsersAdminService()

@router.get("/{user_id:int}")
def get_user(user_id: int):
    return users_admin_service.get_user(user_id)

@router.get("")
def get_all_users():
    return users_admin_service.get_all_users()

@router.delete("/{user_id:int}")
def delete_user(user_id: int):
    return users_admin_service.delete_user(user_id)

