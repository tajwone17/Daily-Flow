"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Task, isToday, isTaskRunning, isTaskUpcoming } from "@/lib/types";
import { getTasks } from "@/lib/taskApi";
import TaskCard from "@/components/TaskCard";
import TaskFormModal from "@/components/TaskFormModal";
import Navigation from "@/components/Navigation";

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

  // Filter tasks for the new dashboard structure
  const todayTasks = tasks.filter((task) => isToday(task.startTime));
  const runningTasks = tasks.filter(
    (task) => isTaskRunning(task.startTime, task.endTime) && !task.completed
  );
  const upcomingTasks = tasks.filter(
    (task) => isTaskUpcoming(task.startTime) && !task.completed
  );
  const completedTasks = tasks.filter((task) => task.completed);

  // Stats
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = totalTasks - completedCount;
  const runningCount = runningTasks.length;

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
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Running Now
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {runningCount}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Tasks */}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Today&apos;s Tasks ({todayTasks.length})
            </h2>
            <div className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
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
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No tasks for today
                  </p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onTaskEdit={handleEditTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Running Tasks */}
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Running Now ({runningTasks.length})
            </h2>
            <div className="space-y-4">
              {runningTasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No tasks running right now
                  </p>
                </div>
              ) : (
                runningTasks.map((task) => (
                  <div key={task._id} className="relative">
                    {/* Running indicator */}
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        LIVE
                      </div>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
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
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
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
