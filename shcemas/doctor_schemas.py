from pydantic import BaseModel, ConfigDict

class DoctorsResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    login: str

    model_config = ConfigDict(from_attributes=True)

class ChangeDoctorPassword(BaseModel):
    password: str
    confirm_password: str