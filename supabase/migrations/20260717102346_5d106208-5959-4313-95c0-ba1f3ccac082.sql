CREATE TABLE public.conversation_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_pins TO authenticated;
GRANT ALL ON public.conversation_pins TO service_role;
ALTER TABLE public.conversation_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founders manage own pins"
  ON public.conversation_pins FOR ALL
  USING (founder_id = public.current_founder_id())
  WITH CHECK (founder_id = public.current_founder_id());