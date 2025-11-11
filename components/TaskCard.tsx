"use client";

import { Task, priorityColors, formatTime } from "@/lib/types";
import { toggleTaskCompletion, deleteTask } from "@/lib/taskApi";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

export default function TaskCard({
  task,
  onTaskUpdate,
  onTaskDelete,
  onTaskEdit,
}: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      const { task: updatedTask } = await toggleTaskCompletion(task);
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error toggling task completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setIsLoading(true);
      try {
        await deleteTask(task._id);
        onTaskDelete(task._id);
      } catch (error) {
        console.error("Error deleting task:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 ${
        task.completed ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={isLoading}
            className="mt-1 shrink-0"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
            >
              {task.completed && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-gray-900 dark:text-white truncate ${
                task.completed ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Time and Priority */}
            <div className="flex items-center space-x-4 mt-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTime(task.startTime)} - {formatTime(task.endTime)}
              </div>

              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 ml-2">
          <button
            onClick={() => {
              console.log("Edit task clicked:", {
                taskId: task._id,
                title: task.title,
              });
              onTaskEdit(task);
            }}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
