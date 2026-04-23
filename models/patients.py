from sqlalchemy import Integer, Column, Enum, ForeignKey, UUID
from sqlalchemy.orm import relationship
from models.enums.sex_enum import Sex
from models.user import Users

class Patients(Users):
    __tablename__ = 'patients'

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    age = Column(Integer,nullable=False, index=True)
    sex = Column(Enum(Sex),nullable=False, index=True)

    course_enrollments = relationship("PatientCourse", back_populates="patient", cascade="all, delete-orphan")

    mapper_args = {
            "polymorphic_identity": "patients"
    }
