import uuid

from sqlalchemy import Column, Integer, String, ARRAY, ForeignKey, UUID, Boolean
from sqlalchemy.orm import relationship
from core.database import Base


class Courses(Base):
    __tablename__ = 'courses'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    injuries = Column(ARRAY(String),nullable=False, default=[])
    course_s3_key = Column(String,nullable=False, default=[])
    course_length = Column(Integer, nullable=False, default=0)

    doctor_id = Column(UUID(as_uuid=True), ForeignKey('doctors.id'), nullable=False)
    doctor_name = Column(String, nullable=False)
    doctor_lastname = Column(String, nullable=False)
    doctor = relationship("Doctors", back_populates="courses")
    patient_enrollments = relationship("PatientCourse", back_populates="course", cascade="all, delete-orphan")

