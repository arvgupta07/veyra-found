-- purge_connection_between referenced a non-existent column, so disconnect/block
-- aborted and left stale accepted requests that blocked new ones.
CREATE OR REPLACE FUNCTION public.purge_connection_between(_a uuid, _b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _conv_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO _conv_ids FROM public.conversations
   WHERE (founder_a_id = _a AND founder_b_id = _b) OR (founder_a_id = _b AND founder_b_id = _a);

  IF _conv_ids IS NOT NULL THEN
    DELETE FROM public.messages WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.conversation_labels WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.conversation_pins WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.compatibility_reports WHERE conversation_id = ANY(_conv_ids);
    UPDATE public.conversations SET request_id = NULL WHERE id = ANY(_conv_ids);
    DELETE FROM public.conversations WHERE id = ANY(_conv_ids);
  END IF;

  DELETE FROM public.connection_requests
   WHERE (from_founder_id = _a AND to_founder_id = _b) OR (from_founder_id = _b AND to_founder_id = _a);
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_connection_between(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_connection_between(uuid, uuid) TO service_role;

-- Clean up orphaned requests left behind by the broken purge (no conversation exists).
DELETE FROM public.connection_requests cr
 WHERE cr.status = 'accepted'
   AND NOT EXISTS (
     SELECT 1 FROM public.conversations c
      WHERE (c.founder_a_id = cr.from_founder_id AND c.founder_b_id = cr.to_founder_id)
         OR (c.founder_a_id = cr.to_founder_id AND c.founder_b_id = cr.from_founder_id)
   );