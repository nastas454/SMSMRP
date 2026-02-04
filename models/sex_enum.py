from enum import Enum

class Sex(str, Enum):
    MALE = 'male'
    FEMALE = 'female'
    OTHER = 'other'