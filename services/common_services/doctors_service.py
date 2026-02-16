from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorsResponse, ChangeDoctorPassword


class DoctorsService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = DoctorsRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    async def get_doctor(self, id: int):
        doctor = await self.repo.get_by_id(id)
        return DoctorsResponse.model_validate(doctor)

    async def change_doctor_password (self, id: int, new_password: ChangeDoctorPassword):
        doctor = await self.repo.get_by_id(id)
        if new_password.password != new_password.confirm_password :
            raise Exception("Passwords don't match")
        doctor.password = self.hasher.hash(new_password.password)
        return DoctorsResponse.model_validate(await self.repo.change_entity(doctor))

    async def delete_doctor(self, id: int):
        doctor = await self.repo.get_by_id(id)
        await self.repo.delete_entity(doctor)
        return {
            "massage": "successfully deleted doctor"
        }