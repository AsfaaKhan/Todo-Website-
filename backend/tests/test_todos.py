import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.database import User
from app.auth.hashing import get_password_hash


def test_create_and_get_todos(client):
    """Test creating and retrieving todos"""
    # Register a user
    client.post(
        "/auth/register",
        json={
            "username": "todouser",
            "email": "todo@example.com",
            "password": "testpassword123"
        }
    )

    # Login to get token
    login_response = client.post(
        "/auth/login",
        json={
            "username": "todouser",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Create a todo
    response = client.post(
        "/todos/",
        json={
            "title": "Test Todo",
            "description": "Test Description"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    created_todo = response.json()
    assert created_todo["title"] == "Test Todo"
    assert created_todo["description"] == "Test Description"

    # Get the todo
    get_response = client.get(f"/todos/{created_todo['id']}",
                              headers={"Authorization": f"Bearer {token}"})
    assert get_response.status_code == 200
    retrieved_todo = get_response.json()
    assert retrieved_todo["id"] == created_todo["id"]


def test_update_todo(client):
    """Test updating a todo"""
    # Register a user
    client.post(
        "/auth/register",
        json={
            "username": "updateuser",
            "email": "update@example.com",
            "password": "testpassword123"
        }
    )

    # Login to get token
    login_response = client.post(
        "/auth/login",
        json={
            "username": "updateuser",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Create a todo
    create_response = client.post(
        "/todos/",
        json={
            "title": "Original Title",
            "description": "Original Description"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    todo_id = create_response.json()["id"]

    # Update the todo
    update_response = client.put(
        f"/todos/{todo_id}",
        json={
            "title": "Updated Title"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    updated_todo = update_response.json()
    assert updated_todo["title"] == "Updated Title"


def test_delete_todo(client):
    """Test deleting a todo"""
    # Register a user
    client.post(
        "/auth/register",
        json={
            "username": "deleteuser",
            "email": "delete@example.com",
            "password": "testpassword123"
        }
    )

    # Login to get token
    login_response = client.post(
        "/auth/login",
        json={
            "username": "deleteuser",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]

    # Create a todo
    create_response = client.post(
        "/todos/",
        json={
            "title": "Delete Test",
            "description": "Will be deleted"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    todo_id = create_response.json()["id"]

    # Delete the todo
    delete_response = client.delete(
        f"/todos/{todo_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_response.status_code == 204