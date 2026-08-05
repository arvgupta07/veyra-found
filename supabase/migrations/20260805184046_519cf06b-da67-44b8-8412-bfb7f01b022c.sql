DROP POLICY IF EXISTS "listings insert by convo party" ON public.investor_feed_listings;
DROP POLICY IF EXISTS "listings update by convo party" ON public.investor_feed_listings;

CREATE POLICY "listings insert by convo party" ON public.investor_feed_listings
FOR INSERT TO authenticated
WITH CHECK (
  conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = investor_feed_listings.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
);

CREATE POLICY "listings update by convo party" ON public.investor_feed_listings
FOR UPDATE TO authenticated
USING (
  conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = investor_feed_listings.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
)
WITH CHECK (
  conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = investor_feed_listings.conversation_id
      AND (c.founder_a_id = public.current_founder_id() OR c.founder_b_id = public.current_founder_id())
  )
);