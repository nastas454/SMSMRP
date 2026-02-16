from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from core.password_hasher import PasswordHasher
from models.doctors import Doctors
from repositories.admin_repository import AdminRepository
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorCreate, DoctorsResponse

class DoctorsAdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.doctor_repo = DoctorsRepository(self.db)
        self.hasher = PasswordHasher()
        self.admin_repo = AdminRepository(self.db)

    async def register_doctor(self, doctor_dto: DoctorCreate):
        if await self.doctor_repo.if_login_exists(str(doctor_dto.login)):
            raise Exception('This login already exists')
        doctor_dto.password = self.hasher.hash(doctor_dto.password)
        doctor = Doctors(**doctor_dto.model_dump())
        return DoctorsResponse.model_validate(await self.doctor_repo.create_entity(doctor))

    async def get_all_doctors(self):
        doctors = await self.doctor_repo.get_all()
        if not doctors:
            return {"message": "No doctors found"}
        return [DoctorsResponse.model_validate(doctor) for doctor in doctors]

    async def get_doctor(self, doctor_id: int):
        doctor = await self.doctor_repo.get_by_id(doctor_id)
        if not doctor:
            return {"message": "Doctor not found"}
        return DoctorsResponse.model_validate(doctor)

    async def deactivate_doctor(self, doctor_id: int, performer_id: int):
        if not await self.admin_repo.has_permission(performer_id):
            raise Exception('Admin dont have permission')
        doctor = await self.doctor_repo.get_by_id(doctor_id)
        if not doctor:
            return {"message": "Doctor not found"}
        doctor.is_active = False
        return DoctorsResponse.model_validate(await self.doctor_repo.change_entity(doctor))