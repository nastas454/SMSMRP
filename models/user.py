import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, UUID, DateTime
from core.database import Base

class Users(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)

    email = Column(String,nullable=False, index=True, unique=True)
    login = Column(String,nullable=False, index=True, unique=True)
    password = Column(String,nullable=False)

    role = Column(String,nullable=False, index=True)
    is_active = Column(Boolean,nullable=False, index=True, default=True)

    create_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    mapper_args = {
        "polymorphic_identity": "user",
        "polymorphic_on": "user_type",
    }