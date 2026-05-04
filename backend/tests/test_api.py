"""Test suite for MindCare AI — Auth endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db


import os

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/test_db")

# Safety net: ensure we are connecting to a test database
if "test" not in TEST_DATABASE_URL.lower():
    raise ValueError("CRITICAL: TEST_DATABASE_URL must contain 'test' to prevent dropping production data.")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Recreate tables before each test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestHealth:
    def test_health_check(self):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_api_health(self):
        response = client.get("/api/health")
        assert response.status_code == 200


class TestAuth:
    def test_register_patient(self):
        response = client.post("/api/auth/register", json={
            "email": "maria@correo.com",
            "password": "securePass123",
            "role": "patient",
            "first_name": "María",
            "last_name": "González",
            "age": 21,
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "patient"

    def test_register_psychologist(self):
        response = client.post("/api/auth/register", json={
            "email": "dr.garcia@correo.com",
            "password": "securePass123",
            "role": "psychologist",
            "first_name": "Dr. Carlos",
            "last_name": "García",
        })
        assert response.status_code == 201
        assert response.json()["role"] == "psychologist"

    def test_register_duplicate_email(self):
        client.post("/api/auth/register", json={
            "email": "maria@correo.com",
            "password": "securePass123",
            "role": "patient",
            "first_name": "María",
            "last_name": "González",
        })
        response = client.post("/api/auth/register", json={
            "email": "maria@correo.com",
            "password": "anotherPass123",
            "role": "patient",
            "first_name": "Otra",
            "last_name": "Persona",
        })
        assert response.status_code == 400

    def test_login_success(self):
        client.post("/api/auth/register", json={
            "email": "maria@correo.com",
            "password": "securePass123",
            "role": "patient",
            "first_name": "María",
            "last_name": "González",
        })
        response = client.post("/api/auth/login", json={
            "email": "maria@correo.com",
            "password": "securePass123",
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_invalid_credentials(self):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongPassword",
        })
        assert response.status_code == 401

    def test_get_me_authenticated(self):
        reg_response = client.post("/api/auth/register", json={
            "email": "maria@correo.com",
            "password": "securePass123",
            "role": "patient",
            "first_name": "María",
            "last_name": "González",
        })
        token = reg_response.json()["access_token"]

        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["email"] == "maria@correo.com"

    def test_get_me_unauthenticated(self):
        response = client.get("/api/auth/me")
        assert response.status_code == 401


class TestPatientEndpoints:
    def _register_patient(self):
        response = client.post("/api/auth/register", json={
            "email": "paciente@correo.com",
            "password": "securePass123",
            "role": "patient",
            "first_name": "Test",
            "last_name": "patient",
            "age": 20,
        })
        return response.json()["access_token"]

    def test_patient_dashboard(self):
        token = self._register_patient()
        response = client.get("/api/patients/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "current_streak" in data
        assert "general_state" in data

    def test_create_checkin(self):
        token = self._register_patient()
        response = client.post("/api/patients/checkins", json={
            "emotion": "happy",
            "intensity": 7,
            "note": "Terminé mi proyecto a tiempo.",
        }, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201
        data = response.json()
        assert data["emotion"] == "happy"
        assert data["intensity"] == 7

    def test_create_checkin_invalid_emotion(self):
        token = self._register_patient()
        response = client.post("/api/patients/checkins", json={
            "emotion": "invalid_emotion",
            "intensity": 7,
        }, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 422

    def test_get_checkin_history(self):
        token = self._register_patient()
        response = client.get("/api/patients/checkins", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_psychologist_cannot_access_patient_endpoints(self):
        response = client.post("/api/auth/register", json={
            "email": "psi@correo.com",
            "password": "securePass123",
            "role": "psychologist",
            "first_name": "Dr.",
            "last_name": "Test",
        })
        token = response.json()["access_token"]
        response = client.get("/api/patients/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403
