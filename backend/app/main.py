from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.assets import router as assets_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.documents import router as documents_router
from app.api.households import router as households_router
from app.api.ops import router as ops_router
from app.api.sharing import router as sharing_router
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="DocNest API",
    description="Secure household document and asset management for the DocNest academic prototype.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(households_router)
app.include_router(documents_router)
app.include_router(assets_router)
app.include_router(sharing_router)
app.include_router(dashboard_router)
app.include_router(ops_router)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "integrity_mode": "blockchain" if settings.blockchain_enabled and settings.integrity_mode == "blockchain" else "database",
        "blockchain_enabled": settings.blockchain_enabled,
    }


