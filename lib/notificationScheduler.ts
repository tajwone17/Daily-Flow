import { Task } from "./types";

class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  public scheduleTaskReminder(task: Task): void {
    if (
      typeof window === "undefined" ||
      !task.reminder?.enabled ||
      task.completed
    ) {
      return;
    }

    // Clear existing notification for this task
    this.clearTaskReminder(task._id);

    const now = new Date();
    const taskStart = new Date(task.startTime);
    const reminderTime = new Date(
      taskStart.getTime() - task.reminder.minutesBefore * 60 * 1000
    );

    // Only schedule if reminder time is in the future
    if (reminderTime <= now) {
      return;
    }

    const delay = reminderTime.getTime() - now.getTime();

    const timeoutId = setTimeout(async () => {
      // Double-check the task hasn't been completed
      if (!task.completed) {
        await this.sendEmailReminder(task);
      }
      this.scheduledNotifications.delete(task._id);
    }, delay);

    this.scheduledNotifications.set(task._id, timeoutId);
  }

  public clearTaskReminder(taskId: string): void {
    const timeoutId = this.scheduledNotifications.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(taskId);
    }
  }

  public scheduleMultipleReminders(tasks: Task[]): void {
    if (typeof window === "undefined") {
      return;
    }

    // Clear existing reminders first
    this.clearAllReminders();

    tasks.forEach((task) => {
      if (task.reminder?.enabled && !task.completed) {
        this.scheduleTaskReminder(task);
      }
    });
  }

  public clearAllReminders(): void {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  public getScheduledCount(): number {
    return this.scheduledNotifications.size;
  }

  private async sendEmailReminder(task: Task): Promise<void> {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        return;
      }

      const emailData = {
        taskTitle: task.title,
        taskDescription: task.description || "",
        startTime: task.startTime,
        endTime: task.endTime || task.startTime,
      };

      await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailData),
      });
    } catch {
      // Silent fail
    }
  }
}

// Export a getter function to avoid SSR issues
export const getNotificationScheduler = () => {
  if (typeof window === "undefined") {
    // Return a no-op instance for server-side rendering
    return new Proxy({} as NotificationScheduler, {
      get: () => () => {},
    });
  }
  return NotificationScheduler.getInstance();
};

// Keep backward compatibility
export const notificationScheduler =
  typeof window !== "undefined" ? NotificationScheduler.getInstance() : null;
