"use client";

import { Task, isToday, formatTime } from "@/lib/types";
import { useEffect, useState } from "react";

interface DailySummaryProps {
  tasks: Task[];
}

export default function DailySummary({ tasks }: DailySummaryProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Filter today's tasks
  const todayTasks = tasks.filter((task) => isToday(task.startTime));

  // Calculate statistics
  const stats = {
    total: todayTasks.length,
    completed: todayTasks.filter((task) => task.completed).length,
    pending: todayTasks.filter((task) => !task.completed).length,
    overdue: todayTasks.filter((task) => {
      if (task.completed) return false;
      const taskEnd = new Date(task.endTime);
      return taskEnd < currentTime;
    }).length,
    upcoming: todayTasks.filter((task) => {
      if (task.completed) return false;
      const taskStart = new Date(task.startTime);
      return taskStart > currentTime;
    }).length,
    inProgress: todayTasks.filter((task) => {
      if (task.completed) return false;
      const taskStart = new Date(task.startTime);
      const taskEnd = new Date(task.endTime);
      return taskStart <= currentTime && taskEnd >= currentTime;
    }).length,
  };

  // Get next upcoming task
  const nextTask = todayTasks
    .filter((task) => {
      if (task.completed) return false;
      const taskStart = new Date(task.startTime);
      return taskStart > currentTime;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )[0];

  // Calculate completion rate
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Daily Summary
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Completed
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.inProgress}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            In Progress
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pending}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Pending
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.overdue}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Overdue
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Next Task */}
      {nextTask ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <svg
              className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
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
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Next Task
            </span>
          </div>
          <div className="text-gray-900 dark:text-white font-medium">
            {nextTask.title}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
            <span>Starts at {formatTime(nextTask.startTime)}</span>
            {nextTask.reminder?.enabled && (
              <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                📔 Reminder set
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center text-gray-600 dark:text-gray-400">
            {stats.total === 0 ? (
              <>
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
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
                <p className="text-sm">No tasks scheduled for today</p>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-emerald-500"
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
                <p className="text-sm">All tasks completed for today! 🎉</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
