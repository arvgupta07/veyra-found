ALTER TABLE public.founders
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.founders(id) ON DELETE CASCADE,
  linkedin_url text NOT NULL,
  affiliation text,
  note text NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending
  ON public.verification_requests (founder_id) WHERE status = 'pending';

GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT UPDATE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own verification requests readable"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (founder_id = public.current_founder_id() OR public.is_admin());

CREATE POLICY "founders submit own verification"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (founder_id = public.current_founder_id() AND status = 'pending');

CREATE POLICY "admins review verification"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admins delete verification"
  ON public.verification_requests FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.verification_requests_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
    IF NEW.status = 'approved' THEN
      UPDATE public.founders SET verified = true, verified_at = now() WHERE id = NEW.founder_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.founders SET verified = false, verified_at = NULL WHERE id = NEW.founder_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS verification_requests_touch_trg ON public.verification_requests;
CREATE TRIGGER verification_requests_touch_trg
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.verification_requests_touch();