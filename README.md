# CoFound India

Build me a full-stack web app called CoFound AI — India's co-founder matching platform. This is a Hinge-style (NOT Tinder) professional matching platform where Indian founders find co-founders. Use React + Supabase + Tailwind CSS + shadcn/ui. Below is the complete specification. Build everything exactly as described.

---

## OVERVIEW

CoFound AI has two core spaces:
1. A co-founder matching platform — Hinge-style browsing, connection requests, inbox with DM organisation
2. A community forum — where founders post ideas, get feedback, and discuss

There is no swiping. Founders scroll through rich profiles and tap "Text them about this" on a specific prompt they liked, optionally writing a short message. The other person sees a connection request. If they accept, chat unlocks. Conversations can be labelled and organised.

---

## TECH STACK

- React + Vite
- Tailwind CSS + shadcn/ui (use shadcn components throughout)
- Supabase (auth + postgres + realtime + storage)
- React Router v6
- Zustand for global auth state
- Recharts for charts
- Lucide React for icons
- OpenAI API (gpt-4o) for AI compatibility reports and conversation starters
- Razorpay for payments
- react-hot-toast for notifications
- Vercel-compatible build

---

## DESIGN SYSTEM

Professional, clean, trust-inspiring. Like Linear or Notion meets a startup community.

```
--navy:        #0F172A  (primary sidebar, hero backgrounds)
--navy-light:  #1E293B  (card backgrounds on dark)
--navy-mid:    #334155  (dividers on dark)
--indigo:      #6366F1  (primary accent, CTAs, active states)
--indigo-dark: #4F46E5  (hover)
--indigo-light:#818CF8  (on dark backgrounds)
--emerald:     #10B981  (success, verified, confirmed)
--amber:       #F59E0B  (pending, warning states)
--red:         #EF4444  (danger, decline)
--white:       #FFFFFF
--surface:     #F8FAFC  (main app background)
--surface-2:   #F1F5F9  (secondary backgrounds)
--border:      #E2E8F0
--text:        #0F172A
--muted:       #64748B
--light:       #94A3B8
```

Font: Inter from Google Fonts. 700-900 for headings, 400-500 for body. Letter spacing -0.02em on headings.
Border radius: xl on cards, lg on inputs and buttons.
Shadows: sm on cards, md on modals.
All async actions need loading states. All empty states need an icon + message + CTA.

---

## DATABASE SCHEMA

```sql
-- Extends Supabase auth
create table profiles (
  id uuid primary key references auth.users(id),
  role text check (role in ('founder', 'investor')),
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table founders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) unique,
  headline text,
  bio text,
  location text,
  background text check (background in ('technical','business','design','other')),
  years_experience integer,
  education text,
  commitment text check (commitment in ('full_time','part_time','exploring')),
  has_idea boolean default false,
  idea_description text,
  idea_industry text,
  idea_stage text check (idea_stage in ('idea','mvp','revenue','funded')),
  equity_offer text,
  exit_vision text check (exit_vision in ('lifestyle','acquisition','ipo')),
  skills text[],
  industry_focus text[],
  active_status text default 'active' check (active_status in ('active','open','paused')),
  linkedin_url text,
  github_url text,
  linkedin_verified boolean default false,
  github_verified boolean default false,
  aadhaar_verified boolean default false,
  video_intro_url text,
  vouches_count integer default 0,
  trust_tier text default 'Builder' check (trust_tier in ('Builder','Maker','Veteran')),
  profile_complete boolean default false,
  created_at timestamptz default now()
);

create table founder_prompts (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references founders(id) on delete cascade,
  prompt_question text not null,
  prompt_answer text not null,
  display_order integer default 0
);

create table past_ventures (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references founders(id) on delete cascade,
  company_name text,
  outcome text check (outcome in ('running','exited','shut_down')),
  description text,
  linkedin_verified boolean default false
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references founders(id) unique,
  openness_score integer,
  conscientiousness_score integer,
  extraversion_score integer,
  agreeableness_score integer,
  neuroticism_score integer,
  risk_score integer,
  decision_velocity_score integer,
  equity_philosophy_score integer,
  vision_score integer,
  raw_answers jsonb,
  completed_at timestamptz default now()
);

create table connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_founder_id uuid references founders(id),
  to_founder_id uuid references founders(id),
  prompt_question text,
  message text,
  status text default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique(from_founder_id, to_founder_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  founder_a_id uuid references founders(id),
  founder_b_id uuid references founders(id),
  request_id uuid references connection_requests(id),
  stage text default 'talking' check (stage in ('talking','intro_call','trial_project','confirmed')),
  created_at timestamptz default now(),
  unique(founder_a_id, founder_b_id)
);

create table conversation_labels (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  founder_id uuid references founders(id),
  label text,
  color text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table compatibility_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) unique,
  compatibility_score integer,
  alignment_points jsonb,
  divergence_points jsonb,
  risk_flags jsonb,
  conversation_starters jsonb,
  rationale_summary text,
  generated_at timestamptz default now()
);

create table forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references founders(id),
  title text not null,
  content text not null,
  category text check (category in ('idea_validation','looking_for_cofounder','industry_talk','resources','success_stories')),
  industry_tag text,
  upvotes integer default 0,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table forum_upvotes (
  founder_id uuid references founders(id),
  post_id uuid references forum_posts(id),
  primary key (founder_id, post_id)
);

create table forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references forum_posts(id) on delete cascade,
  author_id uuid references founders(id),
  content text not null,
  parent_comment_id uuid references forum_comments(id),
  upvotes integer default 0,
  created_at timestamptz default now()
);

create table forum_saves (
  founder_id uuid references founders(id),
  post_id uuid references forum_posts(id),
  primary key (founder_id, post_id)
);

create table vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid references founders(id),
  vouchee_id uuid references founders(id),
  skill_tag text,
  context text,
  accepted boolean default false,
  created_at timestamptz default now(),
  unique(voucher_id, vouchee_id, skill_tag)
);

create table investor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) unique,
  fund_name text,
  thesis text,
  check_size_min integer,
  check_size_max integer,
  industries text[],
  verified boolean default false,
  created_at timestamptz default now()
);

create table investor_feed_listings (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  pitch_video_url text,
  idea_oneliner text,
  traction_metrics text,
  raise_amount text,
  raise_purpose text,
  listing_type text default 'standard' check (listing_type in ('standard','featured')),
  active boolean default true,
  expires_at timestamptz,
  views integer default 0,
  created_at timestamptz default now()
);

create table investor_interests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references investor_profiles(id),
  listing_id uuid references investor_feed_listings(id),
  saved boolean default false,
  interested boolean default false,
  created_at timestamptz default now(),
  unique(investor_id, listing_id)
);
```

Enable RLS on all tables. Founders read their own data and public founder profiles. They can only see conversations they are part of. Investors see investor_feed_listings and investor_profiles.

---

## ROUTES

```
/                         Landing page
/auth/login               Login
/auth/signup              Signup (choose role: Founder or Investor)
/onboarding               Multi-step founder setup + assessment (4 steps)

/discover                 Browse founder profiles (Hinge-style)
/profile/:founderId       View a founder's full profile
/inbox                    Inbox: Requests tab + Talking tab
/inbox/:conversationId    Open conversation with chat + compatibility + stages
/forum                    Community forum
/forum/:postId            Single forum post
/forum/new                Create forum post
/profile/me               Own profile edit
/investor-feed            Investor discovery feed
/dashboard                Investor dashboard (investor role only)
```

Protected routes: redirect to /auth/login if not authenticated.
Role redirect: investors cannot access /discover, /inbox, /forum. Founders cannot access /dashboard.

---

## SCREENS

---

### LANDING PAGE `/`

Dark navy background. Two sections: hero + features.

Hero:
- Top nav: Logo left, nav links center (For Founders / For Investors / Forum), Login + Get Started buttons right
- Large headline: "The right co-founder changes everything." — white, 56px, 900 weight, tight tracking
- Sub: "India's first platform built specifically for co-founder search. Verified profiles, compatibility science, and a structured process from first message to confirmed co-founder."
- Two CTAs: "Find my co-founder" (indigo filled) + "For investors" (outline)
- Right side: floating profile card mockup showing a sample founder card with skills, trust tier badge, and a prompt

Stats bar: 12,400+ Founders · 3,800+ Connections · 940+ Co-founder Pairs · ₹48Cr+ Raised

Feature cards (3): "Trust-first profiles" / "Compatibility quiz" / "Structured stages"

How it works (4 numbered steps): Build profile → Take quiz → Browse and connect → Confirm your co-founder

CTA section: "Ready to find your co-founder? Free to join."

Footer: Logo, links, copyright

---

### AUTH `/auth/signup` and `/auth/login`

Centered card on surface background.

Signup: name, email, password, role choice (two big cards: "I'm a Founder" / "I'm an Investor"). Submit → Supabase auth → redirect by role.

Login: email, password, forgot password link. Redirect by role on success.

---

### ONBOARDING `/onboarding`

Progress bar. 4 steps. Cannot skip. Save each step before proceeding.

**Step 1 — Basic Profile**
- Full name (pre-filled), headline (placeholder: "Full-stack engineer obsessed with fintech"), bio (280 chars with counter), location, LinkedIn URL, GitHub URL, years of experience dropdown, currently employed toggle, background card selection (Technical / Business / Design / Other)

**Step 2 — Your Work & Idea**
- Skills: multi-select tag input — preloaded: React, Python, Node.js, iOS, Android, Machine Learning, Product Management, Growth Marketing, Sales, Finance, Operations, UI/UX Design, Data Science, Blockchain, Hardware. Allow custom input.
- Industry focus: multi-select — Fintech, Healthtech, Edtech, SaaS, E-commerce, Deep Tech, Climate, Consumer, B2B, Other
- Commitment: 3 cards — Full-time / Part-time / Exploring
- Stage: 4 cards — Just an idea / Building MVP / Have revenue / Already funded
- Have an idea toggle. If yes: industry dropdown, stage dropdown, one-line description textarea
- Equity offer: percentage slider (10% to 60%)
- Exit vision: 3 cards — Lifestyle / Get acquired / Go public

**Step 3 — Prompts**
Choose 4 prompts from this list and write an answer (150 char max each):
- "The thing I'd bring to a founding team that doesn't show on a resume..."
- "My biggest startup failure taught me..."
- "I work best with someone who..."
- "The problem I'm obsessed with solving..."
- "My co-founder deal-breakers are..."
- "The last thing I built from scratch..."
- "I know I'm not great at..."
- "What I'm really looking for in a co-founding relationship..."
- "The startup I wish existed in India..."
- "My honest superpower is..."
- "A hill I'll die on as a founder..."
- "In 5 years, I want my startup to..."

UI: each prompt is a card. Click a prompt → it expands into an answer text field. Must select exactly 4.

**Step 4 — Compatibility Assessment**
One question at a time. Smooth slide transition between questions. Progress: "Question X of 20".

Show these 20 questions (4 options each, A/B/C/D):

Q1. When your team disagrees on a major decision: A) Debate until consensus B) Person with most context decides fast C) Follow pre-agreed framework D) Bring in a third opinion

Q2. Your ideal work week looks like: A) 60+ hours, fully in it B) Structured 9 to 6 C) Flexible around output D) Intense sprints then rest

Q3. When a co-founder doesn't reply for 12 hours: A) Totally fine — async works B) Send one follow-up C) Get frustrated — comms matter D) Depends on the context

Q4. You work best when: A) Full autonomy over my domain B) Constant co-founder sync C) Clear lanes, daily check-ins D) When the work demands it

Q5. ₹5Cr acquisition offer at MVP stage: A) Take it immediately B) Seriously consider it C) Decline — too early D) Depends on the team's vision

Q6. Your backup plan if the startup fails: A) Already have one — realistic B) Will figure it out C) No backup — this has to work D) My next startup idea

Q7. Growth pace you want: A) Steady and sustainable B) Fast but calculated C) Hypergrowth only D) Whatever the market pulls

Q8. Financially while building: A) Need market rate salary B) Minimum for 12 months C) Will live on nothing D) Depends on runway

Q9. Fairest co-founder equity split: A) 50/50 always B) Based on contribution C) Based on idea + domain D) Negotiated per milestone

Q10. Co-founder joined 6 months after you: A) They take lower equity B) Negotiate on current value C) 50/50 regardless D) Vesting schedule decides

Q11. Salary before revenue: A) Equal minimum for both B) Market rate regardless C) No salary till milestone D) Performance-linked

Q12. Disagreement on a hire's salary: A) Domain owner decides B) Pre-agreed comp framework C) Debate it equally D) Benchmark to market

Q13. Problem with co-founder: A) Address immediately B) Process then talk C) Raise at next check-in D) Let it resolve naturally

Q14. Most irritating co-founder behaviour: A) Going silent under pressure B) Micromanaging my work C) Missing commitments D) Changing direction constantly

Q15. When a big decision goes wrong: A) Debrief immediately B) Take a day, then debrief C) Move on — no postmortems D) Document it for next time

Q16. Healthiest way to resolve disagreements: A) Pre-agreed frameworks B) Trusted advisor tiebreaker C) Executor makes final call D) Vote and commit

Q17. Current commitment: A) Already full-time B) Full-time in 3 months C) Part-time until milestone D) Depends on the co-founder

Q18. Location: A) Remote-first forever B) Open to co-locating C) Must be same city D) Flexible by phase

Q19. In 10 years with your co-founder: A) Equal partners in a large company B) Happy with whatever exit C) Still together only if growing D) Hopefully onto separate ventures with a great story

Q20. Non-negotiable from a co-founder: A) Radical transparency B) Complementary skills C) Shared obsession with the problem D) Track record of execution

After Q20: "Generating your compatibility profile..." — 3-second loading animation with indigo spinner and text. Then redirect to /discover.

Store all answers as JSONB. Calculate dimension scores (openness, conscientiousness, extraversion, agreeableness, neuroticism, risk, decision_velocity, equity_philosophy, vision) from answer patterns. Store in assessments table.

---

### DISCOVER `/discover`

Hinge-style. NOT Tinder. No swipe cards. Founders browse through full profiles one at a time.

Left panel: filters
- Background, Industry, Commitment, Location, Stage, Has idea / needs idea, Trust tier minimum, Active status

Main area: full founder profile displayed vertically — scroll through it. Profile sections in this order:
1. Video intro placeholder (indigo gradient background with play button icon — note video is not actually hosted in prototype)
2. Name, headline, location, active status dot
3. Trust tier badge + verified badges (LinkedIn ✓, GitHub ✓)
4. Skills tags
5. First prompt card — shows question in small muted text, answer in normal text — with a "Text them about this" button on the right
6. Background + commitment + stage mini cards
7. Second prompt card with "Text them about this" button
8. Industry focus tags
9. If has idea: idea card showing industry, stage, one-liner
10. Third prompt card with "Text them about this" button
11. Past ventures (if any)
12. Fourth prompt card with "Text them about this" button
13. Compatibility score ring + short summary (requires both to have completed assessment)

At the very bottom of the profile: a "Pass" button and a "Text them" button (general, not prompt-specific)

Navigation: Previous / Next founder arrows at top. Show "X of Y founders today" counter.

"Text them about this" flow:
- Small modal opens
- Shows the prompt they clicked on
- Text input: "Add a message (optional)" — max 120 characters
- Two buttons: "Send request" and "Cancel"
- On send: insert into connection_requests table, show toast "Request sent!", button changes to "Requested" on that prompt — disabled
- They cannot send another request to the same person (check before showing button)

If request already sent: show "Requested ✓" on all prompts for that founder — not clickable.
If already connected (conversation exists): show "In conversation" badge — clicking goes to /inbox/:conversationId.

---

### INBOX `/inbox`

Three tabs: Requests | Talking | Saved

**Requests tab:**
List of incoming pending connection_requests sorted by compatibility_score descending (not by time).
Each row: sender avatar + name + trust tier + headline + which prompt they responded to + their message preview + time sent + "View profile" link + Accept button (emerald) + Decline button (red outline)
Accepting: update request status to 'accepted', create a conversation record, trigger AI compatibility report generation, redirect to the new conversation

**Talking tab:**
List of active conversations. Each row: the other founder's avatar + name + trust tier badge + stage badge (Talking / Intro Call / Trial Project / Confirmed) + last message preview + time + unread count badge
Label chips under the conversation name (if any labels applied)
Pinned conversations shown at top with pin icon
Clicking opens /inbox/:conversationId

**Empty states:** "No requests yet — keep your profile complete and active." / "No conversations yet — go discover founders."

---

### CONVERSATION `/inbox/:conversationId`

Split layout: left panel (conversation meta) + right panel (chat)

**Left panel:**
- Both founder avatars side by side with a thin connecting line
- Both names + headlines
- Stage progression: Talking → Intro Call → Trial Project → Confirmed (shown as 4 dots with current highlighted)
- "Update stage" button — dropdown to log intro call, start trial project, confirm co-founder
- Labels section: show current labels + "Add label" button → dropdown of label options:
  ⭐ Important / 🔄 Trial Project / ✅ Confirmed / 📋 Follow Up / 📁 Maybe / 🚫 Not a Fit + "Create custom label"
- Compatibility score ring (large)
- Tabs below: Overview | Conversation Starters

Overview tab content:
- "Where you align" — green checkmark list from alignment_points JSONB
- "Worth discussing" — amber warning list from divergence_points JSONB
- "Watch out for" — red alert list from risk_flags JSONB
- AI summary paragraph (rationale_summary)
- Small disclaimer: "This is a conversation starter, not a verdict. Based on your quiz responses."

Conversation Starters tab:
- 3-4 cards with AI-generated prompts specific to this pair
- Each has a "Copy" button
- One static card: "Consider a 2-week trial project before fully committing."

If compatibility report hasn't been generated yet: show "Generating your compatibility report..." skeleton loader

**Right panel — Chat:**
- Header: other founder's name + avatar + online status
- Message area: scrollable, WhatsApp-style bubbles (sender right indigo, receiver left surface)
- Read receipts (double tick)
- Timestamps on messages
- Realtime via Supabase Realtime subscriptions
- Input: text field + send button + (Pro) voice note icon + (Pro) attachment icon
- Unmatch + Report option in header dropdown

On conversation confirm (stage = confirmed): show celebratory banner "You've confirmed a co-founder! 🎉 Ready to get in front of investors?" with CTA to investor feed listing

---

### FORUM `/forum`

Two-column layout: posts feed left, sidebar right.

**Sidebar:**
- Category filter: All / 💡 Idea Validation / 🤝 Looking for Co-founder / 🌏 Industry Talk / 📚 Resources / 🎉 Success Stories
- Industry filter: multi-select
- Trending tags this week
- "New post" button

**Post feed:**
- Sorted by: Trending (upvotes + comments, 24h window) or New (chronological)
- Each post card: author avatar + name + trust tier + time posted + category badge + industry tag + post title + content preview (3 lines) + upvote count + comment count + save icon
- Clicking opens /forum/:postId

**Create Post `/forum/new`:**
Form: title, content (rich text — basic bold/italic/link), category dropdown, industry tag, optional link
Submit → redirects to the new post

**Single Post `/forum/:postId`:**
Full post content at top. Below: comment input. Below that: threaded comments.
Comments show: author, time, content, upvote count, reply button
Replies are indented one level (no deeper nesting)
If post category is "Looking for Co-founder": show "Send connection request" button next to author's name — sends a request from /discover flow
Author can edit or delete their own post

---

### INVESTOR FEED `/investor-feed`

For logged-in founders. Shows teams that have applied for investor visibility.

Filter bar: Industry, Stage, Team background, Traction (MVP / Revenue / Funded)

Each listing card:
- Both founder avatars (overlapping) + both names
- Team compatibility score badge
- Idea one-liner
- Industry + stage tags
- Traction metrics line
- Raise amount (large, indigo)
- Days remaining badge
- Both founders' backgrounds and top 2 skills each
- "Express Interest" button (indigo) + "Save to watchlist" button

Clicking "Express Interest": creates investor_interest record, sends notification to the founding team

For founders who want to list their own team: "Get in front of investors" CTA button → modal explaining the listing (shows pricing: ₹1,999 standard / ₹2,999 featured) → Razorpay payment → listing form

---

### OWN PROFILE `/profile/me`

View + edit own profile. All sections editable. Shows profile completeness score at top as a progress bar with checklist of what's missing. Assessment section is locked after first completion with a lock icon and note "Assessment locked to ensure compatibility integrity." Shows Big Five scores as a Recharts radar chart.

---

## OPENAI COMPATIBILITY REPORT

When a connection request is accepted and a conversation is created, call the OpenAI API to generate a compatibility_report record.

System prompt:
```
You are a co-founder compatibility analyst for an Indian startup platform. You receive two founders' profiles and their 20-question assessment answers. Generate a compatibility report. Return ONLY valid JSON — no markdown, no explanation.

Return this exact structure:
{
  "compatibility_score": <integer 0 to 100>,
  "rationale_summary": "<2-3 sentence summary of this founding pair>",
  "alignment_points": ["<string>", "<string>", "<string>"],
  "divergence_points": ["<string>", "<string>"],
  "risk_flags": ["<string>"],
  "conversation_starters": ["<string>", "<string>", "<string>"]
}

Rules:
- Score reflects complementarity not similarity. Identical founders score lower. Complementary skills + shared values score higher.
- alignment_points: specific shared traits that matter — same risk appetite, same commitment, complementary skills, shared exit vision.
- divergence_points: real differences that affect working together — equity philosophy mismatch, different decision velocity.
- risk_flags: honest early warning — one or two things that if not discussed will become problems.
- conversation_starters: specific to this pair based on their actual divergence — not generic advice.
- Never say guaranteed, perfect match, or incompatible. Frame everything constructively.
- All strings under 120 characters.
- Context: these are Indian founders building startups in India. Use relevant examples where helpful.
```

User message format:
```
Founder A: {name}, {background}, Skills: {skills}, Commitment: {commitment}, Equity: {equity_offer}, Exit: {exit_vision}, Assessment answers: {JSON.stringify(raw_answers)}

Founder B: {name}, {background}, Skills: {skills}, Commitment: {commitment}, Equity: {equity_offer}, Exit: {exit_vision}, Assessment answers: {JSON.stringify(raw_answers)}

Generate the compatibility report.
```

Parse response and store in compatibility_reports table. If call fails, set compatibility_score to null and show "Report generating..." in UI.

---

## SEED DATA

Create a seed function that runs once and populates demo data. Check for existing data before seeding.

**1 demo founder account:**
Email: demo@cofound.ai | Password: demo1234
Profile: Arjun Sharma, Full-stack engineer, Mumbai, Technical background, 3 years experience, Full-time, Fintech focus, has idea (B2B payment reconciliation SaaS), equity 40%, Skills: React, Node.js, Python, AWS

**6 other founders with complete profiles and assessments** — realistic Indian names, diverse backgrounds (mix of technical, business, design), different cities (Bangalore, Delhi, Hyderabad, Mumbai, Pune), different industries, all with 4 prompt answers:
1. Neha Kapoor — Business, Bangalore, Fintech/SaaS, Veteran tier, ex-Chargebee
2. Rohan Verma — Technical, Delhi, Healthtech, Maker tier, ML engineer
3. Priya Nair — Design, Bangalore, Edtech/Consumer, Maker tier, ex-Unacademy
4. Vikram Joshi — Business, Mumbai, B2B SaaS, Veteran tier, ex-two YC startups
5. Kavya Reddy — Business, Bangalore, Healthtech, Maker tier, product background
6. Siddharth Rao — Technical, Hyderabad, Deep Tech, Maker tier, blockchain

**2 existing conversations** for the demo account (Arjun + Neha, Arjun + Rohan) with pre-generated compatibility reports and 4-6 messages each already in the database so the inbox feels alive.

**1 pending incoming connection request** from Kavya Reddy to Arjun — with a message responding to a prompt.

**5 forum posts** across different categories with 2-3 comments each — make the forum feel like a real community.

**2 investor feed listings** from other teams so the feed has content.

---

## ENV VARIABLES

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENAI_API_KEY=
VITE_RAZORPAY_KEY_ID=
```

---

## UX RULES

- Onboarding cannot be skipped. profile_complete = false → redirect to /onboarding at correct step.
- If someone with no assessment tries to access /discover, redirect to /onboarding Step 4.
- Founders cannot send more than one request to the same person at a time.
- Investors cannot access founder routes. Redirect to /investor-feed.
- All forms: inline validation errors, no browser alerts.
- All async actions: loading state on button, button disabled during request.
- All success actions: toast notification.
- Realtime on messages and inbox using Supabase Realtime subscriptions.
- Mobile responsive — works cleanly on 375px and 1280px.
- Empty states on every list and feed.

---

## FILE STRUCTURE

```
src/
  components/
    ui/              shadcn components
    layout/          Navbar, Sidebar, AppLayout, ProtectedRoute
    founder/         FounderCard, SkillTag, TierBadge, ScoreRing, PromptCard, VideoPlaceholder
    discovery/       DiscoverBrowser, FilterPanel, RequestModal
    inbox/           InboxList, ConversationView, ChatThread, MessageBubble, LabelPicker, StageTracker
    compatibility/   CompatibilityReport, RadarChart, AlignmentList, StarterCard
    forum/           ForumFeed, PostCard, PostDetail, CommentThread, NewPostForm
    investor/        InvestorFeed, ListingCard, ListingForm
    profile/         ProfileView, ProfileEdit, CompletenessScore
  pages/
    Landing.jsx
    Login.jsx
    Signup.jsx
    Onboarding.jsx
    Discover.jsx
    Profile.jsx
    InboxPage.jsx
    ConversationPage.jsx
    ForumPage.jsx
    ForumPost.jsx
    NewForumPost.jsx
    InvestorFeedPage.jsx
    OwnProfile.jsx
  lib/
    supabase.js
    openai.js
    compatibilityEngine.js
    seed.js
  hooks/
    useAuth.js
    useFounder.js
    useInbox.js
    useConversation.js
    useForum.js
    useRealtime.js
  store/
    authStore.js
    founderStore.js
  utils/
    scoreCalculator.js
    formatters.js
    validators.js
```

---

Build this completely. Make every screen look like a real product. Seed data should make every page feel alive from the first login with demo@cofound.ai / demo1234.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://veyra-found.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84e55a29-f76e-4519-ae0b-7ac49d2c396e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
