from sqlalchemy import Column, Integer, String, ARRAY, ForeignKey
from sqlalchemy.orm import relationship

from core.database import Base
from models.associations import course_users


class Courses(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True)
    course_name = Column(String, nullable=False, index=True)
    injuries = Column(ARRAY(String),nullable=False, default=[])

    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)
    doctor = relationship("Doctors", back_populates="courses")
    users = relationship("Users", secondary=course_users, back_populates="courses")



