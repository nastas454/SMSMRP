from core.database import SessionLocal
from repositories.admin_repository import AdminRepository
from repositories.users_repository import UsersRepository
from shcemas.user_schemas import UsersResponse

class UsersAdminService:
    def __init__(self):
        self.db = SessionLocal()
        self.user_repo = UsersRepository(self.db)
        self.admin_repo = AdminRepository(self.db)

    def get_all_users(self):
        users = self.user_repo.get_all()
        if not users:
            return {"message": "No users found"}
        return [UsersResponse.model_validate(user) for user in users]

    def get_user(self, user_id: int):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        return UsersResponse.model_validate(user)

    def deactivate_user(self, user_id: int, performer_id: int):
        if not self.admin_repo.has_permission(performer_id):
            raise Exception('Admin dont have permission')
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}
        user.is_active = False
        return UsersResponse.model_validate(self.user_repo.change_entity(user))
