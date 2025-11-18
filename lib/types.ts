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
  reminder?: {
    enabled: boolean;
    time?: string;
    minutesBefore: number;
    notified: boolean;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  priority: "High" | "Medium" | "Low";
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  priority?: "High" | "Medium" | "Low";
  completed?: boolean;
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
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

// Check if task is within the past 7 days (including today)
export function isWithinPast7Days(dateString: string): boolean {
  const today = new Date();
  const taskDate = new Date(dateString);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  return taskDate >= sevenDaysAgo && taskDate <= today;
}

// Check if task is from previous days (not today but within past 7 days)
export function isPastWeek(dateString: string): boolean {
  return isWithinPast7Days(dateString) && !isToday(dateString);
}

// Check if task is currently running (between start and end time)
export function isTaskRunning(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  return now >= start && now <= end;
}

// Check if task is upcoming (start time is in the future)
export function isTaskUpcoming(startTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);

  return start > now;
}

// Get relative date string (Today, Yesterday, etc.)
export function getRelativeDateString(dateString: string): string {
  const today = new Date();
  const taskDate = new Date(dateString);
  const diffTime = today.getTime() - taskDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays <= 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(dateString);
  }
}
