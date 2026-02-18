from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from core.database import SessionLocal, get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorLogin

class AuthDoctorsService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = DoctorsRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    async def login_doctor(self, login_dto: DoctorLogin) -> dict:
        doctor = await self.repo.get_entity_by_filter(login=login_dto.username)
        if doctor is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Лікаря з таким логіном не знайдено"
            )
        if not self.hasher.verify(login_dto.password, doctor.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Невірний пароль"
            )
        return {
            "access_token": self.jwt.create_access_token(str(doctor.id), doctor.role),
            "token_type": "Bearer"
        }