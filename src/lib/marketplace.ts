/** Shared option sets + helpers for the Investors / Roles / Talent surfaces. */

export const ROLE_TYPES = [
  { v: "cofounder", label: "Co-founder" },
  { v: "full_time", label: "Full-time" },
  { v: "part_time", label: "Part-time" },
  { v: "internship", label: "Internship" },
  { v: "contract", label: "Contract / freelance" },
] as const;

export const WORK_TYPES = [
  { v: "internship", label: "Internship" },
  { v: "full_time", label: "Full-time" },
  { v: "part_time", label: "Part-time" },
  { v: "contract", label: "Contract / freelance" },
] as const;

export const REMOTE_PREFS = [
  { v: "remote", label: "Remote" },
  { v: "hybrid", label: "Hybrid" },
  { v: "onsite", label: "On-site" },
] as const;

export const INVEST_STAGES = [
  "Pre-seed",
  "Seed",
  "Pre-Series A",
  "Series A",
  "Series B+",
] as const;

export const INDUSTRIES = [
  "SaaS", "Fintech", "D2C", "Healthtech", "Edtech", "AI/ML", "Climate",
  "Deeptech", "Consumer", "Gaming", "Logistics", "Agritech", "Marketplace",
] as const;

export const TALENT_SKILLS = [
  "React", "Node.js", "Python", "Flutter", "iOS", "Android", "DevOps",
  "Data / Analytics", "AI/ML", "UI/UX Design", "Graphic Design", "Product",
  "Growth Marketing", "Content", "Social Media", "Sales", "Business Development",
  "Operations", "Finance", "Legal", "HR / Recruiting", "Community",
] as const;

export function labelOf(list: ReadonlyArray<{ v: string; label: string }>, v?: string | null) {
  return list.find((x) => x.v === v)?.label ?? "—";
}

export function inr(n?: number | null) {
  if (n === null || n === undefined) return null;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
}

export function compRange(min?: number | null, max?: number | null) {
  const a = inr(min);
  const b = inr(max);
  if (a && b) return `${a} – ${b}`;
  if (a) return `${a}+`;
  if (b) return `up to ${b}`;
  return "Not disclosed";
}

export function checkRange(min?: number | null, max?: number | null) {
  const r = compRange(min, max);
  return r === "Not disclosed" ? "Cheque size undisclosed" : r;
}

export function initialsAvatar(name?: string | null) {
  const seed = encodeURIComponent(name || "veyra");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=solid`;
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function normalizeUrl(u?: string | null) {
  const s = (u ?? "").trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
