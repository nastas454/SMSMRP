from sqlalchemy.orm import Session
from models.users import Users

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Users).all()

    def get_by_id(self, id: int):
        return self.db.query(Users).filter(Users.id==id).first()

    def create_user(self, user: Users):
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user: Users):
        self.db.delete(user)
        self.db.commit()


