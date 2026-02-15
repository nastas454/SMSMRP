from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.database import init_db
from core.seed import create_admin
from routers.common_routers import doctors_router, users_router
from routers.admin_routers import admin_router, doctors_admin_router, users_admin_router
from routers.auth_routers import auth_admin_router, auth_doctor_router, auth_users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    create_admin()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(users_router.router)
app.include_router(auth_users_router.router)
app.include_router(users_admin_router.router)
app.include_router(doctors_admin_router.router)
app.include_router(admin_router.router)
app.include_router(doctors_router.router)
app.include_router(auth_admin_router.router)
app.include_router(auth_doctor_router.router)


