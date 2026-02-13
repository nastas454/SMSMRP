from sqlalchemy import exists, select
from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from models.admin import Admins

def create_admin():
    db = SessionLocal()
    try:
        admin_login = "administrator"
        admin_password = "123"

        existing_admin = db.scalar(select(exists().where(Admins.login == admin_login)))
        if existing_admin:
            return

        new_admin = Admins(
            login=admin_login,
            password=PasswordHasher.hash(admin_password)
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
