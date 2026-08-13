DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('forum_upvotes','forum_poll_votes') AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "Members can read only their own poll vote"
ON public.forum_poll_votes FOR SELECT TO authenticated
USING (founder_id = public.current_founder_id() OR public.is_admin());

CREATE POLICY "Members can read only their own upvote"
ON public.forum_upvotes FOR SELECT TO authenticated
USING (founder_id = public.current_founder_id() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.forum_poll_tallies(_post_id uuid)
RETURNS TABLE(option_index smallint, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.option_index, count(*)::bigint AS votes
  FROM public.forum_poll_votes v
  WHERE v.post_id = _post_id
  GROUP BY v.option_index
$$;

REVOKE ALL ON FUNCTION public.forum_poll_tallies(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forum_poll_tallies(uuid) TO authenticated, anon, service_role;