from typing import Generic, Type, TypeVar
from sqlalchemy import select, exists
from sqlalchemy.orm import Session

T = TypeVar("T")
class CommonRepository(Generic[T]):
    def __init__(self, db: Session, model: Type[T]):
        self.db = db
        self.model = model

    def create_entity(self, entity: T):
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def get_all(self):
        return self.db.scalars(select(self.model)).all()

    def get_by_id(self, id: int) -> T | None:
        return self.db.get(self.model, id)

    def get_entity_by_filter(self, **filters) -> T | None:
        stmt = select(self.model).filter_by(**filters)
        return self.db.scalar(stmt)

    def change_entity(self, entity: T):
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def if_login_exists(self, login: str) -> bool:
        stmt = select(exists().where(self.model.login == login))
        return bool(self.db.scalar(stmt))

    def delete_entity(self, entity: T):
        self.db.delete(entity)
        self.db.commit()