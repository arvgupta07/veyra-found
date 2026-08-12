ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type_locked_at timestamp with time zone;

-- Stamp the lock for everyone who already finished onboarding.
UPDATE public.profiles p
   SET account_type_locked_at = now()
 WHERE account_type_locked_at IS NULL
   AND EXISTS (SELECT 1 FROM public.founders f WHERE f.user_id = p.id AND f.profile_complete = true)
    OR (account_type_locked_at IS NULL AND account_type IS DISTINCT FROM 'founder');

CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- The account type is picked once at sign-up and then frozen.
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF OLD.account_type_locked_at IS NOT NULL THEN
      RAISE EXCEPTION 'Your account type is locked and cannot be changed';
    END IF;
    NEW.account_type_locked_at := now();
  ELSE
    NEW.account_type_locked_at := OLD.account_type_locked_at;
  END IF;
  RETURN NEW;
END $function$;

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
  IF NEW.account_type IS DISTINCT FROM OLD.account_type
     AND EXISTS (
       SELECT 1 FROM public.profiles p
        WHERE p.id = OLD.user_id AND p.account_type_locked_at IS NOT NULL
     )
  THEN
    RAISE EXCEPTION 'Your account type is locked and cannot be changed';
  END IF;
  RETURN NEW;
END $function$;