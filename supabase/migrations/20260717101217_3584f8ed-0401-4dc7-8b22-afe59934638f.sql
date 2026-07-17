
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users see rows involving them (so both sides know a block exists and can hide UI).
CREATE POLICY "See blocks involving me" ON public.blocks
  FOR SELECT TO authenticated
  USING (
    blocker_id = public.current_founder_id()
    OR blocked_id = public.current_founder_id()
  );

-- Only the blocker can insert/delete their own block.
CREATE POLICY "Block someone as me" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = public.current_founder_id());

CREATE POLICY "Unblock as me" ON public.blocks
  FOR DELETE TO authenticated
  USING (blocker_id = public.current_founder_id());

CREATE INDEX blocks_blocker_idx ON public.blocks(blocker_id);
CREATE INDEX blocks_blocked_idx ON public.blocks(blocked_id);

-- Helper: is there a block in EITHER direction between two founders?
CREATE OR REPLACE FUNCTION public.is_blocked_between(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;
