from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from models.users import Users
from repositories.common_repository import CommonRepository

class UsersRepository(CommonRepository[Users]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Users)

    async def get_user_by_email(self, email: str) -> Users | None:
        stmt = select(Users).where(Users.email == email)
        return await self.db.scalar(stmt)

    async def if_email_exists(self, email: str)->bool:
        stmt = select(exists().where(Users.email == email))
        return bool(await self.db.scalar(stmt))

