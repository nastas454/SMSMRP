import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class CourseFeedback(Base):
    __tablename__ = 'course_feedbacks'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    patient_course_id = Column(UUID(as_uuid=True), ForeignKey('patient_courses.id', ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    pain_level = Column(Integer, CheckConstraint('pain_level >= 1 AND pain_level <= 10', name='check_pain_level'),nullable=False)
    difficulty_level = Column(Integer, CheckConstraint('difficulty_level >= 1 AND difficulty_level <= 10',name='check_difficulty_level'), nullable=False)
    note = Column(Text, nullable=True)
    session_number = Column(Integer, nullable=False)

    patient_course = relationship("PatientCourse", back_populates="feedbacks")