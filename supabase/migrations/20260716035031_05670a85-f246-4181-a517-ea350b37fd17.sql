
drop policy if exists "listings authenticated write" on public.investor_feed_listings;
create policy "listings insert authenticated" on public.investor_feed_listings for insert to authenticated with check (true);
create policy "listings update by convo party" on public.investor_feed_listings for update to authenticated using (
  conversation_id is null or exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);
create policy "listings delete by convo party" on public.investor_feed_listings for delete to authenticated using (
  conversation_id is not null and exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);

revoke execute on function public.current_founder_id() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
