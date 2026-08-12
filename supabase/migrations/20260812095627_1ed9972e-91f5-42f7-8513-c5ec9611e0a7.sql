ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('founder', 'investor', 'intern', 'talent'));

ALTER TABLE public.founders
  DROP CONSTRAINT IF EXISTS founders_account_type_check;
ALTER TABLE public.founders
  ADD CONSTRAINT founders_account_type_check
  CHECK (account_type IN ('founder', 'investor', 'intern', 'talent'));