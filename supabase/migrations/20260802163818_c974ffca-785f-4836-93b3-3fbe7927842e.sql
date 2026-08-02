-- Remove duplicate vote-recount triggers (they were double-counting each vote)
DROP TRIGGER IF EXISTS forum_upvotes_recount_ins ON public.forum_upvotes;
DROP TRIGGER IF EXISTS forum_upvotes_recount_del ON public.forum_upvotes;
DROP TRIGGER IF EXISTS enforce_message_update_scope ON public.messages;

-- Forum post image
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS image_url text;

-- Storage policies for the private user-uploads bucket
CREATE POLICY "uploads_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'user-uploads');
CREATE POLICY "uploads_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "uploads_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "uploads_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);