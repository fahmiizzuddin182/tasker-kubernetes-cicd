# Tasker

Tasker is a simple task management web application built with Flask and PostgreSQL. It allows users to create, view, update, and delete tasks through a web-based interface.

This project is developed by Muhammad Fahmi Izzuddin Bin Mohd Idrus as part of the **End-to-End CI/CD Pipeline with GitHub, Docker, and Kubernetes** assignment.

## Features

- Create, view, update, and delete tasks.
- Add descriptions and due dates to tasks.
- Assign priorities to tasks.
- Track task status.

## Technologies Used

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JavaScript
- **Database:** PostgreSQL (Supabase)
- **Database Driver:** Psycopg 3
- **Testing:** Pytest
- **Environment Configuration:** python-dotenv

## Project Structure

```text
cicd-kubernetes-project/
├── app/
│   ├── static/
│   ├── templates/
│   ├── database.py
│   ├── routes.py
│   └── __init__.py
├── docs/
│   └── evidence/
├── k8s/
├── tests/
│   └── test_app.py
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── requirements.txt
└── run.py
```

## Prerequisites

- Python 3.10 or later
- Git
- A Supabase account with a PostgreSQL project

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/fahmiizzuddin182/tasker-kubernetes-cicd.git
cd tasker-kubernetes-cicd
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate the environment:

**Linux/macOS:**

```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root directory using `.env.example` as a reference.

Configure the following variables:

```env
DATABASE_URL=your_supabase_postgresql_connection_string
TEST_DATABASE_URL=your_supabase_test_database_connection_string
```

- `DATABASE_URL` connects the application to the main PostgreSQL database.
- `TEST_DATABASE_URL` connects automated tests to a separate test database.

### 5. Run the application

```bash
python run.py
```

Open the application in your browser:

[http://127.0.0.1:5000](http://127.0.0.1:5000)

## Running Automated Tests

Make sure `TEST_DATABASE_URL` is configured in your `.env` file.

Run the test suite:

```bash
python -m pytest -v
```

The automated tests cover application health, version information, and task CRUD operations.

Tests use a separate PostgreSQL test database to avoid modifying the main application database.

## API Endpoints

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | `/`           | Display the application      |
| GET    | `/health`     | Check application health     |
| GET    | `/version`    | Retrieve application version |
| POST   | `/tasks`      | Create a task                |
| GET    | `/tasks`      | Retrieve all tasks           |
| GET    | `/tasks/{id}` | Retrieve a specific task     |
| PUT    | `/tasks/{id}` | Update a task                |
| DELETE | `/tasks/{id}` | Delete a task                |

## Application Version

**Current version:** 1.0.0

