from sqlalchemy import Column, ForeignKey, UUID
from models.user import Users


class Admins(Users):
    __tablename__ = 'admins'

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    mapper_args = {
        "polymorphic_identity": "admins"
    }
