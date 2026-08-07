DROP POLICY IF EXISTS "founder insert own" ON public.founders;
CREATE POLICY "founder insert own" ON public.founders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);