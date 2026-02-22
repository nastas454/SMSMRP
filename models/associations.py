from sqlalchemy import Table, Column, ForeignKey

from core.database import Base

course_patients = Table(
    "course_patients",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
    Column("patients_id", ForeignKey("patients.id"), primary_key=True),
)