from core.database import SessionLocal
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from models.admin import Admins
from repositories.admin_repository import AdminRepository
from shcemas.admin_schemas import AdminCreate, AdminsResponse, AdminLogin


class AdminService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = AdminRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    def create_admin(self, create_dto: AdminCreate, admin_id: int):
        if not self.repo.has_permission(admin_id):
            raise Exception('Admin dont have permission')
        if self.repo.if_login_exists(str( create_dto.login)):
            raise Exception('This login already exists')
        create_dto.password = self.hasher.hash( create_dto.password)
        admin = Admins(** create_dto.model_dump())
        return AdminsResponse.model_validate(self.repo.create_entity(admin))

    def login_admin(self, login_dto: AdminLogin)->dict:
        admin = self.repo.get_entity_by_filter(login=login_dto.username)
        if admin is None:
            raise Exception('Admin does not exist')
        if not self.hasher.verify(login_dto.password, admin.password):
            raise Exception('Password does not match')
        return {
            "access_token": self.jwt.create_access_token(str(admin.id), str(admin.role)),
            "token_type": "Bearer"
        }

    def deactivate_admin(self, admin_id: int, performer_id: int):
        if not self.repo.has_permission(performer_id):
            raise Exception('Admin dont have permission')
        if self.repo.has_permission(admin_id):
            if self.repo.number_of_admin_with_permission() <= 3:
                raise Exception('There must be at least three administrators in the system')
        admin = self.repo.get_by_id(admin_id)
        admin.is_active = False
        return AdminsResponse.model_validate(self.repo.change_entity(admin))


