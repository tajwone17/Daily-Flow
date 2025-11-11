"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task, isWithinPast7Days, getRelativeDateString } from "@/lib/types";
import { getTasks } from "@/lib/taskApi";
import TaskCard from "@/components/TaskCard";
import TaskFormModal from "@/components/TaskFormModal";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [user, setUser] = useState<{ fullName?: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  // Filter tasks
  const past7DaysTasks = tasks
    .filter((task) => isWithinPast7Days(task.startTime))
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  const upcomingTasks = tasks.filter(
    (task) =>
      !isWithinPast7Days(task.startTime) &&
      new Date(task.startTime) > new Date()
  );
  const completedTasks = tasks.filter((task) => task.completed);

  // Stats
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = totalTasks - completedCount;
  const past7DaysCount = past7DaysTasks.length;

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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-linear-to-br from-indigo-600 via-blue-600 to-blue-700 text-white p-2 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Daily Flow
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {user?.fullName || "User"}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>New Task</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Logout"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Past 7 Days
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {past7DaysCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Tasks Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks (Past 7 Days) */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
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
              Recent Tasks - Past 7 Days ({past7DaysCount})
            </h2>
            <div className="space-y-4">
              {past7DaysTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
                  <p className="text-gray-600 dark:text-gray-400">
                    No recent tasks in the past 7 days
                  </p>
                  <button
                    onClick={handleCreateTask}
                    className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                past7DaysTasks.map((task) => (
                  <div key={task._id} className="space-y-2">
                    {/* Date header for task grouping */}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      {getRelativeDateString(task.startTime)}
                    </div>
                    <TaskCard
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                      onTaskEdit={handleEditTask}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
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
              Upcoming Tasks ({upcomingTasks.length})
            </h2>
            <div className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
                  <p className="text-gray-600 dark:text-gray-400">
                    No upcoming tasks
                  </p>
                </div>
              ) : (
                upcomingTasks
                  .slice(0, 5)
                  .map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                      onTaskEdit={handleEditTask}
                    />
                  ))
              )}
              {upcomingTasks.length > 5 && (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                  And {upcomingTasks.length - 5} more tasks...
                </p>
              )}
            </div>
          </div>
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
