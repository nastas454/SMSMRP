from typing import Generic, Type, TypeVar
from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")
class CommonRepository(Generic[T]):
    def __init__(self, db: AsyncSession, model: Type[T]):
        self.db = db
        self.model = model

    async def create_entity(self, entity: T):
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def get_all(self):
        result = await self.db.scalars(select(self.model))
        return result.all()

    async def get_by_id(self, id: int) -> T | None:
        return await self.db.get(self.model, id)

    async def get_entity_by_filter(self, **filters) -> T | None:
        stmt = select(self.model).filter_by(**filters)
        return await self.db.scalar(stmt)

    async def change_entity(self, entity: T):
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def if_login_exists(self, login: str) -> bool:
        stmt = select(exists().where(self.model.login == login))
        return bool(await self.db.scalar(stmt))

    async def delete_entity(self, entity: T):
        await self.db.delete(entity)
        await self.db.commit()