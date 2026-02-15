from core.database import SessionLocal
from core.jwt_service import JwtUtility
from core.password_hasher import PasswordHasher
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorsResponse, ChangeDoctorPassword


class DoctorsService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = DoctorsRepository(db=self.db)
        self.hasher = PasswordHasher()
        self.jwt = JwtUtility()

    def get_doctor(self, id: int):
        doctor = self.repo.get_by_id(id)
        return DoctorsResponse.model_validate(doctor)

    def change_doctor_password (self, id: int, new_password: ChangeDoctorPassword):
        doctor = self.repo.get_by_id(id)
        if new_password.password != new_password.confirm_password :
            raise Exception("Passwords don't match")
        doctor.password = self.hasher.hash(new_password.password)
        return DoctorsResponse.model_validate(self.repo.change_entity(doctor))

    def delete_doctor(self, id: int):
        doctor = self.repo.get_by_id(id)
        self.repo.delete_entity(doctor)
        return {
            "massage": "successfully deleted doctor"
        }