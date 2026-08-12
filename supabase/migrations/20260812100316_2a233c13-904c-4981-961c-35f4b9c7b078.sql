ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS poll_question text,
  ADD COLUMN IF NOT EXISTS poll_options text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.forum_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  option_index smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, founder_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_poll_votes TO authenticated;
GRANT ALL ON public.forum_poll_votes TO service_role;

ALTER TABLE public.forum_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read poll votes"
  ON public.forum_poll_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Founders cast their own poll vote"
  ON public.forum_poll_votes FOR INSERT TO authenticated
  WITH CHECK (founder_id = public.current_founder_id() AND option_index >= 0 AND option_index < 4);

CREATE POLICY "Founders change their own poll vote"
  ON public.forum_poll_votes FOR UPDATE TO authenticated
  USING (founder_id = public.current_founder_id())
  WITH CHECK (founder_id = public.current_founder_id() AND option_index >= 0 AND option_index < 4);

CREATE POLICY "Founders or admins remove poll votes"
  ON public.forum_poll_votes FOR DELETE TO authenticated
  USING (founder_id = public.current_founder_id() OR public.is_admin());

CREATE INDEX IF NOT EXISTS forum_poll_votes_post_idx ON public.forum_poll_votes(post_id);