
CREATE OR REPLACE FUNCTION public.enforce_message_update_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
    IF NEW.content IS DISTINCT FROM OLD.content
       OR NEW.edited_at IS DISTINCT FROM OLD.edited_at
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.seed_sender_founder_id IS DISTINCT FROM OLD.seed_sender_founder_id
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
    THEN
      RAISE EXCEPTION 'Only the sender can edit this message';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_message_update_scope ON public.messages;
CREATE TRIGGER enforce_message_update_scope
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_scope();

DROP FUNCTION IF EXISTS public.grant_admin_for_email() CASCADE;
