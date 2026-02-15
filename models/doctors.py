from sqlalchemy import Integer, Column, String, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from core.database import Base
from models.enums.role_enum import Role

class Doctors(Base):
    __tablename__ = 'doctors'

    id = Column(Integer, primary_key=True)
    first_name = Column(String,nullable=False, index=True)
    last_name = Column(String,nullable=False, index=True)

    login = Column(String,nullable=False, index=True, unique=True)
    password = Column(String,nullable=False)

    role = Column(String,nullable=False, index=True, default=Role.DOCTOR.value)
    courses = Column(ARRAY(Integer),nullable=True, default=[])
    patients = Column(ARRAY(Integer),nullable=True, default=[])

    is_active = Column(Boolean, nullable=False, index=True, default=True)