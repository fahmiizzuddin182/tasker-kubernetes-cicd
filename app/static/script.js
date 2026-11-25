
const taskForm = document.getElementById("taskForm");
const tasksContainer = document.getElementById("tasks");
const taskModal = document.getElementById("taskModal");

let allTasks = [];
let currentFilter = "all";
let editingTaskId = null;


// ------------------------------
// DATE HELPERS
// ------------------------------

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function isOverdue(task) {
    return (
        task.status !== "Completed" &&
        task.due_date &&
        task.due_date < getToday()
    );
}


function formatDate(dateString) {
    if (!dateString) return "No due date";

    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}


// ------------------------------
// LOAD TASKS
// ------------------------------

document.addEventListener("DOMContentLoaded", loadTasks);


async function loadTasks() {
    try {
        const response = await fetch("/tasks");

        if (!response.ok) {
            throw new Error("Unable to load tasks");
        }

        allTasks = await response.json();

        updateDashboard();
        renderTasks();
        renderUpcomingDeadlines();

    } catch (error) {
        console.error(error);
        tasksContainer.innerHTML =
            '<p class="empty-message">Unable to load tasks.</p>';
    }
}


// ------------------------------
// DASHBOARD STATISTICS
// ------------------------------

function updateDashboard() {
    const total = allTasks.length;

    const completed = allTasks.filter(
        task => task.status === "Completed"
    ).length;

    const pending = allTasks.filter(
        task => task.status !== "Completed"
    ).length;

    const overdue = allTasks.filter(
        task => isOverdue(task)
    ).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("overdueTasks").textContent = overdue;
}


// ------------------------------
// RENDER TASKS
// ------------------------------

function renderTasks() {
    const searchTerm = document
        .getElementById("searchTasks")
        .value.toLowerCase();

    const priority = document.getElementById("priorityFilter").value;
    const status = document.getElementById("statusFilter").value;

    let filteredTasks = allTasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description || "").toLowerCase().includes(searchTerm);

        const matchesPriority =
            priority === "all" || task.priority === priority;

        const matchesStatus =
            status === "all" || task.status === status;

        const matchesNavigation =
            currentFilter === "all" ||
            task.status === currentFilter;

        return (
            matchesSearch &&
            matchesPriority &&
            matchesStatus &&
            matchesNavigation
        );
    });

    tasksContainer.innerHTML = "";

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML =
            '<p class="empty-message">No matching tasks found.</p>';
        return;
    }

    filteredTasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
    });

    filteredTasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("h3");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent =
            task.description || "No description provided.";

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priorityBadge = document.createElement("span");
        priorityBadge.className =
            `task-badge priority-${task.priority.toLowerCase()}`;
        priorityBadge.textContent = `${task.priority} Priority`;

        const statusBadge = document.createElement("span");
        statusBadge.className =
            `task-badge status-${isOverdue(task) ? "overdue" : task.status.toLowerCase()}`;
        statusBadge.textContent =
            isOverdue(task) ? "Overdue" : task.status;

        const dueDate = document.createElement("span");
        dueDate.className = "task-badge";
        dueDate.textContent = `Due: ${formatDate(task.due_date)}`;

        meta.append(priorityBadge, statusBadge, dueDate);

        info.append(title, description, meta);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        if (task.status !== "Completed") {
            const completeButton = document.createElement("button");
            completeButton.className = "complete-button";
            completeButton.textContent = "Complete";

            completeButton.addEventListener("click", () => {
                updateTaskStatus(task, "Completed");
            });

            actions.appendChild(completeButton);
        }

        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => openEditModal(task));

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        actions.append(editButton, deleteButton);

        card.append(info, actions);
        tasksContainer.appendChild(card);
    });
}


// ------------------------------
// UPCOMING DEADLINES
// ------------------------------

function renderUpcomingDeadlines() {
    const container = document.getElementById("upcomingTasks");

    const today = getToday();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const endDate =
        `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

    const deadlineTasks = allTasks
        .filter(task =>
            task.status !== "Completed" &&
            task.due_date &&
            task.due_date <= endDate
        )
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5);

    container.innerHTML = "";

    if (deadlineTasks.length === 0) {
        container.innerHTML =
            '<p class="empty-message">No upcoming deadlines in the next 7 days.</p>';
        return;
    }

    deadlineTasks.forEach(task => {
        const item = document.createElement("div");

        const overdue = task.due_date < today;

        item.className = `upcoming-item ${overdue ? "overdue" : ""}`;

        const info = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent = `${task.priority} Priority`;

        info.append(title, description);

        const deadline = document.createElement("span");
        deadline.className =
            `deadline-label ${overdue ? "overdue" : ""}`;

        if (overdue) {
            deadline.textContent = `Overdue · ${formatDate(task.due_date)}`;
        } else if (task.due_date === today) {
            deadline.textContent = "Due Today";
        } else {
            deadline.textContent = formatDate(task.due_date);
        }

        item.append(info, deadline);
        container.appendChild(item);
    });
}


// ------------------------------
// MODAL CONTROLS
// ------------------------------

function openTaskModal() {
    editingTaskId = null;
    taskForm.reset();

    document.getElementById("priority").value = "Medium";

    document.querySelector(".modal-header h2").textContent = "Add New Task";
    document.querySelector(".modal-actions button[type='submit']").textContent =
        "Create Task";

    taskModal.classList.add("show");
}


function closeTaskModal() {
    taskModal.classList.remove("show");
    taskForm.reset();
    editingTaskId = null;
}


document.getElementById("openTaskForm").addEventListener("click", openTaskModal);

document.getElementById("closeTaskForm").addEventListener("click", closeTaskModal);

document.getElementById("cancelTask").addEventListener("click", closeTaskModal);


// ------------------------------
// CREATE AND EDIT TASKS
// ------------------------------

taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const task = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value,
        priority: document.getElementById("priority").value,
        due_date: document.getElementById("due_date").value || null
    };

    const url = editingTaskId
        ? `/tasks/${editingTaskId}`
        : "/tasks";

    const method = editingTaskId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(task)
        });

        if (!response.ok) {
            throw new Error("Unable to save task");
        }

        closeTaskModal();
        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Unable to save task.");
    }
});


function openEditModal(task) {
    editingTaskId = task.id;

    document.getElementById("title").value = task.title;
    document.getElementById("description").value = task.description || "";
    document.getElementById("priority").value = task.priority;
    document.getElementById("due_date").value = task.due_date || "";

    document.querySelector(".modal-header h2").textContent = "Edit Task";
    document.querySelector(".modal-actions button[type='submit']").textContent =
        "Save Changes";

    taskModal.classList.add("show");
}


// ------------------------------
// UPDATE TASK STATUS
// ------------------------------

async function updateTaskStatus(task, newStatus) {
    try {
        const response = await fetch(`/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) {
            throw new Error("Unable to update task");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Unable to update task status.");
    }
}


// ------------------------------
// DELETE TASK
// ------------------------------

async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        const response = await fetch(`/tasks/${taskId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Unable to delete task");
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Unable to delete task.");
    }
}


// ------------------------------
// SEARCH AND FILTERS
// ------------------------------

document.getElementById("searchTasks").addEventListener("input", renderTasks);

document.getElementById("priorityFilter").addEventListener("change", renderTasks);

document.getElementById("statusFilter").addEventListener("change", renderTasks);
