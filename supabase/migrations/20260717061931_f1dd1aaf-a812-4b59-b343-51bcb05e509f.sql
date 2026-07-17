
CREATE OR REPLACE FUNCTION public.claim_demo_founder(target uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF target NOT IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
  ) THEN
    RAISE EXCEPTION 'not a demo founder';
  END IF;

  -- Detach any founder rows currently owned by this user (except the target).
  UPDATE public.founders SET user_id = NULL
   WHERE user_id = uid AND id <> target;

  -- Claim the seeded demo founder (steal from previous demo owner if needed).
  UPDATE public.founders SET user_id = uid WHERE id = target;

  RETURN target;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_demo_founder(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_demo_founder(uuid) TO authenticated;
