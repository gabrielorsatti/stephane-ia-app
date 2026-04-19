-- Migration : interactions sociales (likes / commentaires).
-- Exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_session ON public.likes(session_id);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_session ON public.comments(session_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Likes : tout utilisateur authentifié peut liker une séance publiée d'un ami.
CREATE POLICY "likes: authenticated insert" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes: authenticated read" ON public.likes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "likes: owner delete" ON public.likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Comments : même logique.
CREATE POLICY "comments: authenticated insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments: authenticated read" ON public.comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "comments: owner delete" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
