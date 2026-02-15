from enum import Enum

class Role(str, Enum):
    USER = 'user'
    DOCTOR = 'doctor'
    ADMIN = 'admin'
