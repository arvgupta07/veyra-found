CREATE OR REPLACE FUNCTION public.is_verified_founder()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
    SELECT 1 FROM public.founders
    WHERE user_id = auth.uid() AND verified = true AND COALESCE(shadow_banned, false) = false
  )
$function$;

UPDATE public.founders f
   SET verified = true, verified_at = COALESCE(f.verified_at, now())
 WHERE f.user_id IS NOT NULL
   AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = f.user_id AND r.role = 'admin')
   AND f.verified = false;