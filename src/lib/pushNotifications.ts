import { getSupabase } from "./supabase";

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_KEY
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    const options: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    };
    subscription = await reg.pushManager.subscribe(options);
  }

  const json = subscription.toJSON();
  const client = getSupabase();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!client || !json.endpoint || !p256dh || !auth) return false;

  const { error } = await client.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh,
      auth,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.warn("[push] save subscription failed", error.message);
    return false;
  }

  return true;
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const client = getSupabase();
    if (client) {
      await client
        .from("push_subscriptions")
        .delete()
        .match({ user_id: userId, endpoint });
    }
  }

  return true;
}
