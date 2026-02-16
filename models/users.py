from sqlalchemy import Integer, Column, String, Enum, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from core.database import Base
from models.associations import course_users
from models.enums.role_enum import Role
from models.enums.sex_enum import Sex

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
    role = Column(String,nullable=False, index=True, default=Role.USER.value)

    injuries = Column(ARRAY(String),nullable=True, default=[])
    courses = relationship("Courses", secondary=course_users, back_populates="users")
    doctors = Column(ARRAY(Integer),nullable=True, default=[])

    is_active = Column(Boolean,nullable=False, index=True, default=True)

