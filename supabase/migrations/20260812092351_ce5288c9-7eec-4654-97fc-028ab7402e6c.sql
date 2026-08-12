-- 1. Extend investor profiles
ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS stages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_profiles TO authenticated;
GRANT ALL ON public.investor_profiles TO service_role;

DROP POLICY IF EXISTS "investor_profiles_public_read" ON public.investor_profiles;
CREATE POLICY "investor_profiles_public_read" ON public.investor_profiles
  FOR SELECT TO authenticated USING (is_public = true OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "investor_profiles_own_write" ON public.investor_profiles;
CREATE POLICY "investor_profiles_own_write" ON public.investor_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investor_profiles_own_update" ON public.investor_profiles;
CREATE POLICY "investor_profiles_own_update" ON public.investor_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "investor_profiles_own_delete" ON public.investor_profiles;
CREATE POLICY "investor_profiles_own_delete" ON public.investor_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- 2. Talent profiles
CREATE TABLE IF NOT EXISTS public.talent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  headline text,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  desired_role text,
  work_type text NOT NULL DEFAULT 'internship',
  experience_years int NOT NULL DEFAULT 0,
  location text,
  remote_pref text NOT NULL DEFAULT 'remote',
  linkedin_url text,
  portfolio_url text,
  resume_url text,
  availability text,
  open_to_equity boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_profiles TO authenticated;
GRANT ALL ON public.talent_profiles TO service_role;
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_read" ON public.talent_profiles
  FOR SELECT TO authenticated USING (is_public = true OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "talent_insert_own" ON public.talent_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "talent_update_own" ON public.talent_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "talent_delete_own" ON public.talent_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- 3. Open roles
CREATE TABLE IF NOT EXISTS public.open_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id uuid REFERENCES public.founders(id) ON DELETE SET NULL,
  company_name text,
  title text NOT NULL,
  description text NOT NULL,
  role_type text NOT NULL DEFAULT 'full_time',
  skills text[] NOT NULL DEFAULT '{}',
  location text,
  remote_pref text NOT NULL DEFAULT 'remote',
  comp_min int,
  comp_max int,
  equity_note text,
  apply_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.open_roles TO authenticated;
GRANT ALL ON public.open_roles TO service_role;
ALTER TABLE public.open_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_read" ON public.open_roles
  FOR SELECT TO authenticated USING (status = 'open' OR posted_by = auth.uid() OR public.is_admin());
CREATE POLICY "roles_insert_own" ON public.open_roles
  FOR INSERT TO authenticated WITH CHECK (posted_by = auth.uid());
CREATE POLICY "roles_update_own" ON public.open_roles
  FOR UPDATE TO authenticated USING (posted_by = auth.uid()) WITH CHECK (posted_by = auth.uid());
CREATE POLICY "roles_delete_own" ON public.open_roles
  FOR DELETE TO authenticated USING (posted_by = auth.uid() OR public.is_admin());

-- 4. Role applications
CREATE TABLE IF NOT EXISTS public.role_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.open_roles(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, applicant_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_applications TO authenticated;
GRANT ALL ON public.role_applications TO service_role;
ALTER TABLE public.role_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apps_read" ON public.role_applications
  FOR SELECT TO authenticated USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.open_roles r WHERE r.id = role_id AND r.posted_by = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "apps_insert_own" ON public.role_applications
  FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "apps_update" ON public.role_applications
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.open_roles r WHERE r.id = role_id AND r.posted_by = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.open_roles r WHERE r.id = role_id AND r.posted_by = auth.uid())
  );
CREATE POLICY "apps_delete_own" ON public.role_applications
  FOR DELETE TO authenticated USING (applicant_id = auth.uid() OR public.is_admin());

-- 5. Investor pitches
CREATE TABLE IF NOT EXISTS public.investor_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_profile_id uuid NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  deck_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investor_profile_id, from_user)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_pitches TO authenticated;
GRANT ALL ON public.investor_pitches TO service_role;
ALTER TABLE public.investor_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pitches_read" ON public.investor_pitches
  FOR SELECT TO authenticated USING (
    from_user = auth.uid()
    OR EXISTS (SELECT 1 FROM public.investor_profiles i WHERE i.id = investor_profile_id AND i.user_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "pitches_insert_own" ON public.investor_pitches
  FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());
CREATE POLICY "pitches_update_investor" ON public.investor_pitches
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.investor_profiles i WHERE i.id = investor_profile_id AND i.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.investor_profiles i WHERE i.id = investor_profile_id AND i.user_id = auth.uid())
  );
CREATE POLICY "pitches_delete_own" ON public.investor_pitches
  FOR DELETE TO authenticated USING (from_user = auth.uid() OR public.is_admin());

-- 6. updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS talent_touch ON public.talent_profiles;
CREATE TRIGGER talent_touch BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS roles_touch ON public.open_roles;
CREATE TRIGGER roles_touch BEFORE UPDATE ON public.open_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS apps_touch ON public.role_applications;
CREATE TRIGGER apps_touch BEFORE UPDATE ON public.role_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS pitches_touch ON public.investor_pitches;
CREATE TRIGGER pitches_touch BEFORE UPDATE ON public.investor_pitches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS investor_profiles_touch ON public.investor_profiles;
CREATE TRIGGER investor_profiles_touch BEFORE UPDATE ON public.investor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();