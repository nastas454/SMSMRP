from sqlalchemy import exists, select
from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from models.admin import Admins


async def create_admin():
    async with SessionLocal() as db:
        try:
            admin_login = "administrator"
            admin_password = "123"

            query = select(exists().where(Admins.login == admin_login))
            admin_exists = await db.scalar(query)
            if admin_exists:
                return
            hashed_password = PasswordHasher.hash(admin_password)
            new_admin = Admins(
                login=admin_login,
                password=hashed_password
            )
            db.add(new_admin)
            await db.commit()
            await db.refresh(new_admin)

        except Exception:
            await db.rollback()