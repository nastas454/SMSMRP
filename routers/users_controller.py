from fastapi import APIRouter
from fastapi.params import Form
from models.users import Users
from services.users_service import UsersService
from shcemas.users.user_create import UserCreate

router = APIRouter(prefix="/users", tags=["users"])
users_service = UsersService()
@router.get("/allusers")
def get_all_users():
    return users_service.get_all_users()

@router.get("/users/{user_id}")
def get_user(user_id: int):
    return users_service.get_one_user(user_id)

@router.post("/user_create")
def create_user(user_create: UserCreate=Form()):
    return users_service.create_user(user_create)

@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    return users_service.delete_user(user_id)

