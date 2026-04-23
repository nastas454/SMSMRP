from sqlalchemy.ext.asyncio import AsyncSession
from models.doctors import Doctors
from repositories.common_repository import CommonRepository

class DoctorsRepository(CommonRepository[Doctors]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Doctors)


