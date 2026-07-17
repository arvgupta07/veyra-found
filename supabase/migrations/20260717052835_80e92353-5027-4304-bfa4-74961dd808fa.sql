
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE public.remote_pref AS ENUM ('onsite','hybrid','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.founders ADD COLUMN IF NOT EXISTS remote_pref public.remote_pref;
ALTER TABLE public.founders ADD COLUMN IF NOT EXISTS looking_for text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS seeking_feedback boolean NOT NULL DEFAULT false;
