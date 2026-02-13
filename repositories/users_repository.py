from sqlalchemy import select, exists
from sqlalchemy.orm import Session
from models.users import Users
from repositories.common_repository import CommonRepository

class UsersRepository(CommonRepository[Users]):
    def __init__(self, db: Session):
        super().__init__(db, Users)

    def get_user_by_email(self, email: str) -> Users | None:
        stmt = select(Users).where(Users.email == email)
        return self.db.scalar(stmt)

    def if_email_exists(self, email: str)->bool:
        stmt = select(exists().where(Users.email == email))
        return bool(self.db.scalar(stmt))

