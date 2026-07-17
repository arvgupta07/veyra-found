
DROP POLICY IF EXISTS "requests sender deletes" ON public.connection_requests;
CREATE POLICY "requests sender deletes" ON public.connection_requests
FOR DELETE USING (from_founder_id = public.current_founder_id());
