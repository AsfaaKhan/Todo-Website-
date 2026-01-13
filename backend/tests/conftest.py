import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import engine, get_session
from app.models.database import SQLModel
from sqlmodel import Session, create_engine
from contextlib import contextmanager
from typing import Generator


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///./test.db", echo=True)
    SQLModel.metadata.create_all(bind=engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()