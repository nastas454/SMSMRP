from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.database import SessionLocal
from core.jwt_service import JwtUtility

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
db = SessionLocal()

def get_current_user(token: str = Depends(oauth2_scheme))-> int:
    user_id = JwtUtility.decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id