from sqlalchemy.sql.functions import current_user

from core.database import SessionLocal
from models.role_enum import Role
from repositories.users_repository import UserRepository
from shcemas.users.user_schemas import UserCreate


class UsersAdminService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = UserRepository(self.db)

    def get_all_users(self):
        users = self.repo.get_all()
        if not users:
            return {"message": "No users found"}
        return users

    def get_user(self, user_id: int):
        user = self.repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        return user

    def change_role(self, user_id: int, role: str):
        user = self.repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        if role == user.role:
            return {"message": "Role already selected"}
        user.role = role
        return  self.repo.change_user(user)

    def delete_user(self, user_id: int):
        user = self.repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        self.repo.delete_user(user)
        return {
            "message": "Successfully deleted user"
        }