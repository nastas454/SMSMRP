import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base


class PatientCourse(Base):
    __tablename__ = 'patient_courses'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id', ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete="CASCADE"), nullable=False)

    current_unlocked_day = Column(Integer, default=1, nullable=False)
    last_completed_at = Column(DateTime, nullable=True)

    patient = relationship("Patients", back_populates="course_enrollments")
    course = relationship("Courses", back_populates="patient_enrollments")

    is_active = Column(Boolean, nullable=False, default=True)
    progress = Column(Integer, default=0, nullable=False)
