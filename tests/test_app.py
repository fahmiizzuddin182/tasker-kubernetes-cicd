import os

import pytest

from app import create_app
import app.database as database


@pytest.fixture
def client(monkeypatch):
    test_database_url = os.environ.get("TEST_DATABASE_URL")

    if not test_database_url:
        pytest.fail(
            "TEST_DATABASE_URL is not configured. "
            "Please add a separate PostgreSQL test database connection "
            "to your .env file."
        )

    # Make the application use the test database instead of the main database.
    monkeypatch.setattr(
        database,
        "DATABASE_URL",
        test_database_url
    )

    app = create_app()
    app.config["TESTING"] = True

    # Clear test data before each test.
    connection = database.get_db_connection()

    try:
        connection.execute(
            "TRUNCATE TABLE tasks RESTART IDENTITY"
        )
        connection.commit()

    finally:
        connection.close()

    with app.test_client() as client:
        yield client


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json["status"] == "healthy"


def test_version(client):
    response = client.get("/version")

    assert response.status_code == 200
    assert response.json["version"] == "1.0.0"


def test_create_task(client):
    response = client.post("/tasks", json={
        "title": "Complete assignment",
        "priority": "High"
    })

    assert response.status_code == 201
    assert response.json["message"] == "Task created successfully"
    assert response.json["task_id"] is not None


def test_get_tasks(client):
    client.post("/tasks", json={
        "title": "Study Docker"
    })

    response = client.get("/tasks")

    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["title"] == "Study Docker"


def test_get_single_task(client):
    create_response = client.post("/tasks", json={
        "title": "Study Kubernetes"
    })

    task_id = create_response.json["task_id"]

    response = client.get(f"/tasks/{task_id}")

    assert response.status_code == 200
    assert response.json["title"] == "Study Kubernetes"


def test_update_task(client):
    create_response = client.post("/tasks", json={
        "title": "Original task"
    })

    task_id = create_response.json["task_id"]

    response = client.put(f"/tasks/{task_id}", json={
        "title": "Updated task"
    })

    assert response.status_code == 200

    updated_task = client.get(f"/tasks/{task_id}")

    assert updated_task.json["title"] == "Updated task"


def test_delete_task(client):
    create_response = client.post("/tasks", json={
        "title": "Task to delete"
    })

    task_id = create_response.json["task_id"]

    response = client.delete(f"/tasks/{task_id}")

    assert response.status_code == 200

    deleted_task = client.get(f"/tasks/{task_id}")

    assert deleted_task.status_code == 404


def test_create_task_without_title(client):
    response = client.post("/tasks", json={
        "description": "This task has no title"
    })

    assert response.status_code == 400
