from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from repositories.users_repository import UserRepository
from shcemas.users.user_schemas import ChangeUser, ChangeUserPassword, UserResponse


class UsersService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = UserRepository(db=self.db)
        self.hasher = PasswordHasher()

    def get_one_user(self, id: int):
        user = self.repo.get_by_id(id)
        return UserResponse.model_validate(user)

    def delete_user(self, id: int):
        user = self.repo.get_by_id(id)
        self.repo.delete_user(user)
        return {
            "massage": "successfully deleted user"
        }

    def change_user(self, id: int, update_user: ChangeUser):
        current_user = self.repo.get_by_id(id)
        if update_user.first_name is not None and update_user.first_name != "":
            current_user.first_name = update_user.first_name
        if update_user.last_name is not None and update_user.last_name != "":
            current_user.last_name = update_user.last_name
        if update_user.age is not None and update_user.age != "":
            current_user.age = int(update_user.age)
        user = self.repo.change_user(current_user)
        return UserResponse.model_validate(user)

    def change_user_login (self, id: int, new_login: str):
        user = self.repo.get_by_id(id)
        if self.repo.if_login_exists(new_login):
            raise Exception("Login already exists")
        user.login = new_login
        return UserResponse.model_validate(self.repo.change_user(user))

    def change_user_password (self, id: int, new_password: ChangeUserPassword):
        user = self.repo.get_by_id(id)
        if new_password.password != new_password.confirm_password :
            raise Exception("Passwords don't match")
        user.password = self.hasher.hash(new_password.password)
        return UserResponse.model_validate(self.repo.change_user(user))

    def change_user_email (self, id: int, new_email: str):
        user = self.repo.get_by_id(id)
        if self.repo.if_email_exists(new_email):
            raise Exception("Email already exists")
        user.email = new_email
        return UserResponse.model_validate(self.repo.change_user(user))