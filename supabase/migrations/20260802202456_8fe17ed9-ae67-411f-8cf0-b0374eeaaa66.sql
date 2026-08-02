DROP POLICY IF EXISTS uploads_read_authenticated ON storage.objects;
CREATE POLICY uploads_read_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = (auth.uid())::text);