from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from repositories.admin_repository import AdminRepository
from shcemas.admin_schemas import AdminLogin

class AuthAdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = AdminRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    async def login_admin(self, login_dto: AdminLogin) -> dict:
        admin = await self.repo.get_entity_by_filter(login=login_dto.username)
        if admin is None:
            raise Exception('Admin does not exist')
        if not self.hasher.verify(login_dto.password, admin.password):
            raise Exception('Password does not match')
        return {
            "access_token": self.jwt.create_access_token(str(admin.id), str(admin.role)),
            "token_type": "Bearer"
        }