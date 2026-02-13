from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.database import SessionLocal
from core.jwt_service import JwtUtility

oauth2_scheme_users = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    scheme_name="UserAuth"  # Унікальне ім'я для користувачів
)

oauth2_scheme_doctors = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    scheme_name="DoctorAuth"  # Унікальне ім'я для лікарів
)

oauth2_scheme_admins = OAuth2PasswordBearer(
    tokenUrl="/admin/login",
    scheme_name="AdminAuth"  # Унікальне ім'я для адмінів
)
db = SessionLocal()

def get_current_user(token: str = Depends(oauth2_scheme_users)) -> int:
    payload = JwtUtility.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("role") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as user",
        )

    return payload.get("id")

def get_current_doctor(token: str = Depends(oauth2_scheme_doctors)) -> int:
    payload = JwtUtility.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as doctor",
        )

    return payload.get("id")


def get_current_admin(token: str = Depends(oauth2_scheme_admins)) -> int:
    payload = JwtUtility.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as admin",
        )

    return payload.get("id")