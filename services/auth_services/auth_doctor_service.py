from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

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
            raise Exception('Doctor does not exist')
        if not self.hasher.verify(login_dto.password, doctor.password):
            raise Exception('Password does not match')
        return {
            "access_token": self.jwt.create_access_token(str(doctor.id), doctor.role),
            "token_type": "Bearer"
        }