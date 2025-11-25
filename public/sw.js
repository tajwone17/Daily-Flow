// Service Worker for Push Notifications
// This allows notifications to work even when the app is closed

const CACHE_NAME = "daily-flow-v1";
const urlsToCache = ["/", "/dashboard", "/tasks", "/profile", "/favicon.ico"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData = {
    title: "Daily Flow Reminder",
    body: "You have a task reminder",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "daily-flow-reminder",
    requireInteraction: true,
    data: {
      url: "/dashboard",
    },
  };

  // Parse notification data from push message
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
      };
    } catch (error) {
      console.log("Error parsing push data:", error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: "view-task",
          title: "View Task",
          icon: "/favicon.ico",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Default action or 'view-task' - open the app
  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline task scheduling
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync for task reminders
      console.log("Background sync triggered")
    );
  }
});

// Handle service worker updates
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
