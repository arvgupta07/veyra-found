-- 1. Founders: block self-escalation of trust/moderation columns
CREATE OR REPLACE FUNCTION public.founders_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.trust_tier IS DISTINCT FROM OLD.trust_tier
     OR NEW.vouches_count IS DISTINCT FROM OLD.vouches_count
     OR NEW.shadow_banned IS DISTINCT FROM OLD.shadow_banned
     OR NEW.spam_strikes IS DISTINCT FROM OLD.spam_strikes
     OR NEW.linkedin_verified IS DISTINCT FROM OLD.linkedin_verified
     OR NEW.github_verified IS DISTINCT FROM OLD.github_verified
     OR NEW.aadhaar_verified IS DISTINCT FROM OLD.aadhaar_verified
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Verification, trust and moderation fields cannot be changed';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS founders_guard_privileged_columns_trg ON public.founders;
CREATE TRIGGER founders_guard_privileged_columns_trg
BEFORE UPDATE ON public.founders
FOR EACH ROW EXECUTE FUNCTION public.founders_guard_privileged_columns();

-- 2. Profiles: block self-granting Pro / role changes
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.is_pro IS DISTINCT FROM OLD.is_pro
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.id IS DISTINCT FROM OLD.id
  THEN
    RAISE EXCEPTION 'Pro status and account role cannot be changed';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns_trg ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileged_columns();

-- 3. Investor profiles: block self-verification
CREATE OR REPLACE FUNCTION public.investor_profiles_guard_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Verification status cannot be changed';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS investor_profiles_guard_verified_trg ON public.investor_profiles;
CREATE TRIGGER investor_profiles_guard_verified_trg
BEFORE UPDATE ON public.investor_profiles
FOR EACH ROW EXECUTE FUNCTION public.investor_profiles_guard_verified();

-- 4. Make sure new investor rows cannot start out verified
ALTER TABLE public.investor_profiles ALTER COLUMN verified SET DEFAULT false;

-- 5. Tighten EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.blocks_purge_connection() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.purge_connection_between(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.forum_spam_guard() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.forum_upvotes_recount() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.founders_guard_privileged_columns() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.profiles_guard_privileged_columns() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.investor_profiles_guard_verified() FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.clear_conversation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.disconnect_founder(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.clear_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_founder(uuid) TO authenticated;

-- 6. Messages: restrict non-sender updates to reactions/read only (harden existing guard)
CREATE OR REPLACE FUNCTION public.enforce_message_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.seed_sender_founder_id IS DISTINCT FROM OLD.seed_sender_founder_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.edited_at IS DISTINCT FROM OLD.edited_at
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    THEN
      RAISE EXCEPTION 'Only the sender can modify this message';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_message_update_scope_trg ON public.messages;
CREATE TRIGGER enforce_message_update_scope_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_scope();