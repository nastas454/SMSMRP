from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from core.database import SessionLocal, get_session_local
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from models.users import Users
from repositories.users_repository import UsersRepository
from shcemas.user_schemas import UserCreate, LoginUser, UsersResponse

class AuthUserService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = UsersRepository(self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    async def register_user(self, register_dto: UserCreate):
        if await self.repo.if_email_exists(str(register_dto.email)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Користувач з таким email вже існує"
            )
        if await self.repo.if_login_exists(str(register_dto.login)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Цей логін вже зайнятий"
            )
        register_dto.password = self.hasher.hash(register_dto.password)
        user = Users(**register_dto.model_dump())
        return UsersResponse.model_validate(await self.repo.create_entity(user))

    async def login_user(self, login_dto: LoginUser)->dict:
        user = await self.repo.get_entity_by_filter(login=login_dto.username)
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
