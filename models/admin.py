from datetime import datetime
from sqlalchemy import Integer, Column, String, Boolean, DateTime
from core.database import Base
from models.enums.role_enum import Role

class Admins(Base):
    __tablename__ = 'admin'

    id = Column(Integer, primary_key=True)

    login = Column(String,nullable=False, index=True, unique=True)
    password = Column(String,nullable=False)

    role = Column(String,nullable=False, index=True, default=Role.ADMIN.value)
    is_active = Column(Boolean,nullable=False, index=True, default=True)
    create_at = Column(DateTime,nullable=False, default=datetime.utcnow)