
-- Assessments: owner-only reads
DROP POLICY IF EXISTS "assessments public read" ON public.assessments;
CREATE POLICY "assessments owner read" ON public.assessments
  FOR SELECT TO authenticated
  USING (founder_id = public.current_founder_id() OR public.is_admin());

-- Founder prompts: authenticated only
DROP POLICY IF EXISTS "prompts public read" ON public.founder_prompts;
CREATE POLICY "prompts authenticated read" ON public.founder_prompts
  FOR SELECT TO authenticated USING (true);

-- Founders directory: authenticated only
DROP POLICY IF EXISTS "founders public read" ON public.founders;
CREATE POLICY "founders authenticated read" ON public.founders
  FOR SELECT TO authenticated USING (true);

-- Past ventures: authenticated only
DROP POLICY IF EXISTS "ventures public read" ON public.past_ventures;
CREATE POLICY "ventures authenticated read" ON public.past_ventures
  FOR SELECT TO authenticated USING (true);

-- Vouches: authenticated only
DROP POLICY IF EXISTS "vouches public read" ON public.vouches;
CREATE POLICY "vouches authenticated read" ON public.vouches
  FOR SELECT TO authenticated USING (true);

-- Investor profiles: authenticated only
DROP POLICY IF EXISTS "investors public read" ON public.investor_profiles;
CREATE POLICY "investors authenticated read" ON public.investor_profiles
  FOR SELECT TO authenticated USING (true);

-- Investor feed listings: authenticated, active, non-expired
DROP POLICY IF EXISTS "listings public read" ON public.investor_feed_listings;
CREATE POLICY "listings authenticated read" ON public.investor_feed_listings
  FOR SELECT TO authenticated
  USING (
    COALESCE(active, false) = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Investor feed listings insert: require conversation party (or null conversation but authenticated)
DROP POLICY IF EXISTS "listings insert authenticated" ON public.investor_feed_listings;
CREATE POLICY "listings insert by convo party" ON public.investor_feed_listings
  FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = investor_feed_listings.conversation_id
        AND (c.founder_a_id = public.current_founder_id()
          OR c.founder_b_id = public.current_founder_id())
    )
  );

-- Lock down SECURITY DEFINER helper functions from public/anon.
-- Trigger functions: revoke from all roles (only the table owner needs to run them).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_for_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.forum_upvotes_recount() FROM PUBLIC, anon, authenticated;

-- Helpers used inside RLS / app: authenticated only.
REVOKE ALL ON FUNCTION public.current_founder_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_demo_founder(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_founder_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_demo_founder(uuid) TO authenticated;
