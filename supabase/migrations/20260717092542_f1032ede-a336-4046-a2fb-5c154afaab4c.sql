
ALTER TABLE public.forum_upvotes
  ADD COLUMN IF NOT EXISTS value smallint NOT NULL DEFAULT 1
    CHECK (value IN (-1, 1));

CREATE OR REPLACE FUNCTION public.forum_upvotes_recount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts
       SET upvotes = COALESCE(upvotes,0) + NEW.value
     WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts
       SET upvotes = COALESCE(upvotes,0) - OLD.value
     WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.forum_posts
       SET upvotes = COALESCE(upvotes,0) - OLD.value + NEW.value
     WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS forum_upvotes_recount_trg ON public.forum_upvotes;
CREATE TRIGGER forum_upvotes_recount_trg
AFTER INSERT OR UPDATE OR DELETE ON public.forum_upvotes
FOR EACH ROW EXECUTE FUNCTION public.forum_upvotes_recount();

-- Recompute existing counts from source of truth
UPDATE public.forum_posts p
   SET upvotes = COALESCE(sub.total, 0)
  FROM (
    SELECT post_id, SUM(value)::int AS total
      FROM public.forum_upvotes
     GROUP BY post_id
  ) sub
 WHERE sub.post_id = p.id;

UPDATE public.forum_posts SET upvotes = 0
 WHERE id NOT IN (SELECT post_id FROM public.forum_upvotes);
