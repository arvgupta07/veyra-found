/**
 * Account types.
 *
 * Everyone on Veyra Found signs up as one of three kinds of member. The chosen
 * type decides which onboarding they get, what they see in the nav, and whether
 * they take the compatibility assessment / answer prompts (founders only).
 */
export type AccountType = "founder" | "investor" | "talent";

export const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  blurb: string;
  detail: string;
}[] = [
  {
    value: "founder",
    label: "Founder",
    blurb: "I'm building (or about to build) a startup",
    detail: "Compatibility assessment + prompts, co-founder discovery, hiring and investors.",
  },
  {
    value: "investor",
    label: "Investor",
    blurb: "Angel, syndicate, fund or family office",
    detail: "Just a firm profile — no assessment, no prompts. Reach out to founders with a note.",
  },
  {
    value: "talent",
    label: "Talent / Intern",
    blurb: "I want to join an early startup",
    detail: "A profile with your CV and skills. Browse founders and open roles, apply with a note.",
  },
];

export function accountLabel(t?: string | null) {
  return ACCOUNT_TYPES.find((a) => a.value === t)?.label ?? "Founder";
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
    return v === "founder" || v === "investor" || v === "talent" ? v : null;
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
  if (type === "talent") {
    // Job seekers and interns don't get the investor directory or co-founder matching.
    if (path.startsWith("/investors") || path.startsWith("/matches")) return false;
  }
  if (type === "investor") {
    if (path.startsWith("/matches")) return false;
  }
  return true;
}
