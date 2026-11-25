from flask import Blueprint, jsonify, request, render_template
from app.database import get_db_connection

main = Blueprint("main", __name__)


@main.route("/")
def home():
    return render_template("index.html")


@main.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy"
    }), 200


@main.route("/version", methods=["GET"])
def version():
    return jsonify({
        "application": "Task Management System",
        "version": "1.0.0"
    }), 200


@main.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json()

    if not data or not data.get("title"):
        return jsonify({
            "error": "Task title is required"
        }), 400

    title = data["title"]
    description = data.get("description", "")
    priority = data.get("priority", "Medium")
    status = data.get("status", "Pending")
    due_date = data.get("due_date")

    connection = get_db_connection()

    try:
        cursor = connection.execute("""
            INSERT INTO tasks (title, description, priority, status, due_date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (title, description, priority, status, due_date))

        task_id = cursor.fetchone()["id"]
        connection.commit()

    finally:
        connection.close()

    return jsonify({
        "message": "Task created successfully",
        "task_id": task_id
    }), 201


@main.route("/tasks", methods=["GET"])
def get_tasks():
    connection = get_db_connection()

    try:
        tasks = connection.execute(
            "SELECT * FROM tasks ORDER BY id"
        ).fetchall()

    finally:
        connection.close()

    return jsonify(tasks), 200


@main.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    connection = get_db_connection()

    try:
        task = connection.execute(
            "SELECT * FROM tasks WHERE id = %s",
            (task_id,)
        ).fetchone()

    finally:
        connection.close()

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    return jsonify(task), 200


@main.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No update data provided"
        }), 400

    connection = get_db_connection()

    try:
        task = connection.execute(
            "SELECT * FROM tasks WHERE id = %s",
            (task_id,)
        ).fetchone()

        if task is None:
            return jsonify({
                "error": "Task not found"
            }), 404

        title = data.get("title", task["title"])
        description = data.get("description", task["description"])
        priority = data.get("priority", task["priority"])
        status = data.get("status", task["status"])
        due_date = data.get("due_date", task["due_date"])

        if not isinstance(title, str) or not title.strip():
            return jsonify({
                "error": "Task title cannot be empty"
            }), 400

        connection.execute("""
            UPDATE tasks
            SET title = %s,
                description = %s,
                priority = %s,
                status = %s,
                due_date = %s
            WHERE id = %s
        """, (title, description, priority, status, due_date, task_id))

        connection.commit()

    finally:
        connection.close()

    return jsonify({
        "message": "Task updated successfully"
    }), 200


@main.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    connection = get_db_connection()

    try:
        task = connection.execute(
            "SELECT * FROM tasks WHERE id = %s",
            (task_id,)
        ).fetchone()

        if task is None:
            return jsonify({
                "error": "Task not found"
            }), 404

        connection.execute(
            "DELETE FROM tasks WHERE id = %s",
            (task_id,)
        )

        connection.commit()

    finally:
        connection.close()

    return jsonify({
        "message": "Task deleted successfully"
    }), 200
