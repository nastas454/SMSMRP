from typing import Generic, Type, TypeVar
from sqlalchemy import select, exists, UUID
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

    async def get_by_id(self, id: UUID) -> T | None:
        return await self.db.get(self.model, id)

    async def change_entity(self, entity: T):
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def delete_entity(self, entity: T):
        await self.db.delete(entity)
        await self.db.commit()