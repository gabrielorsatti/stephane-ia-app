/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = "v4";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// On activate: purge ALL caches that don't belong to the current Workbox
// precache. This nukes stale github.io caches and old versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          const isCurrentWorkbox = key.includes("workbox-precache");
          const isCurrentVersion = key.includes(CACHE_VERSION);
          if (!isCurrentWorkbox && !isCurrentVersion) {
            return caches.delete(key);
          }
          return undefined;
        }),
      );
    }).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Push notifications ──

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title: string; body: string; url?: string; icon?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Stephane IA", body: event.data.text() };
  }

  const base = self.registration.scope;
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon ?? `${base}icon.svg`,
    badge: `${base}icon.svg`,
    data: { url: payload.url },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const url = (event.notification.data?.url as string) ?? scope;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(scope) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
