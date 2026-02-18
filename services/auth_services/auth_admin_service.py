from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Адміністратора з таким логіном не знайдено"
            )
        if not self.hasher.verify(login_dto.password, admin.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Невірний пароль"
            )
        return {
            "access_token": self.jwt.create_access_token(str(admin.id), str(admin.role)),
            "token_type": "Bearer"
        }