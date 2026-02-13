from pydantic import BaseModel, ConfigDict

class AdminCreate(BaseModel):
    login: str
    password: str

class AdminsResponse(BaseModel):
    id: int
    login: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class AdminLogin(BaseModel):
    username: str
    password: str