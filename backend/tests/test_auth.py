import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.database import User
from app.auth.hashing import get_password_hash


def test_register_user(client):
    """Test user registration endpoint"""
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_login_user(client):
    """Test user login endpoint"""
    # First register a user
    client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "testpassword123"
        }
    )

    # Then try to login
    response = client.post(
        "/auth/login",
        json={
            "username": "loginuser",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={
            "username": "nonexistent",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401