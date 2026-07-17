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

export const PROMPTS = [
  "The thing I'd bring to a founding team that doesn't show on a resume...",
  "My biggest startup failure taught me...",
  "I work best with someone who...",
  "The problem I'm obsessed with solving...",
  "My co-founder deal-breakers are...",
  "The last thing I built from scratch...",
  "I know I'm not great at...",
  "What I'm really looking for in a co-founding relationship...",
  "The startup I wish existed in India...",
  "My honest superpower is...",
  "A hill I'll die on as a founder...",
  "In 5 years, I want my startup to...",
];

export const SKILLS_LIST = [
  "React","Python","Node.js","iOS","Android","Machine Learning","Product Management",
  "Growth Marketing","Sales","Finance","Operations","UI/UX Design","Data Science","Blockchain","Hardware",
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
