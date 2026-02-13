from datetime import datetime, timedelta
from typing import Any

from jose import jwt

SECRET_KEY= "57+-685c4h^%8j+gTU677U7&UHfghDGSI9485H3EgfhuiHC4C9OU65/745^&#*65=34^#5bRh1-2jyg6@#E@745$371hiB"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES= 60

class JwtUtility:
   @staticmethod
   def create_access_token(user_id:str,role: str)->str:
       expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
       payload = {
           "id": user_id,
           "role": role,
           "exp": expire
       }
       return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

   @staticmethod
   def decode_token(token: str) -> dict[str, Any] | None:
       try:
           payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
           return payload
       except Exception:
           return None