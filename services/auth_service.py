from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from core.database import get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from models.enums.role_enum import Role
from models.patients import Patients
from repositories.patients_repository import PatientsRepository
from repositories.users_repository import UsersRepository
from shcemas.patient_schemas import PatientCreate
from shcemas.users_schemas import UsersLogin, UsersCreate


class AuthService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = UsersRepository(self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()
        self.patients_repo = PatientsRepository(self.db)

    async def login_user(self, login_dto: UsersLogin)->dict:
        user = await self.repo.get_by_login(login_dto.username)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Користувача з таким логіном не знайдено"
            )
        if not self.hasher.verify(login_dto.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Невірний пароль"
            )
        return {
            "access_token": self.jwt.create_access_token(str(user.id), user.role),
            "token_type": "Bearer"
        }

    async def register_patient(self, register_user_dto: UsersCreate, register_patient_dto: PatientCreate)->dict:
        if await self.repo.if_email_exists(str(register_user_dto.email)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Користувач з таким email вже існує"
            )
        if await self.repo.if_login_exists(str(register_user_dto.login)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Цей логін вже зайнятий"
            )
        user = Patients(
            age = register_patient_dto.age,
            sex = register_patient_dto.sex,
            first_name = register_user_dto.first_name,
            last_name = register_user_dto.last_name,
            email = str(register_user_dto.email),
            login = register_user_dto.login,
            password = self.hasher.hash(register_user_dto.password),
            role = Role.PATIENT.value
        )
        return await self.patients_repo.create_entity(user)
