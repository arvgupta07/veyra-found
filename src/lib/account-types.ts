/**
 * Account types.
 *
 * Everyone on Veyra Found signs up as one of four kinds of member. The chosen
 * type decides which onboarding they get, what they see in the nav, and whether
 * they take the compatibility assessment / answer prompts (founders only).
 */
export type AccountType = "founder" | "investor" | "intern" | "talent";

export const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  blurb: string;
  detail: string;
  /** Badge classes — indigo founder, amber investor, green intern, orange talent. */
  badge: string;
}[] = [
  {
    value: "founder",
    label: "Founder",
    blurb: "I'm building (or about to build) a startup",
    detail: "Compatibility assessment + prompts, co-founder discovery, hiring and investors.",
    badge: "bg-indigo text-white",
  },
  {
    value: "investor",
    label: "Investor",
    blurb: "Angel, syndicate, fund or family office",
    detail: "3-step firm profile — thesis, cheque size, portfolio. No assessment, no prompts.",
    badge: "bg-amber-400 text-ink",
  },
  {
    value: "intern",
    label: "Intern",
    blurb: "I'm a student looking for an internship",
    detail: "3-step profile with a mandatory CV. Browse founders and internships, apply with a note.",
    badge: "bg-emerald-500 text-white",
  },
  {
    value: "talent",
    label: "Talent / Intern",
    blurb: "I want a job or an internship at an early startup",
    detail: "3-step profile with a mandatory CV. Browse founders and open roles, apply with a note.",
    badge: "bg-orange text-white",
  },
];

/**
 * Cards shown on the pre-sign-in picker. Interns and talent share one card —
 * the internship-vs-job question is asked inside their onboarding instead.
 */
export const PICKER_TYPES = ACCOUNT_TYPES.filter((a) => a.value !== "intern");

const BY_VALUE = new Map(ACCOUNT_TYPES.map((a) => [a.value, a]));

export function isAccountType(v: unknown): v is AccountType {
  return typeof v === "string" && BY_VALUE.has(v as AccountType);
}

export function accountLabel(t?: string | null) {
  return (isAccountType(t) ? BY_VALUE.get(t)!.label : null) ?? "Founder";
}

export function accountBadgeClass(t?: string | null) {
  return (isAccountType(t) ? BY_VALUE.get(t)!.badge : null) ?? "bg-indigo text-white";
}

/** Job-seeking types share one onboarding + one visibility rule. */
export function isJobSeeker(t?: string | null) {
  return t === "intern" || t === "talent";
}

const KEY = "veyra:pending-account-type";

/** Role chosen on the pre-sign-in picker, applied once the user lands in onboarding. */
export function setPendingAccountType(t: AccountType) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage blocked */
  }
}

export function getPendingAccountType(): AccountType | null {
  try {
    const v = localStorage.getItem(KEY);
    return isAccountType(v) ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingAccountType() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

/** Which nav destinations each account type may reach. */
export function canSee(type: AccountType, path: string): boolean {
  if (isJobSeeker(type)) {
    // Interns and talent don't get the investor directory or co-founder matching.
    if (path.startsWith("/investors") || path.startsWith("/matches")) return false;
  }
  if (type === "investor") {
    if (path.startsWith("/matches")) return false;
  }
  return true;
}
