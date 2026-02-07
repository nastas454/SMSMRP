from sqlalchemy import select, exists
from sqlalchemy.orm import Session
from models.users import Users

class AuthRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_user(self, **user_data):
        user = Users(**user_data)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def get_user_by_email(self, email: str)->Users|None:
        stmt=select(Users).where(Users.email == email)
        return self.session.scalar(stmt)

    def get_user_by_login(self, login: str)->Users|None:
        stmt=select(Users).where(Users.login == login)
        return self.session.scalar(stmt)

    def if_login_exists(self, login: str)->bool:
        stmt=select(exists().where(Users.login == login))
        return bool(self.session.scalar(stmt))

    def if_email_exists(self, email: str)->bool:
        stmt = select(exists().where(Users.email == email))
        return bool(self.session.scalar(stmt))
