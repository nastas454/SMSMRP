from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from core.password_hasher import PasswordHasher
from repositories.users_repository import UsersRepository
from shcemas.user_schemas import ChangeUser, ChangeUserPassword, UsersResponse


class UsersService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.repo = UsersRepository(db=self.db)
        self.hasher = PasswordHasher()

    async def get_one_user(self, id: int):
        user = await self.repo.get_by_id(id)
        return UsersResponse.model_validate(user)

    async def change_user(self, id: int, update_user: ChangeUser):
        current_user = await self.repo.get_by_id(id)
        if update_user.first_name is not None and update_user.first_name != "":
            current_user.first_name = update_user.first_name
        if update_user.last_name is not None and update_user.last_name != "":
            current_user.last_name = update_user.last_name
        if update_user.age is not None and update_user.age != "":
            current_user.age = int(update_user.age)
        user = await self.repo.change_entity(current_user)
        return UsersResponse.model_validate(user)

    async def change_user_login (self, id: int, new_login: str):
        user = await self.repo.get_by_id(id)
        if await self.repo.if_login_exists(new_login):
            raise Exception("Login already exists")
        user.login = new_login
        return UsersResponse.model_validate(await self.repo.change_entity(user))

    async def change_user_password (self, id: int, new_password: ChangeUserPassword):
        user = await self.repo.get_by_id(id)
        if new_password.password != new_password.confirm_password :
            raise Exception("Passwords don't match")
        user.password = self.hasher.hash(new_password.password)
        return UsersResponse.model_validate(await self.repo.change_entity(user))

    async def change_user_email (self, id: int, new_email: str):
        user = await self.repo.get_by_id(id)
        if await self.repo.if_email_exists(new_email):
            raise Exception("Email already exists")
        user.email = new_email
        return UsersResponse.model_validate(await self.repo.change_entity(user))

    async def delete_user(self, id: int):
        user = await self.repo.get_by_id(id)
        await self.repo.delete_entity(user)
        return {
            "massage": "successfully deleted user"
        }