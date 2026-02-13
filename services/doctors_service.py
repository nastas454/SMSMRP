from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorsResponse

class DoctorsService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = DoctorsRepository(db=self.db)
        self.hasher = PasswordHasher()

    def get_doctor(self, id: int):
        doctor = self.repo.get_by_id(id)
        return DoctorsResponse.model_validate(doctor)

    def delete_doctor(self, id: int):
        doctor = self.repo.get_by_id(id)
        self.repo.delete_entity(doctor)
        return {
            "massage": "successfully deleted doctor"
        }