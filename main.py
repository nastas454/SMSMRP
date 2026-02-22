from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from core.database import init_db
from core.seed import create_admin
from routers import auth_router, admin_router, courses_router, doctors_router, patients_router


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

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(doctors_router.router)
app.include_router(patients_router.router)
app.include_router(courses_router.router)
