export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.checkPermission();
      this.initServiceWorker();
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

  private async initServiceWorker(): Promise<void> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("Service workers not supported");
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log(
        "Service Worker registered successfully:",
        this.swRegistration
      );

      // Update service worker when a new one is available
      this.swRegistration.addEventListener("updatefound", () => {
        console.log("New service worker available");
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
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
      data: {
        url: "/dashboard",
      },
      ...options,
    };

    try {
      // Use service worker notification if available (works when app is closed)
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, defaultOptions);
        console.log("Push notification sent via service worker");
      } else {
        // Fallback to regular notification (only works when app is open)
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
      }
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

  public async scheduleBackgroundNotification(
    title: string,
    body: string,
    scheduleTime: Date,
    taskId?: string
  ): Promise<void> {
    if (!this.swRegistration) {
      console.warn("Service worker not available for background notifications");
      return;
    }

    // For immediate notifications, just show directly
    if (scheduleTime <= new Date()) {
      await this.showNotification(title, {
        body,
        tag: taskId ? `task-${taskId}` : "daily-flow-reminder",
        data: {
          taskId,
          url: "/dashboard",
        },
      });
      return;
    }

    // For future notifications, we'll use the existing scheduler
    // But now they'll use service worker notifications
    console.log(
      `Background notification scheduled for ${scheduleTime.toLocaleString()}`
    );
  }

  public isServiceWorkerSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator;
  }

  public getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }
}

// Export a getter function instead of direct instance to avoid SSR issues
export const getNotificationService = () => NotificationService.getInstance();

// Keep backward compatibility
export const notificationService =
  typeof window !== "undefined" ? NotificationService.getInstance() : null;
