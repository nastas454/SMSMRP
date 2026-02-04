from sqlalchemy import Integer, Column, String

from core.database import Base

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    first_name = Column(String,nullable=False, index=True)
    last_name = Column(String,nullable=False, index=True)
    age = Column(Integer,nullable=False, index=True)
    sex = Column(String,nullable=False, index=True)

    email = Column(String,nullable=False, index=True, unique=True)
    login = Column(String,nullable=False, index=True, unique=True)
    password = Column(String,nullable=False)
    role = Column(Integer,nullable=False, index=True, unique=True)



