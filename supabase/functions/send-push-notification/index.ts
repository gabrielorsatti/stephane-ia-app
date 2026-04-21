import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@gymtrack.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PushPayload {
  user_id: string;
  actor_id: string;
  type: "like" | "comment";
  session_id: string;
}

function buildMessage(type: string, actorUsername: string): { title: string; body: string } {
  if (type === "like") {
    return {
      title: "Nouveau kudo !",
      body: `${actorUsername} a aimé ta séance.`,
    };
  }
  if (type === "comment") {
    return {
      title: "Nouveau commentaire !",
      body: `${actorUsername} a commenté ta séance.`,
    };
  }
  return { title: "Gym Track", body: "Nouvelle activité sur ton profil." };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<boolean> {
  const { default: webpush } = await import("npm:web-push@3.6.7");

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
      { TTL: 60 * 60 },
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      return false;
    }
    console.error("[push] send failed", err);
    return true;
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body: PushPayload = await req.json();
  const { user_id, actor_id, type } = body;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: actor } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", actor_id)
    .single();

  const actorUsername = actor?.username ?? "Quelqu'un";
  const message = buildMessage(type, actorUsername);
  const payload = JSON.stringify({
    ...message,
    url: "/Personnal-gym-tracker/",
  });

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const staleIds: string[] = [];
  let sent = 0;

  for (const sub of subscriptions) {
    const ok = await sendWebPush(sub, payload);
    if (ok) {
      sent++;
    } else {
      staleIds.push(sub.id);
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return new Response(JSON.stringify({ sent, cleaned: staleIds.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
