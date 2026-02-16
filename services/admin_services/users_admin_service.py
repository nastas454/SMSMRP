from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import SessionLocal, get_session_local
from repositories.admin_repository import AdminRepository
from repositories.users_repository import UsersRepository
from shcemas.user_schemas import UsersResponse

class UsersAdminService:
    def __init__(self, db: AsyncSession = Depends(get_session_local)):
        self.db = db
        self.user_repo = UsersRepository(self.db)
        self.admin_repo = AdminRepository(self.db)

    async def get_all_users(self):
        users = await self.user_repo.get_all()
        if not users:
            return {"message": "No users found"}
        return [UsersResponse.model_validate(user) for user in users]

    async def get_user(self, user_id: int):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        return UsersResponse.model_validate(user)

    async def deactivate_user(self, user_id: int, performer_id: int):
        if not await self.admin_repo.has_permission(performer_id):
            raise Exception('Admin dont have permission')
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        user.is_active = False
        return UsersResponse.model_validate(await self.user_repo.change_entity(user))
