from sqlalchemy import Integer, Column, String, Enum, ForeignKey, UUID
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from models.associations import course_patients
from models.enums.sex_enum import Sex
from models.user import Users

class Patients(Users):
    __tablename__ = 'patients'

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)

    age = Column(Integer,nullable=False, index=True)
    sex = Column(Enum(Sex),nullable=False, index=True)

    courses = relationship("Courses", secondary=course_patients, back_populates="patients")

    mapper_args = {
            "polymorphic_identity": "patients"
    }
