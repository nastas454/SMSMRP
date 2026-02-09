from sqlalchemy import select, exists
from sqlalchemy.orm import Session
from models.users import Users

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, **user_data):
        user = Users(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_all(self):
        return self.db.scalars(select(Users)).all()

    def get_by_id(self, id: int) -> Users|None:
        stmt = select(Users).where(Users.id == id)
        return self.db.scalar(stmt)

    def get_user_by_email(self, email: str) -> Users | None:
        stmt = select(Users).where(Users.email == email)
        return self.db.scalar(stmt)

    def get_user_by_login(self, login: str) -> Users | None:
        stmt = select(Users).where(Users.login == login)
        return self.db.scalar(stmt)

    def delete_user(self, user: Users):
        self.db.delete(user)
        self.db.commit()

    def change_user(self, user: Users):
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def if_login_exists(self, login: str) -> bool:
        stmt = select(exists().where(Users.login == login))
        return bool(self.db.scalar(stmt))

    def if_email_exists(self, email: str)->bool:
        stmt = select(exists().where(Users.email == email))
        return bool(self.db.scalar(stmt))