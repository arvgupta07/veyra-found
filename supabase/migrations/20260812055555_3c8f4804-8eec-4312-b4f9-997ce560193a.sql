CREATE OR REPLACE FUNCTION public.clear_conversation(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _me uuid;
BEGIN
  _me := public.current_founder_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not a founder'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (c.founder_a_id = _me OR c.founder_b_id = _me)
  ) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;
  DELETE FROM public.messages WHERE conversation_id = _conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_conversation(uuid) TO service_role;