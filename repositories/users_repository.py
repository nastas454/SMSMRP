from dns.e164 import query
from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import Users
from repositories.common_repository import CommonRepository


class UsersRepository(CommonRepository[Users]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Users)

    async def get_by_role(self, role: str):
        stmt = select(Users).where(Users.role == role)
        result = await self.db.scalars(stmt)
        return result.all()

    async def get_by_login(self, user_login: str) -> Users | None:
        stmt = select(Users).where(Users.login == user_login)
        return await self.db.scalar(stmt)

    async def if_login_exists(self, login: str) -> bool:
        stmt = select(exists().where(self.model.login == login))
        return bool(await self.db.scalar(stmt))

    async def if_email_exists(self, email: str) -> bool:
        stmt = select(exists().where(Users.email == email))
        return bool(await self.db.scalar(stmt))

