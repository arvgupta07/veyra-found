
-- Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

-- Auto-grant admin to specific email upon confirmation
CREATE OR REPLACE FUNCTION public.grant_admin_for_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'arv.gupta@bcomiaf.christuni.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_email();

-- Admin-override RLS policies
DROP POLICY IF EXISTS "admins read all conversations" ON public.conversations;
CREATE POLICY "admins read all conversations" ON public.conversations
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins delete any conversation" ON public.conversations;
CREATE POLICY "admins delete any conversation" ON public.conversations
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins read all messages" ON public.messages;
CREATE POLICY "admins read all messages" ON public.messages
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins delete any message" ON public.messages;
CREATE POLICY "admins delete any message" ON public.messages
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins delete any post" ON public.forum_posts;
CREATE POLICY "admins delete any post" ON public.forum_posts
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins delete any comment" ON public.forum_comments;
CREATE POLICY "admins delete any comment" ON public.forum_comments
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins delete any founder" ON public.founders;
CREATE POLICY "admins delete any founder" ON public.founders
  FOR DELETE TO authenticated USING (public.is_admin());
