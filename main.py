from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.database import init_db
from core.seed import create_admin
from routers import users_router, auth_router, users_admin_router, doctors_admin_router, admin_router, doctors_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    create_admin()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(users_router.router)
app.include_router(auth_router.router)
app.include_router(users_admin_router.router)
app.include_router(doctors_admin_router.router)
app.include_router(admin_router.router)
app.include_router(doctors_router.router)

