
-- Message edit/delete/react
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Allow senders to delete their own messages
DROP POLICY IF EXISTS "messages delete by sender" ON public.messages;
CREATE POLICY "messages delete by sender" ON public.messages
FOR DELETE USING (sender_id = auth.uid());

-- Forum upvote count trigger
CREATE OR REPLACE FUNCTION public.forum_upvotes_recount()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET upvotes = COALESCE(upvotes,0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET upvotes = GREATEST(COALESCE(upvotes,0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS forum_upvotes_recount_ins ON public.forum_upvotes;
DROP TRIGGER IF EXISTS forum_upvotes_recount_del ON public.forum_upvotes;
CREATE TRIGGER forum_upvotes_recount_ins AFTER INSERT ON public.forum_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.forum_upvotes_recount();
CREATE TRIGGER forum_upvotes_recount_del AFTER DELETE ON public.forum_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.forum_upvotes_recount();

-- Recompute existing counts to fix drift
UPDATE public.forum_posts p SET upvotes = COALESCE((SELECT count(*) FROM public.forum_upvotes u WHERE u.post_id = p.id),0);
