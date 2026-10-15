import pytest
import os
import sys
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.session import Base, engine, SessionLocal
from seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    seed_database()
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
