from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

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
            raise Exception('Email already exists')
        if await self.repo.if_login_exists(str(register_dto.login)):
            raise Exception('This login already exists')
        register_dto.password = self.hasher.hash(register_dto.password)
        user = Users(**register_dto.model_dump())
        return UsersResponse.model_validate(await self.repo.create_entity(user))

    async def login_user(self, login_dto: LoginUser)->dict:
        user = await self.repo.get_entity_by_filter(login=login_dto.username)
        if user is None:
            raise Exception('User does not exist')
        if not self.hasher.verify(login_dto.password, user.password):
            raise Exception('Password does not match')
        return {
            "access_token": self.jwt.create_access_token(str(user.id), user.role),
            "token_type": "Bearer"
        }
