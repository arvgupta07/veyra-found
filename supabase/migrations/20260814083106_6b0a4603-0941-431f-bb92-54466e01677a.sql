ALTER TABLE public.investor_profiles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.talent_profiles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.open_roles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.talent_profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.open_roles ALTER COLUMN posted_by DROP NOT NULL;

-- Demo founders (persona rows, no owner account)
INSERT INTO public.founders (seed_name, seed_avatar, headline, bio, location, background, years_experience, education, commitment, has_idea, idea_description, idea_industry, idea_stage, equity_offer, exit_vision, skills, industry_focus, active_status, remote_pref, looking_for, age, profile_complete, verified, account_type, trust_tier)
VALUES
  ('Demo · Ananya Rao', '🚀', 'Building a B2B logistics SaaS in Bengaluru', 'Demo profile. Ex-Flipkart PM, second-time founder. Looking for a technical co-founder who has shipped marketplaces.', 'Bengaluru, Karnataka', 'business', 6, 'BITS Pilani', 'full_time', true, 'Freight matching for mid-market shippers with automated invoicing.', 'Logistics', 'mvp', '25-40%', 'acquisition', ARRAY['Product Management','Sales','Fundraising'], ARRAY['Logistics','SaaS'], 'active', 'hybrid', ARRAY['Technical co-founder'], 28, true, true, 'founder', 'Maker'),
  ('Demo · Kabir Menon', '🛠️', 'Full-stack engineer looking for a business co-founder', 'Demo profile. 8 years across fintech backends. I can build the product end to end, I want someone who loves selling.', 'Pune, Maharashtra', 'technical', 8, 'COEP Pune', 'full_time', false, NULL, NULL, 'idea', 'Equal split', 'ipo', ARRAY['Backend','React','Infrastructure'], ARRAY['Fintech','SaaS'], 'active', 'remote', ARRAY['Business co-founder','Growth co-founder'], 31, true, true, 'founder', 'Builder'),
  ('Demo · Meera Iyer', '🎨', 'Design-led consumer app for Indian home cooks', 'Demo profile. Design lead turned founder. Prototype live with 400 weekly users, now hiring and raising a pre-seed.', 'Mumbai, Maharashtra', 'design', 5, 'NID Ahmedabad', 'part_time', true, 'Short-form recipe app with creator monetisation.', 'Consumer', 'revenue', '10-20%', 'lifestyle', ARRAY['Product Design','Branding','Growth'], ARRAY['Consumer','Media'], 'open', 'onsite', ARRAY['Technical co-founder'], 26, true, true, 'founder', 'Maker');

-- Demo investors
INSERT INTO public.investor_profiles (fund_name, firm_type, headline, bio, thesis, location, check_size_min, check_size_max, industries, stages, companies_invested, notable_investments, website_url, is_public, verified, is_demo)
VALUES
  ('Demo · Rangeet Capital', 'vc_fund', 'Pre-seed cheques for Indian SaaS', 'Demo investor. We lead the first institutional round for B2B software founders out of India.', 'India-first B2B SaaS with global pricing power.', 'Bengaluru, Karnataka', 2500000, 25000000, ARRAY['SaaS','Fintech','Logistics'], ARRAY['idea','mvp'], 14, 'Zeta, Freightify, Hyperbase', 'https://example.com', true, true, true),
  ('Demo · Arya Angels', 'syndicate', 'Operator angels writing 10-25L cheques', 'Demo investor. A syndicate of 40 operators from Swiggy, Razorpay and CRED.', 'Consumer and commerce founders with sharp distribution instincts.', 'Mumbai, Maharashtra', 1000000, 5000000, ARRAY['Consumer','D2C','Commerce'], ARRAY['idea','mvp','revenue'], 32, 'Slurrp Farm, Bolt, Nova', 'https://example.com', true, true, true),
  ('Demo · Kaveri Growth Fund', 'vc_fund', 'Seed to Series A for deep-tech', 'Demo investor. Backing hard-tech and climate teams with long build cycles.', 'Deep-tech and climate infrastructure built in India for the world.', 'Chennai, Tamil Nadu', 20000000, 150000000, ARRAY['Deep tech','Climate','Hardware'], ARRAY['mvp','revenue','funded'], 9, 'Ather adjacent portfolio', 'https://example.com', true, false, true);

-- Demo talent / interns
INSERT INTO public.talent_profiles (full_name, headline, bio, skills, desired_role, work_type, experience_years, location, remote_pref, education, availability, open_to_equity, is_public, portfolio_url, is_demo)
VALUES
  ('Demo · Rohan Shetty', 'Frontend engineer, 3 years of React', 'Demo talent profile. Shipped two consumer apps end to end, comfortable owning the whole web surface.', ARRAY['React','TypeScript','Tailwind'], 'Frontend Engineer', 'full_time', 3, 'Bengaluru, Karnataka', 'remote', 'RV College of Engineering', 'Immediately', true, true, 'https://example.com', true),
  ('Demo · Ishita Bansal', 'CS undergrad looking for a 6-month internship', 'Demo intern profile. Third-year student, built an internal tool used by 200 people on campus.', ARRAY['Python','Data Analysis','SQL'], 'Data Intern', 'internship', 0, 'Delhi, Delhi', 'hybrid', 'DTU Delhi', 'From next month', true, true, NULL, true),
  ('Demo · Aditya Nair', 'Growth marketer for early startups', 'Demo talent profile. Ran paid and content for two seed-stage D2C brands from zero to first crore.', ARRAY['Growth','Performance Marketing','Content'], 'Growth Lead', 'full_time', 5, 'Mumbai, Maharashtra', 'onsite', 'NMIMS Mumbai', 'Two weeks notice', true, true, NULL, true),
  ('Demo · Sneha Kulkarni', 'Product design intern, loves messy zero-to-one', 'Demo intern profile. Design student with three case studies on Indian fintech onboarding.', ARRAY['UI Design','Figma','User Research'], 'Design Intern', 'internship', 1, 'Pune, Maharashtra', 'remote', 'MIT Institute of Design', 'Immediately', false, true, 'https://example.com', true);

-- Demo open roles
INSERT INTO public.open_roles (company_name, title, description, role_type, skills, location, remote_pref, comp_min, comp_max, equity_note, status, is_demo)
VALUES
  ('Demo · Freightly', 'Founding Full-stack Engineer', 'Demo listing. Own the shipper dashboard and pricing engine. You will be employee #2 and set the engineering bar.', 'full_time', ARRAY['React','Node','Postgres'], 'Bengaluru, Karnataka', 'hybrid', 1800000, 2800000, '0.5-1.5% ESOP', 'open', true),
  ('Demo · Slate Studio', 'Product Design Intern', 'Demo listing. Six-month paid internship working directly with the founder on a consumer app used by home cooks.', 'internship', ARRAY['Figma','UI Design'], 'Mumbai, Maharashtra', 'remote', 25000, 40000, 'Stipend only', 'open', true),
  ('Demo · Kite Fintech', 'Growth Lead (0 to 1)', 'Demo listing. Build our first acquisition engine across paid, referral and creator channels.', 'full_time', ARRAY['Growth','Performance Marketing'], 'Delhi, Delhi', 'onsite', 1500000, 2400000, '0.25-0.75% ESOP', 'open', true),
  ('Demo · Corely', 'Backend Intern', 'Demo listing. Work on ingestion pipelines and internal APIs with a two-person engineering team.', 'internship', ARRAY['Python','SQL'], 'Remote, India', 'remote', 20000, 35000, 'Stipend + PPO', 'open', true);