from fastapi import FastAPI
from core.database import init_db
from routers import users_controller
app = FastAPI()
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(users_controller.router)


