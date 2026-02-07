from core.database import SessionLocal
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from repositories.auth_repository import AuthRepository
from shcemas.users.user_create import UserCreate, LoginUser

class AuthService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = AuthRepository(self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    def register_user(self, register_dto: UserCreate):
        if self.repo.if_email_exists(str(register_dto.email)):
            raise Exception('Email already exists')
        if self.repo.if_login_exists(str(register_dto.login)):
            raise Exception('This login already exists')
        register_dto.password = self.hasher.hash(register_dto.password)
        return self.repo.create_user(**register_dto.model_dump())

    def login_user(self, login_dto: LoginUser)->dict:
        user = self.repo.get_user_by_login(str(login_dto.login))
        if user is None:
            raise Exception('User does not exist')
        if not self.hasher.verify(login_dto.password, user.password):
            raise Exception('Password does not match')
        return {
            "token": self.jwt.create_access_token(str(user.id))
        }
