import base64
import os
from pathlib import Path

os.environ.setdefault("DOCNEST_ENV", "development")
os.environ.setdefault("DOCNEST_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DOCNEST_MASTER_KEY", base64.b64encode(b"0" * 32).decode())
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("STORAGE_DIR", str(Path(__file__).parent / "_storage"))
os.environ.setdefault("BLOCKCHAIN_ENABLED", "false")
os.environ.setdefault("INTEGRITY_MODE", "database")

from app.config import get_settings

get_settings.cache_clear()

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Household, Membership, User
from app.security.passwords import hash_password


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_db


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


def create_user(client: TestClient, email: str, name: str, household: str = "Test House"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "DemoPass123!",
            "full_name": name,
            "household_name": household,
        },
    )
    assert response.status_code == 201, response.text
    token = client.post("/api/auth/login", json={"email": email, "password": "DemoPass123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/auth/me", headers=headers).json()
    houses = client.get("/api/households/mine", headers=headers).json()
    return {"user": me, "headers": headers, "household": houses[0]}
