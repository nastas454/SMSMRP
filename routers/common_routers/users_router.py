from fastapi import APIRouter
from fastapi.params import Depends, Form
from pydantic import EmailStr
from core.auth_tools import get_current_user
from services.common_services.users_service import UsersService
from shcemas.user_schemas import ChangeUser, ChangeUserPassword

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])
users_service = UsersService()

@router.get("/me")
def get_me(user_id: int = Depends(get_current_user)):
    return users_service.get_one_user(user_id)

@router.patch("/me")
def update_me(change_user: ChangeUser = Form(), user_id: int = Depends(get_current_user)):
    return users_service.change_user(user_id, change_user)

@router.patch("/{new login: str}")
def change_login_user(new_login: str = Form(), user_id: int = Depends(get_current_user)):
    return users_service.change_user_login(user_id, new_login)

@router.patch("/email")
def change_email_user(new_email: EmailStr = Form(), user_id: int = Depends(get_current_user)):
    return users_service.change_user_email(user_id, str(new_email))

@router.patch("/password")
def change_password_user(new_password: ChangeUserPassword = Form(), user_id: int = Depends(get_current_user)):
    return users_service.change_user_password(user_id, new_password)

@router.delete("/delete_me")
def delete_me(user_id: int = Depends(get_current_user)):
    return users_service.delete_user(user_id)

