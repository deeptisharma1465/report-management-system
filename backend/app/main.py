
from fastapi import FastAPI

from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.reports import router as reports_router
from app.api.routes.agencies import router as agencies_router
from app.api.routes.users import router as users_router
from app.api.routes.audit_logs import router as audit_logs_router

app = FastAPI(title=settings.app_name)

app.include_router(auth_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(agencies_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(audit_logs_router, prefix="/api")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
