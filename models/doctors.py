from sqlalchemy import Column, ForeignKey, UUID
from sqlalchemy.orm import relationship
from models.user import Users


class Doctors(Users):
    __tablename__ = 'doctors'

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    courses = relationship("Courses", back_populates="doctor", cascade="all, delete")

    __mapper_args__ = {
        "polymorphic_identity": "doctor"
    }
