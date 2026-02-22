from fastapi import Depends, HTTPException
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.testing.pickleable import User

from core.database import get_session_local
from core.password_hasher import PasswordHasher
from repositories.users_repository import UsersRepository
from shcemas.users_schemas import ChangeUser


class UsersService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.user_repo = UsersRepository(db=self.db)
        self.hash = PasswordHasher()

    async def get_me(self, user_id: UUID):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def change_password(self, user_id: UUID, new_password: str):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.password = self.hash.hash(new_password)
        await self.user_repo.change_entity(user)
        return {
            "massage": "Password changed successfully"
        }

    async def change_login(self, user_id: UUID, new_login: str):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.login = new_login
        await self.user_repo.change_entity(user)
        return{
            "massage": "Login changed successfully"
        }

    async def change_email(self, user_id: UUID, new_email: str):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.email = new_email
        await self.user_repo.change_entity(user)
        return{
            "massage": "Email changed successfully"
        }

    async def change_user(self, id: UUID, update_user: ChangeUser):
        current_user = await self.user_repo.get_by_id(id)
        if update_user.first_name is not None and update_user.first_name != "":
            current_user.first_name = update_user.first_name
        if update_user.last_name is not None and update_user.last_name != "":
            current_user.last_name = update_user.last_name
        user = await self.user_repo.change_entity(current_user)
        return user

    async def delete_me(self, user_id: UUID):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await self.user_repo.delete_entity(user)
        return {
            "massage": "successfully deleted user"
        }
