CREATE OR REPLACE FUNCTION public.disconnect_founder(_other_founder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _me uuid;
BEGIN
  _me := public.current_founder_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not a founder'; END IF;
  IF _other_founder_id IS NULL OR _other_founder_id = _me THEN RAISE EXCEPTION 'Invalid founder'; END IF;
  PERFORM public.purge_connection_between(_me, _other_founder_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_connection_between(_a uuid, _b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _conv_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO _conv_ids FROM public.conversations
   WHERE (founder_a_id = _a AND founder_b_id = _b) OR (founder_a_id = _b AND founder_b_id = _a);

  IF _conv_ids IS NOT NULL THEN
    DELETE FROM public.messages WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.conversation_labels WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.conversation_pins WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.compatibility_reports WHERE conversation_id = ANY(_conv_ids);
    UPDATE public.connection_requests SET conversation_id = NULL WHERE conversation_id = ANY(_conv_ids);
    DELETE FROM public.conversations WHERE id = ANY(_conv_ids);
  END IF;

  DELETE FROM public.connection_requests
   WHERE (from_founder_id = _a AND to_founder_id = _b) OR (from_founder_id = _b AND to_founder_id = _a);
END;
$$;

REVOKE ALL ON FUNCTION public.purge_connection_between(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_founder(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.blocks_purge_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.purge_connection_between(NEW.blocker_id, NEW.blocked_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blocks_purge_connection_trg ON public.blocks;
CREATE TRIGGER blocks_purge_connection_trg
AFTER INSERT ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.blocks_purge_connection();