from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, UUID
from models.user import Users


class Admins(Users):
    __tablename__ = 'admins'

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)

    create_at = Column(DateTime,nullable=False, default=datetime.utcnow)

    mapper_args = {
        "polymorphic_identity": "admins"
    }
