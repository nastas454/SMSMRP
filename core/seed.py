from sqlalchemy import exists, select
from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from models.admin import Admins
from models.enums.role_enum import Role
from models.user import Users
from repositories.admin_repository import AdminRepository
from repositories.users_repository import UsersRepository
from services import admin_service


async def create_admin():
    async with SessionLocal() as db:
        try:
            admin_login = "admin"
            admin_password = "123"

            admin_repo = AdminRepository(db)
            user_repo = UsersRepository(db)

            admin_exists = await user_repo.if_login_exists(admin_login)
            if admin_exists:
                return

            new_admin = Admins(
                first_name=admin_login,
                last_name=admin_login,
                email=admin_login,
                login=admin_login,
                password=PasswordHasher.hash(admin_password),
                role=Role.ADMIN.value
            )
            await admin_repo.create_entity(new_admin)

        except Exception:
            await db.rollback()