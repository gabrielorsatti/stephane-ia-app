-- Migration : ajout du commentaire coach et du timestamp de création aux séances.
-- Exécuter dans le SQL Editor de Supabase.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS coach_commentary text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
