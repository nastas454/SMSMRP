from core.database import SessionLocal
from repositories.users_repository import UsersRepository
from shcemas.user_schemas import UsersResponse

class UsersAdminService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = UsersRepository(self.db)

    def get_all_users(self):
        users = self.repo.get_all()
        if not users:
            return {"message": "No users found"}
        return [UsersResponse.model_validate(user) for user in users]

    def get_user(self, user_id: int):
        user = self.repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        return UsersResponse.model_validate(user)

    def delete_user(self, user_id: int):
        user = self.repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        self.repo.delete_entity(user)
        return {
            "message": "Successfully deleted user"
        }