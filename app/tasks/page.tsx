"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task, getRelativeDateString } from "@/lib/types";
import { getTasks } from "@/lib/taskApi";
import TaskCard from "@/components/TaskCard";
import TaskFormModal from "@/components/TaskFormModal";
import Navigation from "@/components/Navigation";
import { getNotificationScheduler } from "@/lib/notificationScheduler";

interface TaskGroup {
  date: string;
  tasks: Task[];
}

export default function AllTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [user, setUser] = useState<{ fullName?: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "7days" | "30days" | "90days"
  >("all");

  // Check authentication and load user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    loadTasks();
  }, [router]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { tasks: fetchedTasks } = await getTasks();
      setTasks(fetchedTasks);
      setError("");

      // Schedule email reminders for tasks with reminders enabled
      if (typeof window !== "undefined") {
        getNotificationScheduler().scheduleMultipleReminders(fetchedTasks);
      }
    } catch (err) {
      setError("Failed to load tasks");
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSave = (savedTask: Task) => {
    if (editingTask) {
      // Update existing task
      setTasks(
        tasks.map((task) => (task._id === savedTask._id ? savedTask : task))
      );
    } else {
      // Add new task
      setTasks([...tasks, savedTask]);
    }
    setEditingTask(null);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(
      tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter((task) => task._id !== taskId));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleDebugReminder = async (task: Task) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found");
      return;
    }

    try {
      const response = await fetch("/api/debug/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: task._id }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Debug reminder sent successfully to: ${
            result.emailResult?.recipient || "unknown"
          }`
        );
      } else {
        const error = await response.json();
        alert(`Failed to send debug reminder: ${error.message}`);
      }
    } catch (error) {
      console.error("Error sending debug reminder:", error);
      alert("Error sending debug reminder. Check console for details.");
    }
  };

  // Filter tasks based on selected filters
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];

    // Apply completion filter
    switch (filter) {
      case "completed":
        filteredTasks = filteredTasks.filter((task) => task.completed);
        break;
      case "pending":
        filteredTasks = filteredTasks.filter((task) => !task.completed);
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    // Apply date filter
    const now = new Date();
    switch (dateFilter) {
      case "7days":
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTasks = filteredTasks.filter(
          (task) => new Date(task.startTime) >= sevenDaysAgo
        );
        break;
      case "30days":
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        filteredTasks = filteredTasks.filter(
          (task) => new Date(task.startTime) >= thirtyDaysAgo
        );
        break;
      case "90days":
        const ninetyDaysAgo = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        filteredTasks = filteredTasks.filter(
          (task) => new Date(task.startTime) >= ninetyDaysAgo
        );
        break;
      default:
        // "all" - no date filtering
        break;
    }

    // Sort by date (newest first)
    return filteredTasks.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  };

  // Group tasks by date
  const groupTasksByDate = (tasks: Task[]): TaskGroup[] => {
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      const date = new Date(task.startTime).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
    });

    return Object.entries(groups).map(([date, tasks]) => ({
      date,
      tasks: tasks.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    }));
  };

  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByDate(filteredTasks);

  // Stats
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = totalTasks - completedCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <Navigation user={user} onCreateTask={handleCreateTask} />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Task History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete overview of all your tasks
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "completed" | "pending")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as "all" | "7days" | "30days" | "90days"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTasks.length} of {totalTasks} tasks
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-8">
          {groupedTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters or create a new task."
                  : "You haven't created any tasks yet."}
              </p>
              <button
                onClick={handleCreateTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create your first task
              </button>
            </div>
          ) : (
            groupedTasks.map((group) => (
              <div
                key={group.date}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getRelativeDateString(group.tasks[0].startTime)} (
                      {group.tasks.length} tasks)
                    </h3>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-6 space-y-4">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                      onTaskEdit={handleEditTask}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onTaskSave={handleTaskSave}
        editingTask={editingTask}
      />
    </div>
  );
}
