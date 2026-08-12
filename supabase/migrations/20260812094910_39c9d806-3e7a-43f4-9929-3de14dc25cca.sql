ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'founder';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('founder', 'investor', 'talent'));

ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS companies_invested integer,
  ADD COLUMN IF NOT EXISTS notable_investments text,
  ADD COLUMN IF NOT EXISTS firm_type text;

ALTER TABLE public.investor_profiles
  DROP CONSTRAINT IF EXISTS investor_profiles_firm_type_check;
ALTER TABLE public.investor_profiles
  ADD CONSTRAINT investor_profiles_firm_type_check
  CHECK (firm_type IS NULL OR firm_type IN ('angel', 'syndicate', 'vc_fund', 'family_office', 'accelerator', 'other'));

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS education text;