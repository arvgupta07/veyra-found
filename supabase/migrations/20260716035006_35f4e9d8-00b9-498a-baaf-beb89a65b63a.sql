
create type user_role as enum ('founder','investor');
create type founder_background as enum ('technical','business','design','other');
create type founder_commitment as enum ('full_time','part_time','exploring');
create type founder_stage as enum ('idea','mvp','revenue','funded');
create type founder_exit as enum ('lifestyle','acquisition','ipo');
create type founder_active as enum ('active','open','paused');
create type trust_tier as enum ('Builder','Maker','Veteran');
create type venture_outcome as enum ('running','exited','shut_down');
create type request_status as enum ('pending','accepted','declined','withdrawn');
create type convo_stage as enum ('talking','intro_call','trial_project','confirmed');
create type forum_category as enum ('idea_validation','looking_for_cofounder','industry_talk','resources','success_stories');
create type listing_type as enum ('standard','featured');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'founder',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by everyone" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid()=id);

create table public.founders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  headline text, bio text, location text,
  background founder_background,
  years_experience integer, education text,
  commitment founder_commitment,
  has_idea boolean default false,
  idea_description text, idea_industry text,
  idea_stage founder_stage, equity_offer text,
  exit_vision founder_exit,
  skills text[] default '{}', industry_focus text[] default '{}',
  active_status founder_active default 'active',
  linkedin_url text, github_url text,
  linkedin_verified boolean default false,
  github_verified boolean default false,
  aadhaar_verified boolean default false,
  video_intro_url text, vouches_count integer default 0,
  trust_tier trust_tier default 'Builder',
  profile_complete boolean default false,
  seed_name text, seed_avatar text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.founders to authenticated;
grant select on public.founders to anon;
grant all on public.founders to service_role;
alter table public.founders enable row level security;
create policy "founders public read" on public.founders for select using (true);
create policy "founder update own" on public.founders for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "founder insert own" on public.founders for insert to authenticated with check (auth.uid()=user_id or user_id is null);

create or replace function public.current_founder_id() returns uuid language sql stable security definer set search_path=public as $$
  select id from public.founders where user_id = auth.uid() limit 1
$$;

create table public.founder_prompts (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete cascade,
  prompt_question text not null, prompt_answer text not null,
  display_order integer default 0
);
grant select, insert, update, delete on public.founder_prompts to authenticated;
grant select on public.founder_prompts to anon;
grant all on public.founder_prompts to service_role;
alter table public.founder_prompts enable row level security;
create policy "prompts public read" on public.founder_prompts for select using (true);
create policy "prompts owner write" on public.founder_prompts for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.past_ventures (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete cascade,
  company_name text, outcome venture_outcome, description text,
  linkedin_verified boolean default false
);
grant select, insert, update, delete on public.past_ventures to authenticated;
grant select on public.past_ventures to anon;
grant all on public.past_ventures to service_role;
alter table public.past_ventures enable row level security;
create policy "ventures public read" on public.past_ventures for select using (true);
create policy "ventures owner write" on public.past_ventures for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid unique not null references public.founders(id) on delete cascade,
  openness_score integer, conscientiousness_score integer, extraversion_score integer,
  agreeableness_score integer, neuroticism_score integer,
  risk_score integer, decision_velocity_score integer,
  equity_philosophy_score integer, vision_score integer,
  raw_answers jsonb, completed_at timestamptz default now()
);
grant select, insert, update, delete on public.assessments to authenticated;
grant select on public.assessments to anon;
grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "assessments public read" on public.assessments for select using (true);
create policy "assessments owner write" on public.assessments for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_founder_id uuid not null references public.founders(id) on delete cascade,
  to_founder_id uuid not null references public.founders(id) on delete cascade,
  prompt_question text, message text,
  status request_status default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(from_founder_id, to_founder_id)
);
grant select, insert, update, delete on public.connection_requests to authenticated;
grant all on public.connection_requests to service_role;
alter table public.connection_requests enable row level security;
create policy "requests visible to parties" on public.connection_requests for select to authenticated using (
  from_founder_id = public.current_founder_id() or to_founder_id = public.current_founder_id()
);
create policy "requests sender inserts" on public.connection_requests for insert to authenticated with check (from_founder_id = public.current_founder_id());
create policy "requests parties update" on public.connection_requests for update to authenticated using (
  from_founder_id = public.current_founder_id() or to_founder_id = public.current_founder_id()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  founder_a_id uuid not null references public.founders(id) on delete cascade,
  founder_b_id uuid not null references public.founders(id) on delete cascade,
  request_id uuid references public.connection_requests(id),
  stage convo_stage default 'talking',
  created_at timestamptz not null default now(),
  unique(founder_a_id, founder_b_id)
);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "convo visible to parties" on public.conversations for select to authenticated using (
  founder_a_id = public.current_founder_id() or founder_b_id = public.current_founder_id()
);
create policy "convo parties insert" on public.conversations for insert to authenticated with check (
  founder_a_id = public.current_founder_id() or founder_b_id = public.current_founder_id()
);
create policy "convo parties update" on public.conversations for update to authenticated using (
  founder_a_id = public.current_founder_id() or founder_b_id = public.current_founder_id()
);

create table public.conversation_labels (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  founder_id uuid not null references public.founders(id) on delete cascade,
  label text not null, color text,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.conversation_labels to authenticated;
grant all on public.conversation_labels to service_role;
alter table public.conversation_labels enable row level security;
create policy "labels owner" on public.conversation_labels for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  seed_sender_founder_id uuid references public.founders(id) on delete cascade,
  content text not null, read boolean default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "messages visible to convo parties" on public.messages for select to authenticated using (
  exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);
create policy "messages insert by sender" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);
create policy "messages update by convo parties" on public.messages for update to authenticated using (
  exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);
alter publication supabase_realtime add table public.messages;
alter table public.messages replica identity full;

create table public.compatibility_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid unique not null references public.conversations(id) on delete cascade,
  compatibility_score integer,
  alignment_points jsonb, divergence_points jsonb,
  risk_flags jsonb, conversation_starters jsonb,
  rationale_summary text,
  generated_at timestamptz default now()
);
grant select, insert, update, delete on public.compatibility_reports to authenticated;
grant all on public.compatibility_reports to service_role;
alter table public.compatibility_reports enable row level security;
create policy "reports visible to convo parties" on public.compatibility_reports for select to authenticated using (
  exists(select 1 from public.conversations c where c.id=conversation_id and (c.founder_a_id = public.current_founder_id() or c.founder_b_id = public.current_founder_id()))
);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.founders(id) on delete cascade,
  title text not null, content text not null,
  category forum_category, industry_tag text,
  upvotes integer default 0, is_pinned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.forum_posts to authenticated;
grant select on public.forum_posts to anon;
grant all on public.forum_posts to service_role;
alter table public.forum_posts enable row level security;
create policy "posts public read" on public.forum_posts for select using (true);
create policy "posts author insert" on public.forum_posts for insert to authenticated with check (author_id = public.current_founder_id());
create policy "posts author update" on public.forum_posts for update to authenticated using (author_id = public.current_founder_id());
create policy "posts author delete" on public.forum_posts for delete to authenticated using (author_id = public.current_founder_id());

create table public.forum_upvotes (
  founder_id uuid not null references public.founders(id) on delete cascade,
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  primary key(founder_id, post_id)
);
grant select, insert, delete on public.forum_upvotes to authenticated;
grant select on public.forum_upvotes to anon;
grant all on public.forum_upvotes to service_role;
alter table public.forum_upvotes enable row level security;
create policy "upvotes public read" on public.forum_upvotes for select using (true);
create policy "upvotes owner write" on public.forum_upvotes for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.founders(id) on delete cascade,
  content text not null,
  parent_comment_id uuid references public.forum_comments(id) on delete cascade,
  upvotes integer default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.forum_comments to authenticated;
grant select on public.forum_comments to anon;
grant all on public.forum_comments to service_role;
alter table public.forum_comments enable row level security;
create policy "comments public read" on public.forum_comments for select using (true);
create policy "comments author write" on public.forum_comments for all to authenticated using (author_id = public.current_founder_id()) with check (author_id = public.current_founder_id());

create table public.forum_saves (
  founder_id uuid not null references public.founders(id) on delete cascade,
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  primary key(founder_id, post_id)
);
grant select, insert, delete on public.forum_saves to authenticated;
grant all on public.forum_saves to service_role;
alter table public.forum_saves enable row level security;
create policy "saves owner" on public.forum_saves for all to authenticated using (founder_id = public.current_founder_id()) with check (founder_id = public.current_founder_id());

create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.founders(id) on delete cascade,
  vouchee_id uuid not null references public.founders(id) on delete cascade,
  skill_tag text, context text, accepted boolean default false,
  created_at timestamptz not null default now(),
  unique(voucher_id, vouchee_id, skill_tag)
);
grant select, insert, update, delete on public.vouches to authenticated;
grant select on public.vouches to anon;
grant all on public.vouches to service_role;
alter table public.vouches enable row level security;
create policy "vouches public read" on public.vouches for select using (true);
create policy "vouches voucher write" on public.vouches for all to authenticated using (voucher_id = public.current_founder_id()) with check (voucher_id = public.current_founder_id());

create table public.investor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  fund_name text, thesis text,
  check_size_min integer, check_size_max integer,
  industries text[] default '{}', verified boolean default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.investor_profiles to authenticated;
grant select on public.investor_profiles to anon;
grant all on public.investor_profiles to service_role;
alter table public.investor_profiles enable row level security;
create policy "investors public read" on public.investor_profiles for select using (true);
create policy "investor own write" on public.investor_profiles for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

create table public.investor_feed_listings (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  pitch_video_url text, idea_oneliner text,
  traction_metrics text, raise_amount text, raise_purpose text,
  listing_type listing_type default 'standard',
  active boolean default true, expires_at timestamptz,
  views integer default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.investor_feed_listings to authenticated;
grant select on public.investor_feed_listings to anon;
grant all on public.investor_feed_listings to service_role;
alter table public.investor_feed_listings enable row level security;
create policy "listings public read" on public.investor_feed_listings for select using (true);
create policy "listings authenticated write" on public.investor_feed_listings for all to authenticated using (true) with check (true);

create table public.investor_interests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investor_profiles(id) on delete cascade,
  listing_id uuid not null references public.investor_feed_listings(id) on delete cascade,
  saved boolean default false, interested boolean default false,
  created_at timestamptz not null default now(),
  unique(investor_id, listing_id)
);
grant select, insert, update, delete on public.investor_interests to authenticated;
grant all on public.investor_interests to service_role;
alter table public.investor_interests enable row level security;
create policy "interests owner" on public.investor_interests for all to authenticated using (
  exists(select 1 from public.investor_profiles ip where ip.id=investor_id and ip.user_id=auth.uid())
) with check (
  exists(select 1 from public.investor_profiles ip where ip.id=investor_id and ip.user_id=auth.uid())
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), coalesce((new.raw_user_meta_data->>'role')::user_role,'founder'));
  return new;
end$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- SEED
insert into public.founders (id, user_id, headline, bio, location, background, years_experience, commitment, has_idea, idea_description, idea_industry, idea_stage, equity_offer, exit_vision, skills, industry_focus, active_status, linkedin_url, linkedin_verified, github_verified, trust_tier, profile_complete, seed_name, seed_avatar) values
('11111111-1111-1111-1111-111111111111', null, 'Full-stack engineer obsessed with fintech', 'Building B2B payment infra. Ex-Razorpay. Looking for a business co-founder who has sold to CFOs.', 'Mumbai', 'technical', 3, 'full_time', true, 'B2B payment reconciliation SaaS for mid-market Indian companies', 'Fintech', 'idea', '40%', 'ipo', ARRAY['React','Node.js','Python','AWS','PostgreSQL'], ARRAY['Fintech','SaaS','B2B'], 'active', 'https://linkedin.com/in/arjunsharma', true, true, 'Maker', true, 'Arjun Sharma', 'https://api.dicebear.com/7.x/initials/svg?seed=Arjun%20Sharma&backgroundColor=6366F1'),
('22222222-2222-2222-2222-222222222222', null, 'GTM leader — ex-Chargebee, ex-Freshworks', 'Sold SaaS to 400+ US mid-market accounts. Ready to build my own. Looking for a technical co-founder in fintech or B2B SaaS.', 'Bangalore', 'business', 8, 'full_time', false, null, null, null, '50%', 'acquisition', ARRAY['Sales','Growth Marketing','Operations','Finance'], ARRAY['Fintech','SaaS','B2B'], 'active', 'https://linkedin.com/in/nehakapoor', true, false, 'Veteran', true, 'Neha Kapoor', 'https://api.dicebear.com/7.x/initials/svg?seed=Neha%20Kapoor&backgroundColor=10B981'),
('33333333-3333-3333-3333-333333333333', null, 'ML engineer building for Indian hospitals', 'Ex-Practo. Trained diagnostic models on 2M+ images. Have an idea in radiology triage.', 'Delhi', 'technical', 5, 'full_time', true, 'AI-assisted radiology triage for Tier-2 hospitals', 'Healthtech', 'mvp', '45%', 'acquisition', ARRAY['Machine Learning','Python','Data Science','Hardware'], ARRAY['Healthtech','Deep Tech'], 'active', 'https://linkedin.com/in/rohanverma', true, true, 'Maker', true, 'Rohan Verma', 'https://api.dicebear.com/7.x/initials/svg?seed=Rohan%20Verma&backgroundColor=F59E0B'),
('44444444-4444-4444-4444-444444444444', null, 'Product designer, ex-Unacademy', 'Shipped for 40M+ learners. I care about craft. Want an engineer who cares about how things feel.', 'Bangalore', 'design', 6, 'full_time', false, null, null, null, '50%', 'ipo', ARRAY['UI/UX Design','Product Management','Growth Marketing'], ARRAY['Edtech','Consumer'], 'active', 'https://linkedin.com/in/priyanair', true, false, 'Maker', true, 'Priya Nair', 'https://api.dicebear.com/7.x/initials/svg?seed=Priya%20Nair&backgroundColor=EF4444'),
('55555555-5555-5555-5555-555555555555', null, 'Twice-YC founder, third time''s the charm', 'W19 & S21 — both acquihired. Looking for a hardcore technical co-founder for B2B SaaS in ops.', 'Mumbai', 'business', 10, 'full_time', true, 'AI ops co-pilot for D2C brands running on Shopify', 'SaaS', 'idea', '50%', 'ipo', ARRAY['Sales','Operations','Finance','Growth Marketing'], ARRAY['SaaS','B2B','E-commerce'], 'active', 'https://linkedin.com/in/vikramjoshi', true, false, 'Veteran', true, 'Vikram Joshi', 'https://api.dicebear.com/7.x/initials/svg?seed=Vikram%20Joshi&backgroundColor=0F172A'),
('66666666-6666-6666-6666-666666666666', null, 'Product-led operator, ex-1mg', 'Built the OTC vertical from 0 to ₹80Cr GMV. Now want to build in women''s health.', 'Bangalore', 'business', 7, 'full_time', true, 'Cycle-tracking + telehealth for Indian women, in Hindi + English', 'Healthtech', 'idea', '45%', 'acquisition', ARRAY['Product Management','Growth Marketing','Operations'], ARRAY['Healthtech','Consumer'], 'open', 'https://linkedin.com/in/kavyareddy', true, false, 'Maker', true, 'Kavya Reddy', 'https://api.dicebear.com/7.x/initials/svg?seed=Kavya%20Reddy&backgroundColor=818CF8'),
('77777777-7777-7777-7777-777777777777', null, 'Blockchain engineer, deep-tech obsession', 'Built L2 infra at Polygon. Want to co-found in on-chain identity or DePIN for India.', 'Hyderabad', 'technical', 6, 'full_time', false, null, null, null, '50%', 'ipo', ARRAY['Blockchain','Python','Node.js','Machine Learning'], ARRAY['Deep Tech','Fintech'], 'active', 'https://linkedin.com/in/siddharthrao', true, true, 'Maker', true, 'Siddharth Rao', 'https://api.dicebear.com/7.x/initials/svg?seed=Siddharth%20Rao&backgroundColor=334155');

insert into public.founder_prompts (founder_id, prompt_question, prompt_answer, display_order) values
('11111111-1111-1111-1111-111111111111','The thing I''d bring to a founding team that doesn''t show on a resume...','I''ll rewrite the whole codebase at 2am if the architecture is wrong. I have done it. Twice.',0),
('11111111-1111-1111-1111-111111111111','I know I''m not great at...','Cold sales calls. I can build the product but I freeze on a Zoom with a CFO.',1),
('11111111-1111-1111-1111-111111111111','My biggest startup failure taught me...','You can''t out-engineer a distribution problem.',2),
('11111111-1111-1111-1111-111111111111','A hill I''ll die on as a founder...','Founder salaries stay equal until we raise a real round.',3),
('22222222-2222-2222-2222-222222222222','The startup I wish existed in India...','A modern Chargebee for Indian SMBs — GST-native, WhatsApp-first, priced in rupees.',0),
('22222222-2222-2222-2222-222222222222','I work best with someone who...','Ships imperfect things fast and doesn''t take feedback personally.',1),
('22222222-2222-2222-2222-222222222222','My honest superpower is...','I close 6-figure deals with people who''ve never heard of us. Sales is a system.',2),
('22222222-2222-2222-2222-222222222222','My co-founder deal-breakers are...','Anyone who thinks sales is beneath them.',3),
('33333333-3333-3333-3333-333333333333','The problem I''m obsessed with solving...','A Tier-2 city radiologist sees 200 scans a day. Misses are the #1 malpractice risk in India.',0),
('33333333-3333-3333-3333-333333333333','I know I''m not great at...','Pricing. I''ve given away too much to early customers because I wanted the validation.',1),
('33333333-3333-3333-3333-333333333333','What I''m really looking for in a co-founding relationship...','Someone who has closed a 12-month hospital contract.',2),
('33333333-3333-3333-3333-333333333333','In 5 years, I want my startup to...','Be embedded in every mid-tier Indian hospital. Not the biggest — the most trusted.',3),
('44444444-4444-4444-4444-444444444444','The thing I''d bring to a founding team that doesn''t show on a resume...','I''ll fight for the extra week of polish. Craft compounds.',0),
('44444444-4444-4444-4444-444444444444','My co-founder deal-breakers are...','Someone who calls design "making it pretty".',1),
('44444444-4444-4444-4444-444444444444','I work best with someone who...','Explains their code in plain English and doesn''t make me feel stupid for asking.',2),
('44444444-4444-4444-4444-444444444444','The startup I wish existed in India...','Duolingo but for Indian classical music.',3),
('55555555-5555-5555-5555-555555555555','My biggest startup failure taught me...','Fundraising isn''t validation. Revenue is validation.',0),
('55555555-5555-5555-5555-555555555555','What I''m really looking for in a co-founding relationship...','A technical co-founder who has been burned before.',1),
('55555555-5555-5555-5555-555555555555','A hill I''ll die on as a founder...','No side projects. Not for the first 3 years.',2),
('55555555-5555-5555-5555-555555555555','In 5 years, I want my startup to...','Do ₹100Cr ARR profitably. Not raise a Series C. Profitably.',3),
('66666666-6666-6666-6666-666666666666','The problem I''m obsessed with solving...','Indian women get PCOS diagnosed at 27 avg. Should be 17. Data + telehealth fixes this.',0),
('66666666-6666-6666-6666-666666666666','My honest superpower is...','I can look at a category with 20 players and tell you why the next one wins.',1),
('66666666-6666-6666-6666-666666666666','My co-founder deal-breakers are...','Anyone who has never used a period tracker.',2),
('66666666-6666-6666-6666-666666666666','I work best with someone who...','Debates me hard in private and shows unified front in public.',3),
('77777777-7777-7777-7777-777777777777','The last thing I built from scratch...','A ZK rollup prototype in Rust. 8000 tx/sec on a laptop. Pointless. I loved it.',0),
('77777777-7777-7777-7777-777777777777','I know I''m not great at...','Selling to non-technical audiences. I use "cryptographic" in customer calls.',1),
('77777777-7777-7777-7777-777777777777','What I''m really looking for in a co-founding relationship...','A business co-founder who can translate what I build into what a CEO in Gurgaon buys.',2),
('77777777-7777-7777-7777-777777777777','A hill I''ll die on as a founder...','We open-source the core. Always.',3);

insert into public.assessments (founder_id, openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, risk_score, decision_velocity_score, equity_philosophy_score, vision_score, raw_answers) values
('11111111-1111-1111-1111-111111111111', 78,82,55,68,40,72,80,85,90, '{}'::jsonb),
('22222222-2222-2222-2222-222222222222', 72,88,82,70,32,68,85,90,92, '{}'::jsonb),
('33333333-3333-3333-3333-333333333333', 85,78,45,75,48,75,65,80,88, '{}'::jsonb),
('44444444-4444-4444-4444-444444444444', 90,85,65,82,42,60,70,82,85, '{}'::jsonb),
('55555555-5555-5555-5555-555555555555', 68,90,78,55,35,82,90,88,95, '{}'::jsonb),
('66666666-6666-6666-6666-666666666666', 82,80,72,78,38,70,75,78,85, '{}'::jsonb),
('77777777-7777-7777-7777-777777777777', 92,75,42,65,45,78,60,82,88, '{}'::jsonb);

insert into public.conversations (id, founder_a_id, founder_b_id, stage) values
('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','intro_call'),
('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','talking');

insert into public.compatibility_reports (conversation_id, compatibility_score, alignment_points, divergence_points, risk_flags, conversation_starters, rationale_summary) values
('aaaaaaaa-0000-0000-0000-000000000001', 87,
  '["Both target Indian B2B SaaS with GST-native reality","Complementary: Arjun ships product, Neha closes enterprise","Shared IPO ambition and full-time commitment","Both put customer over founder ego"]'::jsonb,
  '["Equity: Arjun leans 40 for himself, Neha defaults to 50/50","Decision velocity: Neha moves faster on GTM than Arjun on architecture"]'::jsonb,
  '["Neha''s ex-Chargebee playbook may not port cleanly to Indian SMBs — validate ICP in first 30 days"]'::jsonb,
  '["Talk about your first 10 customers — who, at what price?","Do a 2-hour whiteboard on the product spec — see how you argue","Discuss equity BEFORE you start building."]'::jsonb,
  'Strong complementary pair: technical depth + enterprise sales, both with fintech context. Watch-item: align on early ICP and settle equity before code ships.'),
('aaaaaaaa-0000-0000-0000-000000000002', 68,
  '["Both technical, both obsessed with the problem","Both work best with autonomy and clear domain ownership","Shared preference for structured decision frameworks"]'::jsonb,
  '["Two technical founders — nobody owns distribution","Different industries: fintech B2B vs healthtech B2B","Rohan in Delhi, Arjun in Mumbai — remote-first is table stakes"]'::jsonb,
  '["Neither has closed enterprise sales — will struggle without a GTM hire fast"]'::jsonb,
  '["Who owns sales in month 1? Answer this or don''t move forward.","Do you actually want to work together, or do you both want a technical co-founder?","Would either join the other''s idea, or are you searching for a shared new one?"]'::jsonb,
  'Two capable technical founders with strong values alignment but a structural gap: nobody owns distribution.');

insert into public.messages (conversation_id, sender_id, seed_sender_founder_id, content, created_at) values
('aaaaaaaa-0000-0000-0000-000000000001', null, '22222222-2222-2222-2222-222222222222', 'Hey Arjun — loved your prompt on rewriting the codebase at 2am. Reminded me of my first engineering hire.', now() - interval '3 days'),
('aaaaaaaa-0000-0000-0000-000000000001', null, '22222222-2222-2222-2222-222222222222', 'Free for a call this week? Curious what your GTM plan looks like right now.', now() - interval '3 days' + interval '2 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', null, '11111111-1111-1111-1111-111111111111', 'Neha — thanks for reaching out. Honestly the GTM plan is "hope Arjun figures it out", which is why I''m here.', now() - interval '2 days'),
('aaaaaaaa-0000-0000-0000-000000000001', null, '11111111-1111-1111-1111-111111111111', 'Thursday 4pm work? I''ll send an invite.', now() - interval '2 days' + interval '1 minute'),
('aaaaaaaa-0000-0000-0000-000000000001', null, '22222222-2222-2222-2222-222222222222', 'Locked in.', now() - interval '1 day'),
('aaaaaaaa-0000-0000-0000-000000000002', null, '11111111-1111-1111-1111-111111111111', 'Radiology triage is a hard problem. What''s your unfair advantage on distribution?', now() - interval '1 day'),
('aaaaaaaa-0000-0000-0000-000000000002', null, '33333333-3333-3333-3333-333333333333', 'Honestly? I don''t have one yet. That''s why I''m looking. My tech is solid but I need someone who can walk into a hospital.', now() - interval '20 hours'),
('aaaaaaaa-0000-0000-0000-000000000002', null, '11111111-1111-1111-1111-111111111111', 'Appreciate the honesty. Let''s talk more — I''m in fintech but I know a few healthtech operators worth intro''ing you to regardless.', now() - interval '18 hours');

insert into public.connection_requests (from_founder_id, to_founder_id, prompt_question, message, status) values
('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111','I know I''m not great at...','Arjun — your honesty about sales calls is refreshing. I''m the opposite (love sales, can''t code) and I''m looking for a technical co-founder for the women''s health idea. Worth a chat?', 'pending');

insert into public.forum_posts (id, author_id, title, content, category, industry_tag, upvotes, created_at) values
('f0000000-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','After 2 acquihires, here''s what I''d do differently on my third','TLDR: raise less, hire slower, sell earlier.

1) Raise less. I raised $2.4M pre-revenue in my first company. Bought me 18 months of runway and 0 months of urgency.

2) Hire slower. Every hire before PMF is a distraction.

3) Sell earlier. Even a shitty MVP with 3 paying customers > a beautiful demo with 30 signups.

Happy to answer questions.','success_stories','SaaS',47, now() - interval '2 days'),
('f0000000-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','Would you use an AI second opinion tool before your next scan?','Building AI-assisted triage for Tier-2 Indian hospitals. 94% chest X-ray accuracy, 89% MRI brain.

Would patients trust this? Radiologists?

Poke holes.','idea_validation','Healthtech',32, now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000003','44444444-4444-4444-4444-444444444444','Looking for a technical co-founder — edtech for Indian classical music','Ex-Unacademy product designer. Will lead product & GTM.

Looking for: someone who has shipped a consumer product. Bonus if you play an instrument.','looking_for_cofounder','Edtech',28, now() - interval '5 hours'),
('f0000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','How to price for Indian SMBs without racing to the bottom','Notes after moving from US SMB sales to India:
- ₹999/mo is the psychological ceiling for 2-person businesses
- WhatsApp support is required, not nice-to-have
- Free trial > freemium in India
- Annual pricing works if you throw in ~2 months free','industry_talk','SaaS',54, now() - interval '4 days'),
('f0000000-0000-0000-0000-000000000005','77777777-7777-7777-7777-777777777777','Best learning resources for founders new to crypto?','- The Bitcoin Standard (Ammous)
- Programming Bitcoin (Song)
- a16z crypto canon (free online)
- Bankless podcast

Add yours below.','resources','Deep Tech',19, now() - interval '3 days');

insert into public.forum_comments (post_id, author_id, content, upvotes, created_at) values
('f0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','#3 is the one nobody talks about. First real customer > everything else.', 12, now() - interval '1 day'),
('f0000000-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','Curious how you decided when to stop raising vs push through.', 4, now() - interval '20 hours'),
('f0000000-0000-0000-0000-000000000002','66666666-6666-6666-6666-666666666666','Rural patients trust their family doctor over any app. Distribution has to go through the doctor, not around them.', 8, now() - interval '18 hours'),
('f0000000-0000-0000-0000-000000000002','77777777-7777-7777-7777-777777777777','89% on MRI brain is impressive but liability model? Who signs off when the AI is wrong?', 6, now() - interval '14 hours'),
('f0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Interesting — I''m in fintech but always wanted a good raag learning app. Monetization thesis?', 3, now() - interval '2 hours'),
('f0000000-0000-0000-0000-000000000004','55555555-5555-5555-5555-555555555555','Annual with 2 months free is exactly what I do. Also: never negotiate. If someone asks for discount, add value.', 15, now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000004','66666666-6666-6666-6666-666666666666','WhatsApp support point is underrated. Churn dropped 30% after we added it.', 9, now() - interval '2 days'),
('f0000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333','Adding: "Mastering Ethereum" by Antonopoulos for anyone building.', 5, now() - interval '2 days');

insert into public.investor_feed_listings (conversation_id, idea_oneliner, traction_metrics, raise_amount, raise_purpose, listing_type, expires_at) values
('aaaaaaaa-0000-0000-0000-000000000001','GST-native reconciliation SaaS for Indian mid-market','12 paid pilots, ₹8L MRR, 90% gross margins','₹4 Cr','Hire 4 engineers + 2 SDRs, 18-month runway to Series A','featured', now() + interval '20 days'),
(null,'AI diagnostic triage for Tier-2 Indian hospitals — 94% accuracy chest X-ray','3 hospital pilots signed, 8000 scans processed','₹2.5 Cr','Clinical validation + first 3 sales hires','standard', now() + interval '30 days');
