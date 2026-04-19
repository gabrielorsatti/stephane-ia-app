-- Migration : champs de publication sociale pour les séances.
-- Exécuter dans le SQL Editor de Supabase.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_comment text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sessions_published
  ON public.sessions (is_published, published_at DESC)
  WHERE is_published = true;

-- Remplace la politique de lecture amis pour exiger is_published = true.
DROP POLICY IF EXISTS "sessions: owner or friend read" ON public.sessions;

CREATE POLICY "sessions: owner or published friend read"
  ON public.sessions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.sender_id = auth.uid() AND f.receiver_id = user_id)
            OR (f.receiver_id = auth.uid() AND f.sender_id = user_id)
          )
      )
    )
  );
