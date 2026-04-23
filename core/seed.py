from datetime import datetime
from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from models.admin import Admins
from models.enums.role_enum import Role
from repositories.admin_repository import AdminRepository
from repositories.users_repository import UsersRepository
import logging

async def create_admin():
    async with SessionLocal() as db:
        try:
            admin_login = "admin"
            admin_password = "123"
            admin_email = "admin@gmail.com"
            admin_repo = AdminRepository(db)
            user_repo = UsersRepository(db)

            if await user_repo.if_login_exists(admin_login) or await user_repo.if_email_exists(admin_email):
                print("Адмін вже існує в базі")
                return

            new_admin = Admins(
                first_name=admin_login,
                last_name=admin_login,
                email=admin_email,
                login=admin_login,
                password=PasswordHasher.hash(admin_password),
                role=Role.ADMIN.value,
                create_at=datetime(2026, 1, 1)
            )
            await admin_repo.create_entity(new_admin)
            print("Адмін успішно створений при запуску!")

        except Exception as e:
            await db.rollback()
            print(f"КРИТИЧНА ПОМИЛКА СТВОРЕННЯ АДМІНА: {e}")
            logging.error(f"Помилка створення адміна: {e}", exc_info=True)