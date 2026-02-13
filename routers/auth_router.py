from fastapi import APIRouter
from fastapi.params import Form
from services.auth_service import AuthService
from shcemas.user_schemas import UserCreate, LoginUser

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

@router.post("/register")
def register_user(register_dto: UserCreate=Form()):
    return auth_service.register_user(register_dto)

@router.post("/login")
def login_user(login_dto: LoginUser=Form()):
    return auth_service.login_user(login_dto)







