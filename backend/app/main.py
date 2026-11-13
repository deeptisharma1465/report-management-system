
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.reports import router as reports_router
from app.api.routes.agencies import router as agencies_router
from app.api.routes.users import router as users_router
from app.api.routes.audit_logs import router as audit_logs_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(agencies_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(audit_logs_router, prefix="/api")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
