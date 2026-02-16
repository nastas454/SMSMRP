from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from models.admin import Admins
from repositories.admin_repository import AdminRepository
from shcemas.admin_schemas import AdminCreate, AdminsResponse

class AdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = AdminRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    async def create_admin(self, create_dto: AdminCreate, admin_id: int):
        if not await self.repo.has_permission(admin_id):
            raise Exception('Admin dont have permission')
        if await self.repo.if_login_exists(str( create_dto.login)):
            raise Exception('This login already exists')
        create_dto.password = self.hasher.hash(create_dto.password)
        admin = Admins(** create_dto.model_dump())
        return AdminsResponse.model_validate(await self.repo.create_entity(admin))

    async def get_admin(self, admin_id: int):
        admin = await self.repo.get_by_id(admin_id)
        if not admin:
            return {"message": "Admin not found"}
        return AdminsResponse.model_validate(admin)

    async def get_all_admins(self):
        admins = await self.repo.get_all()
        if not admins:
            return {"message": "No admins found"}
        return [AdminsResponse.model_validate(admin) for admin in admins]

    async def deactivate_admin(self, admin_id: int, performer_id: int):
        if not await self.repo.has_permission(performer_id):
            raise Exception('Admin dont have permission')
        if await self.repo.has_permission(admin_id):
            if await self.repo.number_of_admin_with_permission() <= 3:
                raise Exception('There must be at least three administrators in the system')
        admin = await self.repo.get_by_id(admin_id)
        admin.is_active = False
        return AdminsResponse.model_validate(await self.repo.change_entity(admin))


