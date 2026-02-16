from sqlalchemy import Table, Column, ForeignKey

from core.database import Base

course_users = Table(
    "course_users",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
    Column("users_id", ForeignKey("users.id"), primary_key=True),
)