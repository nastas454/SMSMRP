from core.database import SessionLocal
from core.password_hasher import PasswordHasher
from models.doctors import Doctors
from repositories.doctors_repository import DoctorsRepository
from shcemas.doctor_schemas import DoctorCreate, DoctorsResponse

class DoctorsAdminService:
    def __init__(self):
        self.db = SessionLocal()
        self.repo = DoctorsRepository(self.db)
        self.hasher = PasswordHasher()

    def register_doctor(self, doctor_dto: DoctorCreate):
        if self.repo.if_login_exists(str(doctor_dto.login)):
            raise Exception('This login already exists')
        doctor_dto.password = self.hasher.hash(doctor_dto.password)
        doctor = Doctors(**doctor_dto.model_dump())
        return DoctorsResponse.model_validate(self.repo.create_entity(doctor))

