from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from core.database import init_db
from core.seed import create_admin
from routers.common_routers import doctors_router, users_router
from routers.admin_routers import admin_router, doctors_admin_router, users_admin_router
from routers.auth_routers import auth_admin_router, auth_doctor_router, auth_users_router
from routers.courses_routers import courses_doctor_router, courses_admin_router, courses_user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await create_admin()
    yield

app = FastAPI(lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router.router)
app.include_router(auth_users_router.router)
app.include_router(users_admin_router.router)
app.include_router(doctors_admin_router.router)
app.include_router(admin_router.router)
app.include_router(doctors_router.router)
app.include_router(auth_admin_router.router)
app.include_router(auth_doctor_router.router)
app.include_router(courses_doctor_router.router)
app.include_router(courses_admin_router.router)
app.include_router(courses_user_router.router)