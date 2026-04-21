-- Supabase Edge Function: send-push-notification
-- Deploy as a Supabase Edge Function (Deno) to send Web Push notifications.
--
-- This SQL creates a database trigger that fires on INSERT into the
-- `notifications` table and calls the Edge Function via pg_net.
--
-- Prerequisites:
--   1. Enable pg_net extension: CREATE EXTENSION IF NOT EXISTS pg_net;
--   2. Deploy the Edge Function `send-push-notification` (see supabase/functions/)
--   3. Set secrets: VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT

-- Enable pg_net for HTTP calls from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: when a notification is inserted, call the Edge Function
CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_url text;
  service_key text;
BEGIN
  -- Get the Edge Function URL from Supabase project settings
  edge_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  service_key := current_setting('app.settings.supabase_service_role_key', true);

  -- Only fire if both settings are configured
  IF edge_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM extensions.http_post(
      url := edge_url,
      body := json_build_object(
        'user_id', NEW.user_id,
        'actor_id', NEW.actor_id,
        'type', NEW.type,
        'session_id', NEW.session_id
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger (idempotent)
DROP TRIGGER IF EXISTS trg_push_on_notification ON notifications;
CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_on_insert();
