from pydantic import BaseModel, ConfigDict

class DoctorCreate(BaseModel):
    first_name: str
    last_name: str
    login: str
    password: str

class DoctorsResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    login: str

    model_config = ConfigDict(from_attributes=True)

class DoctorLogin(BaseModel):
    username: str
    password: str

class ChangeDoctorPassword(BaseModel):
    password: str
    confirm_password: str