from fastapi import FastAPI
from core.database import init_db
from routers import users_router, auth_router, users_admin_router

app = FastAPI()
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(users_router.router)
app.include_router(auth_router.router)
app.include_router(users_admin_router.router)


