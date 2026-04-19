-- Migration : table de suivi de consommation API LLM par utilisateur.
-- Exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage_logs(created_at);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut insérer ses propres logs.
DROP POLICY IF EXISTS "owner_insert_usage" ON public.api_usage_logs;
CREATE POLICY "owner_insert_usage" ON public.api_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seuls les admins peuvent lire tous les logs.
DROP POLICY IF EXISTS "admin_read_usage" ON public.api_usage_logs;
CREATE POLICY "admin_read_usage" ON public.api_usage_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
