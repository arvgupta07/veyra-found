-- 1) Stop anonymous execution of the poll tally helper
REVOKE EXECUTE ON FUNCTION public.forum_poll_tallies(uuid) FROM anon;

-- 2) Hide moderation flags on founders from members
CREATE OR REPLACE FUNCTION public.founder_is_hidden(_founder_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.founders
    WHERE id = _founder_id AND COALESCE(shadow_banned, false) = true
  )
$$;
REVOKE ALL ON FUNCTION public.founder_is_hidden(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.founder_is_hidden(uuid) TO authenticated, service_role;

REVOKE SELECT ON public.founders FROM anon, authenticated;
GRANT SELECT (
  id, user_id, headline, bio, location, background, years_experience, education,
  commitment, has_idea, idea_description, idea_industry, idea_stage, equity_offer,
  exit_vision, skills, industry_focus, active_status, linkedin_url, github_url,
  linkedin_verified, github_verified, aadhaar_verified, video_intro_url,
  vouches_count, trust_tier, profile_complete, seed_name, seed_avatar, created_at,
  remote_pref, looking_for, age, assessment_public, links, verified, verified_at,
  account_type
) ON public.founders TO authenticated;

-- 3) Shadow-banned authors hidden by the database, not by the client
DROP POLICY IF EXISTS "posts public read" ON public.forum_posts;
CREATE POLICY "posts public read" ON public.forum_posts FOR SELECT
USING (
  NOT public.founder_is_hidden(author_id)
  OR author_id = public.current_founder_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "comments public read" ON public.forum_comments;
CREATE POLICY "comments public read" ON public.forum_comments FOR SELECT
USING (
  NOT public.founder_is_hidden(author_id)
  OR author_id = public.current_founder_id()
  OR public.is_admin()
);

-- 4) Respect investor privacy toggle: drop the blanket read policy
DROP POLICY IF EXISTS "investors authenticated read" ON public.investor_profiles;