from pydantic import BaseModel, ConfigDict

class AdminsResponse(BaseModel):
    id: int
    login: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
