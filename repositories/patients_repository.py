from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from models.patients import Patients
from repositories.common_repository import CommonRepository

class PatientsRepository(CommonRepository[Patients]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Patients)


