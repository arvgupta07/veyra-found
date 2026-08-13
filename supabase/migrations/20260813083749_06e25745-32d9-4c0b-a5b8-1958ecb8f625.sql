CREATE OR REPLACE FUNCTION public.founders_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- The member row must mirror the account type on the profile. Changing it to
  -- anything else once the profile type is locked stays forbidden.
  IF NEW.account_type IS DISTINCT FROM OLD.account_type
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles p
        WHERE p.id = OLD.user_id AND p.account_type = NEW.account_type
     )
     AND EXISTS (
       SELECT 1 FROM public.profiles p
        WHERE p.id = OLD.user_id AND p.account_type_locked_at IS NOT NULL
     )
  THEN
    RAISE EXCEPTION 'Your account type is locked and cannot be changed';
  END IF;
  RETURN NEW;
END $function$;