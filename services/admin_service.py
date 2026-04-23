from uuid import UUID
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from core.database import get_session_local
from core.password_hasher import PasswordHasher
from models.admin import Admins
from models.doctors import Doctors
from models.enums.role_enum import Role
from models.user import Users
from repositories.admin_repository import AdminRepository
from repositories.doctors_repository import DoctorsRepository
from repositories.users_repository import UsersRepository
from shcemas.users_schemas import UsersCreate

class AdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.admin_repo = AdminRepository(db=self.db)
        self.doctor_repo = DoctorsRepository(db=self.db)
        self.user_repo = UsersRepository(db=self.db)
        self.hasher = PasswordHasher()

    async def create_admin(self, create_dto: UsersCreate, admin_id: UUID):
        if not await self.admin_repo.has_permission(admin_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin dont have permission"
            )
        if await self.user_repo.if_login_exists(str(create_dto.login)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This login already exists"
            )
        if await self.user_repo.if_email_exists(str(create_dto.email)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email already exists"
            )
        admin = Admins(
            first_name = create_dto.first_name,
            last_name = create_dto.last_name,
            email = str(create_dto.email),
            login = create_dto.login,
            password = self.hasher.hash(create_dto.password),
            role = Role.ADMIN.value
        )
        return await self.admin_repo.create_entity(admin)

    async def create_doctor(self, doctor_dto: UsersCreate):
        if await self.user_repo.if_login_exists(str(doctor_dto.login)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This login already exists"
            )
        if await self.user_repo.if_email_exists(str(doctor_dto.email)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email already exists"
            )
        doctor = Doctors(
            first_name = doctor_dto.first_name,
            last_name = doctor_dto.last_name,
            email = str(doctor_dto.email),
            login = doctor_dto.login,
            password = self.hasher.hash(doctor_dto.password),
            role = Role.DOCTOR.value
        )
        return await self.doctor_repo.create_entity(doctor)

    async def get_all_patients(self):
        patients = await self.user_repo.get_by_role(Role.PATIENT.value)
        if not patients:
            return {"message": "No patients found"}
        return patients

    async def get_all_doctors(self):
        doctors = await self.user_repo.get_by_role(Role.DOCTOR.value)
        if not doctors:
            return {"message": "No doctors found"}
        return doctors

    async def get_all_admins(self, admin_id: UUID):
        admins = await self.user_repo.get_by_role(Role.ADMIN.value, admin_id)
        if not admins:
            return {"message": "No admins found"}
        return admins

    async def change_activity_status(self, user_id: UUID, performer_id: UUID, status_activity: bool):
        if not await self.admin_repo.has_permission(performer_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin dont have permission"
            )
        user = await self.user_repo.get_by_id(user_id)
        if status_activity:
            user.is_active = status_activity
        else:
            await self.can_delete_admin(user)
            user.is_active = status_activity
        return await self.user_repo.change_entity(user)

    async def can_delete_admin(self, user: Users):
        if user.role == Role.ADMIN.value:
            if await self.admin_repo.has_permission(user.id):
                if await self.admin_repo.number_of_admin_with_permission() <= 3:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="There must be at least three administrators in the system"
                    )