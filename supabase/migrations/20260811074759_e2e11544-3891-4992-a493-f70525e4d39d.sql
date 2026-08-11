CREATE OR REPLACE FUNCTION public.is_verified_founder()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.founders
    WHERE user_id = auth.uid() AND verified = true AND COALESCE(shadow_banned, false) = false
  )
$$;

DROP POLICY IF EXISTS "requests sender inserts" ON public.connection_requests;
CREATE POLICY "requests sender inserts"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (from_founder_id = public.current_founder_id() AND public.is_verified_founder());

DROP POLICY IF EXISTS "messages insert by sender" ON public.messages;
CREATE POLICY "messages insert by sender"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_verified_founder()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
    )
  );