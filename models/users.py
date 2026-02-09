from sqlalchemy import Integer, Column, String, Enum, UUID
from sqlalchemy.dialects.postgresql import ARRAY
from core.database import Base
from models.role_enum import Role
from models.sex_enum import Sex

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    first_name = Column(String,nullable=False, index=True)
    last_name = Column(String,nullable=False, index=True)
    age = Column(Integer,nullable=False, index=True)
    sex = Column(Enum(Sex),nullable=False, index=True)

    email = Column(String,nullable=False, index=True, unique=True)
    login = Column(String,nullable=False, index=True, unique=True)
    password = Column(String,nullable=False)
    role = Column(Enum(Role),nullable=False, index=True, default=Role.USER)

    injuries = Column(ARRAY(String),nullable=True, default=[])
    courses = Column(ARRAY(Integer),nullable=True, default=[])
    doctors = Column(ARRAY(Integer),nullable=True, default=[])



