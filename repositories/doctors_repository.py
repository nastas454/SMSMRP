from sqlalchemy.orm import Session
from models.doctors import Doctors
from repositories.common_repository import CommonRepository

class DoctorsRepository(CommonRepository[Doctors]):
    def __init__(self, db: Session):
        super().__init__(db, Doctors)


