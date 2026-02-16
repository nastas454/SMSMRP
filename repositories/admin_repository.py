from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from models.admin import Admins
from repositories.common_repository import CommonRepository
from sqlalchemy import select


class AdminRepository(CommonRepository):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Admins)

    async def has_permission(self, admin_id: int) -> bool:
        admin = await self.db.get(Admins, admin_id)
        return datetime.utcnow() - admin.create_at > timedelta(days=7)

    async def number_of_admin_with_permission(self):
        stmt = select(func.count()).where(datetime.utcnow() - Admins.create_at > timedelta(days=7), Admins.is_active == True)
        return await self.db.scalar(stmt)