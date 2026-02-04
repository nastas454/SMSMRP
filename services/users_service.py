from core.database import SessionLocal
from models.users import Users
from repositories.users_repository import UserRepository
from shcemas.users.user_create import UserCreate

class UsersService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = UserRepository(db=self.db)

    def get_all_users(self):
        return self.repo.get_all()

    def get_one_user(self, id: int):
        return self.repo.get_by_id(id)

    def create_user(self, user: UserCreate):
        user = Users(first_name=user.first_name, last_name=user.last_name, age=user.age, sex=user.sex,
                     email=str(user.email), login=user.login, password=user.password)
        return self.repo.create_user(user)

    def delete_user(self, id: int):
        user = self.repo.get_by_id(id)
        self.repo.delete_user(user)
