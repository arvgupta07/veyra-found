CREATE OR REPLACE FUNCTION public.enforce_message_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
    -- Non-senders may only change reactions / read flag. Everything else must be identical.
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
END $function$;

DROP POLICY IF EXISTS "messages reactions by convo parties" ON public.messages;
CREATE POLICY "messages reactions by convo parties"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
)
WITH CHECK (
  sender_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
);