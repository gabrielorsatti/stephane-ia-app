/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title: string; body: string; url?: string; icon?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Gym Track", body: event.data.text() };
  }

  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon ?? "/Personnal-gym-tracker/icon.svg",
    badge: "/Personnal-gym-tracker/icon.svg",
    data: { url: payload.url },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? "/Personnal-gym-tracker/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("Personnal-gym-tracker") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
