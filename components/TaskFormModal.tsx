"use client";

import { Task, CreateTaskData, UpdateTaskData } from "@/lib/types";
import { createTask, updateTask } from "@/lib/taskApi";
import { useState, useEffect } from "react";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSave: (task: Task) => void;
  editingTask?: Task | null;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onTaskSave,
  editingTask,
}: TaskFormModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    priority: "Medium" as "High" | "Medium" | "Low",
    reminder: {
      enabled: false,
      minutesBefore: 15,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or editing task changes
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // Pre-fill form for editing
        const startTime = new Date(editingTask.startTime);
        const endTime = new Date(editingTask.endTime);

        setFormData({
          title: editingTask.title,
          description: editingTask.description,
          startTime: formatDateTimeLocal(startTime),
          endTime: formatDateTimeLocal(endTime),
          priority: editingTask.priority,
          reminder: {
            enabled: editingTask.reminder?.enabled || false,
            minutesBefore: editingTask.reminder?.minutesBefore || 15,
          },
        });
      } else {
        // Set default values for new task
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        setFormData({
          title: "",
          description: "",
          startTime: formatDateTimeLocal(now),
          endTime: formatDateTimeLocal(oneHourLater),
          priority: "Medium",
          reminder: {
            enabled: false,
            minutesBefore: 15,
          },
        });
      }
      setError("");
    }
  }, [isOpen, editingTask]);

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      if (editingTask) {
        // Update existing task
        console.log("Updating task:", {
          taskId: editingTask._id,
          title: formData.title,
        });

        const updateData: UpdateTaskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          priority: formData.priority,
          reminder: formData.reminder,
        };

        const { task } = await updateTask(editingTask._id, updateData);
        onTaskSave(task);
      } else {
        // Create new task
        const createData: CreateTaskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          priority: formData.priority,
          reminder: formData.reminder,
        };

        const { task } = await createTask(createData);
        onTaskSave(task);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter task description (optional)"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as "High" | "Medium" | "Low",
                  })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Reminder Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reminder Notification
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={formData.reminder.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminder: {
                          ...formData.reminder,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="reminderEnabled"
                    className="ml-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    Enable reminder
                  </label>
                </div>
              </div>

              {formData.reminder.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remind me before task starts
                  </label>
                  <select
                    value={formData.reminder.minutesBefore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminder: {
                          ...formData.reminder,
                          minutesBefore: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading
                  ? "Saving..."
                  : editingTask
                  ? "Update Task"
                  : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
