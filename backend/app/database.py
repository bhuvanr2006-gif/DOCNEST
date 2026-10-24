from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import BACKEND_ROOT, get_settings


class Base(DeclarativeBase):
    pass


def _engine_url() -> str:
    settings = get_settings()
    url = settings.database_url
    if url.startswith("sqlite:///./"):
        db_path = BACKEND_ROOT / url.replace("sqlite:///./", "")
        return f"sqlite:///{db_path.as_posix()}"
    return url


settings = get_settings()
connect_args = {"check_same_thread": False} if _engine_url().startswith("sqlite") else {}
engine = create_engine(_engine_url(), connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
