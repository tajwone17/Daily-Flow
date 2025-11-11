export interface Task {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  priority: "High" | "Medium" | "Low";
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  priority?: "High" | "Medium" | "Low";
  completed?: boolean;
}

// Priority colors for UI
export const priorityColors = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-green-100 text-green-800 border-green-200",
};

// Format time for display
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// Check if task is today
export function isToday(dateString: string): boolean {
  const today = new Date();
  const taskDate = new Date(dateString);

  return (
    today.getDate() === taskDate.getDate() &&
    today.getMonth() === taskDate.getMonth() &&
    today.getFullYear() === taskDate.getFullYear()
  );
}
