from typing import List
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.jwt_service import JwtUtility
from models.enums.role_enum import Role

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/users/login"
)


# --- 1. АВТЕНТИФІКАЦІЯ ---
def get_current_payload(token: str = Depends(oauth2_scheme)):
    payload = JwtUtility.decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недійсний токен або термін дії закінчився",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("id")


# --- 2. АВТОРИЗАЦІЯ ---
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, payload: dict = Depends(get_current_payload)) -> UUID:
        user_role = payload.get("role")
        user_id = payload.get("id")

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Немає прав доступу. Дозволені ролі: {', '.join(self.allowed_roles)}",
            )

        return UUID(user_id) if isinstance(user_id, str) else user_id


# Готові залежності для використання в ендпоінтах
require_patient = RoleChecker([Role.PATIENT.value])
require_doctor = RoleChecker([Role.DOCTOR.value])
require_admin = RoleChecker([Role.ADMIN.value])

# Залежність для спільного доступу
require_doctor_or_admin = RoleChecker([Role.DOCTOR.value, Role.ADMIN.value])