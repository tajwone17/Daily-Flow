import { Task, CreateTaskData, UpdateTaskData } from "./types";

const API_BASE_URL = "/api/tasks";

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// Create headers with auth token
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Get all tasks
export async function getTasks(): Promise<{ tasks: Task[] }> {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

// Create a new task
export async function createTask(
  taskData: CreateTaskData
): Promise<{ task: Task }> {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create task");
  }

  return response.json();
}

// Update a task
export async function updateTask(
  taskId: string,
  updateData: UpdateTaskData
): Promise<{ task: Task }> {
  console.log("Updating task API call:", {
    taskId,
    updateData,
    url: `${API_BASE_URL}/${taskId}`,
  });

  const response = await fetch(`${API_BASE_URL}/${taskId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Update task API error:", { status: response.status, error });
    throw new Error(error.message || "Failed to update task");
  }

  return response.json();
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${taskId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete task");
  }
}

// Toggle task completion
export async function toggleTaskCompletion(
  task: Task
): Promise<{ task: Task }> {
  return updateTask(task._id, { completed: !task.completed });
}
