export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";

  private constructor() {
    if (typeof window !== "undefined") {
      this.checkPermission();
    }
  }

  public static getInstance(): NotificationService {
    if (typeof window === "undefined") {
      // Return a no-op instance for server-side rendering
      return new Proxy({} as NotificationService, {
        get: () => () => Promise.resolve(),
      });
    }

    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === "granted";
  }

  public async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    if (this.permission !== "granted") {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn("Notification permission denied");
        return;
      }
    }

    const defaultOptions: NotificationOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "daily-flow-task",
      requireInteraction: true,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click to focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }

  public showTaskReminder(taskTitle: string, startTime: string): void {
    const time = new Date(startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.showNotification("Task Reminder", {
      body: `"${taskTitle}" is starting at ${time}`,
      icon: "/favicon.ico",
      tag: `task-reminder-${taskTitle}`,
    });
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

// Export a getter function instead of direct instance to avoid SSR issues
export const getNotificationService = () => NotificationService.getInstance();

// Keep backward compatibility
export const notificationService =
  typeof window !== "undefined" ? NotificationService.getInstance() : null;
