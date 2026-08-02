export type Founder = {
  id: string;
  user_id: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  background: "technical" | "business" | "design" | "other" | null;
  years_experience: number | null;
  age: number | null;
  commitment: "full_time" | "part_time" | "exploring" | null;
  has_idea: boolean;
  idea_description: string | null;
  idea_industry: string | null;
  idea_stage: "idea" | "mvp" | "revenue" | "funded" | null;
  equity_offer: string | null;
  exit_vision: "lifestyle" | "acquisition" | "ipo" | null;
  skills: string[];
  industry_focus: string[];
  active_status: "active" | "open" | "paused";
  linkedin_url: string | null;
  github_url: string | null;
  linkedin_verified: boolean;
  github_verified: boolean;
  aadhaar_verified: boolean;
  video_intro_url: string | null;
  vouches_count: number;
  trust_tier: "Builder" | "Maker" | "Veteran";
  profile_complete: boolean;
  seed_name: string | null;
  seed_avatar: string | null;
  created_at: string;
  education?: string | null;
  remote_pref?: "onsite" | "hybrid" | "remote" | null;
  looking_for?: string[];
  shadow_banned?: boolean;
  spam_strikes?: number;
  assessment_public?: boolean;
};

export type Prompt = {
  id: string;
  founder_id: string;
  prompt_question: string;
  prompt_answer: string;
  display_order: number;
};

export function founderDisplayName(f: { seed_name: string | null; user_id: string | null; profile?: { full_name?: string | null } | null }) {
  return f.profile?.full_name ?? f.seed_name ?? "Founder";
}

export function founderAvatar(f: { seed_avatar: string | null; profile?: { full_name?: string | null; avatar_url?: string | null } | null; seed_name?: string | null }): string {
  if (f.profile?.avatar_url) return f.profile.avatar_url;
  if (f.seed_avatar) return f.seed_avatar;
  const name = f.profile?.full_name ?? f.seed_name ?? "F";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366F1`;
}

export const AVATAR_PRESETS: string[] = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Rocket&backgroundColor=FF7F11",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Neon&backgroundColor=ACBFA4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Storm&backgroundColor=E2E8CE",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aster&backgroundColor=FF1B1C",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Vega&backgroundColor=262626",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Zephyr&backgroundColor=FF7F11",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Byte&backgroundColor=ACBFA4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Circuit&backgroundColor=FF7F11",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=E2E8CE",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Ada&backgroundColor=ACBFA4",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Grace&backgroundColor=FF7F11",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Turing&backgroundColor=E2E8CE",
];

export const PROMPT_GROUPS: { label: string; prompts: string[] }[] = [
  {
    label: "Building & work style",
    prompts: [
      "I do my best thinking when...",
      "My work style in three words, and why all three are true...",
      "The way I'd describe how I handle pressure...",
      "I know a product is ready to ship when...",
      "The part of building a startup nobody talks about that I actually enjoy...",
      "My relationship with deadlines is...",
      "When I disagree with someone I respect, I...",
      "The last time I changed my mind completely about something...",
      "I'm the kind of founder who...",
      "My process when something isn't working is...",
      "The thing I optimise for that most people don't...",
      "I get unreasonably excited about...",
    ],
  },
  {
    label: "Past experience & lessons",
    prompts: [
      "The startup lesson that cost me the most to learn...",
      "Something I built that failed, and what I'd do differently...",
      "The best professional feedback I ever received was...",
      "A decision I made that looked wrong at first but wasn't...",
      "The thing my last company got completely right...",
      "What I wish someone had told me before I started...",
      "The moment I realised I wanted to be a founder...",
      "The worst advice I ever followed...",
      "A project I'm genuinely proud of and why...",
      "The thing I've unlearned in the last two years...",
    ],
  },
  {
    label: "Co-founder relationship",
    prompts: [
      "The co-founder dynamic I want looks like...",
      "My honest non-negotiables in a working partnership...",
      "I know a working relationship is healthy when...",
      "The thing I need my co-founder to be better at than me...",
      "How I like to celebrate wins (big and small)...",
      "When things get hard, I...",
      "My communication style is...and I need my co-founder's to be...",
      "The green flag I look for in someone I'm building with...",
      "What I think makes two founders actually compatible (not just complementary)...",
      "I'll know we're a good team when...",
      "The version of me my co-founder will see most is...",
      "What loyalty means to me in a business context...",
    ],
  },
  {
    label: "Vision & ambition",
    prompts: [
      "The problem I keep coming back to no matter what...",
      "In ten years I want to be able to say I...",
      "The change I want to make that feels too big to say out loud...",
      "I'm building in this space because...",
      "The company I'd most want to compete with (and why)...",
      "The India-specific problem I think is wildly underestimated...",
      "My exit fantasy is...and my realistic goal is...",
      "The market everyone ignores that I can't stop thinking about...",
      "I'd rather build something that does X than Y...",
    ],
  },
  {
    label: "Honest & personal",
    prompts: [
      "The thing I'm working on getting better at as a founder...",
      "Where I'm genuinely not strong and I know it...",
      "My biggest self-doubt and how I manage it...",
      "I burn out when...and recover by...",
      "The type of feedback I find hardest to hear...",
      "I'm at my worst when...",
      "What motivates me that I don't usually admit...",
      "The assumption about me that's usually wrong...",
      "The thing I care about that doesn't show up on a pitch deck...",
    ],
  },
  {
    label: "Lighter & revealing",
    prompts: [
      "The weird thing I do that actually makes me more productive...",
      "My idea of a perfect working day...",
      "The app I'd build just for myself if nothing else mattered...",
      "Two truths and a lie about my startup journey...",
      "The book, podcast, or essay that changed how I think about building...",
      "I'm insufferable about...",
      "The founder I'd most want to have a long call with (and what I'd ask)...",
      "Startups aside, the other thing I'm quietly obsessed with...",
      "The dumbest reason I've stayed up past 2am working...",
      "My hot take on the Indian startup ecosystem is...",
    ],
  },
];

export const PROMPTS = PROMPT_GROUPS.flatMap((g) => g.prompts);


export const SKILLS_LIST = [
  // Technical
  "React","Python","Node.js","iOS","Android","Machine Learning","Data Science","Blockchain","Hardware","DevOps","Backend","Frontend",
  // Product & design
  "Product Management","UI/UX Design","Product Design","User Research","Brand Design",
  // Go-to-market
  "Growth Marketing","Performance Marketing","Content","SEO","Community","Social Media","PR","Partnerships",
  // Sales & ops
  "Sales","B2B Sales","Enterprise Sales","Business Development","Operations","Supply Chain","Customer Success",
  // Business
  "Finance","Fundraising","Legal","HR & Hiring","Strategy",
  // Domain
  "Healthcare","Education","Real Estate","D2C","Manufacturing","Media","Gaming",
];

export const LOOKING_FOR_OPTIONS = [
  "Technical co-founder","Business/GTM co-founder","Design co-founder","Product co-founder",
  "Domain expert","Sales lead","Growth lead","Operations lead","Finance/Fundraising lead",
  "Someone with an idea","Someone who can execute","Someone with a network","Someone in my city",
  "Full-time commitment","Part-time / exploring","Complementary skills","Shared values",
  "First-time founder","Experienced founder","Ex-operator","Ex-engineer",
];

export const INDUSTRIES = ["Fintech","Healthtech","Edtech","SaaS","E-commerce","Deep Tech","Climate","Consumer","B2B","Other"];

// Personality-focused assessment. No business/equity/salary questions — those
// are asked separately in onboarding. This is about who the person is.
export const ASSESSMENT_QUESTIONS: { q: string; opts: [string, string, string, string] }[] = [
  { q: "On a free Sunday, you'd rather:", opts: ["Try something you've never done before","Deep-dive a hobby you already love","See friends and hang out","Read, journal, or just think"] },
  { q: "A new idea lands in your head. You:", opts: ["Start building it that evening","Write it down and sit with it for a week","Talk it out with three trusted people","Look for reasons it might not work"] },
  { q: "In group conversations you tend to:", opts: ["Take the floor and set the tone","Riff off whoever is talking","Listen carefully and pick moments","Prefer 1:1 side conversations"] },
  { q: "When plans change last minute you feel:", opts: ["Excited — improvisation is fun","Fine, as long as the goal is clear","A bit thrown but recover fast","Frustrated — I plan for a reason"] },
  { q: "Under real stress you're most likely to:", opts: ["Get quiet and focused","Get more energetic and louder","Withdraw and process alone","Overthink and lose sleep"] },
  { q: "Your desk / workspace usually looks:", opts: ["Immaculate — a place for everything","Organised chaos I understand","Whatever it needs to be today","I don't really have a fixed one"] },
  { q: "When someone strongly disagrees with you:", opts: ["I love the debate — bring it","I look for what's true in their view","I get uncomfortable but stay","I usually let it go for peace"] },
  { q: "You feel most alive when:", opts: ["Learning something completely new","Getting deeply good at one thing","Around ambitious, curious people","Alone with a hard problem"] },
  { q: "Your default with a new person is:", opts: ["Warm and open right away","Curious but a bit reserved","Polite but slow to trust","Reading them before saying much"] },
  { q: "When you make a mistake you:", opts: ["Own it fast and move on","Analyse it for a while","Beat yourself up about it","Quietly file it away and adjust"] },
  { q: "Given a hard problem you prefer to:", opts: ["Try things and iterate","Model it out on paper first","Ask people who've solved it","Sleep on it — answers come later"] },
  { q: "Your relationship with routine is:", opts: ["Love it — rituals free my mind","Some routine, lots of variety","Routine bores me","I keep breaking my own routines"] },
  { q: "Which sounds most like you:", opts: ["Big feelings, expressed clearly","Steady, hard to rattle","Deeply feeling, quietly held","Analytical first, feelings second"] },
  { q: "When a friend needs help you:", opts: ["Drop what you're doing","Make time within the day","Listen, but let them lead","Send resources and check in later"] },
  { q: "You'd describe your ambition as:", opts: ["Loud and public","Quiet and relentless","Bursts with rest between","Situational — it comes and goes"] },
  { q: "Given a choice, you'd rather live:", opts: ["In a big city, always moving","In a small town near nature","Somewhere new every year","Where your people are"] },
  { q: "You value more in a partner:", opts: ["Direct honesty even when it stings","Kind honesty and softness","Shared curiosity about the world","Rock-solid reliability"] },
  { q: "Your relationship with risk:", opts: ["I chase it — comfort feels like death","Take it if the upside is clear","Prefer calculated, small bets","I'd rather have peace of mind"] },
  { q: "You handle boredom by:", opts: ["Starting a new project","Going for a long walk","Calling someone","Sitting with it — boredom is data"] },
  { q: "Ten years from now you want to be someone who:", opts: ["Built something the world uses","Grew into their best self","Has deep, chosen family","Lives on their own terms"] },
];
