ALTER TABLE public.founders
  ADD COLUMN IF NOT EXISTS shadow_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spam_strikes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assessment_public boolean NOT NULL DEFAULT false;

ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS cross_categories forum_category[] NOT NULL DEFAULT '{}';

ALTER TABLE public.forum_comments
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE TABLE IF NOT EXISTS public.forum_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, founder_id)
);

GRANT SELECT, INSERT, DELETE ON public.forum_collaborators TO authenticated;
GRANT ALL ON public.forum_collaborators TO service_role;
ALTER TABLE public.forum_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collaborators readable" ON public.forum_collaborators
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "post author adds collaborators" ON public.forum_collaborators
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.forum_posts p WHERE p.id = post_id AND p.author_id = public.current_founder_id())
  );

CREATE POLICY "author or self removes collaborator" ON public.forum_collaborators
  FOR DELETE TO authenticated USING (
    founder_id = public.current_founder_id()
    OR EXISTS (SELECT 1 FROM public.forum_posts p WHERE p.id = post_id AND p.author_id = public.current_founder_id())
    OR public.is_admin()
  );

CREATE POLICY "collaborators can update post" ON public.forum_posts
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.forum_collaborators c WHERE c.post_id = forum_posts.id AND c.founder_id = public.current_founder_id())
  );

CREATE POLICY "public assessments readable" ON public.assessments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.founders f WHERE f.id = assessments.founder_id AND f.assessment_public)
  );

CREATE POLICY "admins update any founder" ON public.founders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.forum_spam_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent integer := 0;
  dupes integer := 0;
BEGIN
  IF TG_TABLE_NAME = 'forum_posts' THEN
    SELECT count(*) INTO recent FROM public.forum_posts
      WHERE author_id = NEW.author_id AND created_at > now() - interval '2 minutes';
    SELECT count(*) INTO dupes FROM public.forum_posts
      WHERE author_id = NEW.author_id AND content = NEW.content AND created_at > now() - interval '1 day';
  ELSE
    SELECT count(*) INTO recent FROM public.forum_comments
      WHERE author_id = NEW.author_id AND created_at > now() - interval '1 minute';
    SELECT count(*) INTO dupes FROM public.forum_comments
      WHERE author_id = NEW.author_id AND content = NEW.content AND created_at > now() - interval '1 day';
  END IF;

  IF recent >= 4 OR dupes >= 2 THEN
    UPDATE public.founders
       SET spam_strikes = COALESCE(spam_strikes, 0) + 1,
           shadow_banned = (COALESCE(spam_strikes, 0) + 1) >= 2
     WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS forum_posts_spam_guard ON public.forum_posts;
CREATE TRIGGER forum_posts_spam_guard AFTER INSERT ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.forum_spam_guard();

DROP TRIGGER IF EXISTS forum_comments_spam_guard ON public.forum_comments;
CREATE TRIGGER forum_comments_spam_guard AFTER INSERT ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.forum_spam_guard();