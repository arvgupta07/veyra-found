ALTER TABLE public.founders
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'founder';

ALTER TABLE public.founders
  DROP CONSTRAINT IF EXISTS founders_account_type_check;
ALTER TABLE public.founders
  ADD CONSTRAINT founders_account_type_check
  CHECK (account_type IN ('founder', 'investor', 'talent'));

CREATE INDEX IF NOT EXISTS founders_account_type_idx ON public.founders (account_type);