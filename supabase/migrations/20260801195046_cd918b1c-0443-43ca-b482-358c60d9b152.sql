-- 1. Messages: sender-only content edits; other party limited to reactions/read
DROP POLICY IF EXISTS "messages update by convo parties" ON public.messages;

CREATE POLICY "messages update by sender"
ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages reactions by convo parties"
ON public.messages FOR UPDATE TO authenticated
USING (
  sender_id IS DISTINCT FROM auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
);

-- Column-scope safeguard for non-sender updates
DROP TRIGGER IF EXISTS enforce_message_update_scope_trg ON public.messages;
CREATE TRIGGER enforce_message_update_scope_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update_scope();

-- 2. Lock down SECURITY DEFINER / internal functions from direct client calls
REVOKE ALL ON FUNCTION public.claim_demo_founder(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_demo_founder(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.forum_upvotes_recount() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_message_update_scope() FROM PUBLIC, anon, authenticated;