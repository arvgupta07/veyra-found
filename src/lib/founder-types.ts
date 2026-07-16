export type Founder = {
  id: string;
  user_id: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  background: "technical" | "business" | "design" | "other" | null;
  years_experience: number | null;
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

export function founderAvatar(f: { seed_avatar: string | null; profile?: { full_name?: string | null } | null; seed_name?: string | null }): string {
  if (f.seed_avatar) return f.seed_avatar;
  const name = f.profile?.full_name ?? f.seed_name ?? "F";
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366F1`;
}

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

export const ASSESSMENT_QUESTIONS: { q: string; opts: [string, string, string, string] }[] = [
  { q: "When your team disagrees on a major decision:", opts: ["Debate until consensus","Person with most context decides fast","Follow pre-agreed framework","Bring in a third opinion"] },
  { q: "Your ideal work week looks like:", opts: ["60+ hours, fully in it","Structured 9 to 6","Flexible around output","Intense sprints then rest"] },
  { q: "When a co-founder doesn't reply for 12 hours:", opts: ["Totally fine — async works","Send one follow-up","Get frustrated — comms matter","Depends on the context"] },
  { q: "You work best when:", opts: ["Full autonomy over my domain","Constant co-founder sync","Clear lanes, daily check-ins","When the work demands it"] },
  { q: "₹5Cr acquisition offer at MVP stage:", opts: ["Take it immediately","Seriously consider it","Decline — too early","Depends on the team's vision"] },
  { q: "Your backup plan if the startup fails:", opts: ["Already have one — realistic","Will figure it out","No backup — this has to work","My next startup idea"] },
  { q: "Growth pace you want:", opts: ["Steady and sustainable","Fast but calculated","Hypergrowth only","Whatever the market pulls"] },
  { q: "Financially while building:", opts: ["Need market rate salary","Minimum for 12 months","Will live on nothing","Depends on runway"] },
  { q: "Fairest co-founder equity split:", opts: ["50/50 always","Based on contribution","Based on idea + domain","Negotiated per milestone"] },
  { q: "Co-founder joined 6 months after you:", opts: ["They take lower equity","Negotiate on current value","50/50 regardless","Vesting schedule decides"] },
  { q: "Salary before revenue:", opts: ["Equal minimum for both","Market rate regardless","No salary till milestone","Performance-linked"] },
  { q: "Disagreement on a hire's salary:", opts: ["Domain owner decides","Pre-agreed comp framework","Debate it equally","Benchmark to market"] },
  { q: "Problem with co-founder:", opts: ["Address immediately","Process then talk","Raise at next check-in","Let it resolve naturally"] },
  { q: "Most irritating co-founder behaviour:", opts: ["Going silent under pressure","Micromanaging my work","Missing commitments","Changing direction constantly"] },
  { q: "When a big decision goes wrong:", opts: ["Debrief immediately","Take a day, then debrief","Move on — no postmortems","Document it for next time"] },
  { q: "Healthiest way to resolve disagreements:", opts: ["Pre-agreed frameworks","Trusted advisor tiebreaker","Executor makes final call","Vote and commit"] },
  { q: "Current commitment:", opts: ["Already full-time","Full-time in 3 months","Part-time until milestone","Depends on the co-founder"] },
  { q: "Location:", opts: ["Remote-first forever","Open to co-locating","Must be same city","Flexible by phase"] },
  { q: "In 10 years with your co-founder:", opts: ["Equal partners in a large company","Happy with whatever exit","Still together only if growing","Onto separate ventures with a great story"] },
  { q: "Non-negotiable from a co-founder:", opts: ["Radical transparency","Complementary skills","Shared obsession with the problem","Track record of execution"] },
];
