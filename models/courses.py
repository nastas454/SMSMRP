import uuid

from sqlalchemy import Column, Integer, String, ARRAY, ForeignKey, UUID
from sqlalchemy.orm import relationship
from core.database import Base
from models.associations import course_patients

class Courses(Base):
    __tablename__ = 'courses'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    injuries = Column(ARRAY(String),nullable=False, default=[])
    course_s3_key = Column(String,nullable=False, default=[])

    doctor_id = Column(UUID(as_uuid=True), ForeignKey('doctors.id'), nullable=False)
    doctor = relationship("Doctors", back_populates="courses")
    patients = relationship("Patients", secondary=course_patients, back_populates="courses")



