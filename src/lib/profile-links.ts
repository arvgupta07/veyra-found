// Multi-link support for founder profiles.
// Stored on founders.links as: [{ type, value, label? }]
export type ProfileLinkType =
  | "email"
  | "phone"
  | "whatsapp"
  | "website"
  | "x"
  | "instagram"
  | "telegram"
  | "youtube"
  | "calendly"
  | "notion"
  | "substack"
  | "dribbble"
  | "other";

export type ProfileLink = { type: ProfileLinkType; value: string; label?: string };

export const LINK_TYPES: {
  type: ProfileLinkType;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  { type: "email", label: "Email", placeholder: "you@gmail.com", hint: "Opens Gmail with a new message ready to send" },
  { type: "whatsapp", label: "WhatsApp", placeholder: "+91 98765 43210", hint: "Opens a WhatsApp chat" },
  { type: "phone", label: "Phone", placeholder: "+91 98765 43210", hint: "Starts a call on mobile" },
  { type: "website", label: "Website", placeholder: "yoursite.com", hint: "Personal site or product page" },
  { type: "x", label: "X (Twitter)", placeholder: "@handle", hint: "Your X profile" },
  { type: "instagram", label: "Instagram", placeholder: "@handle", hint: "Your Instagram profile" },
  { type: "telegram", label: "Telegram", placeholder: "@handle", hint: "Opens a Telegram chat" },
  { type: "youtube", label: "YouTube", placeholder: "youtube.com/@channel", hint: "Channel or demo video" },
  { type: "calendly", label: "Calendly", placeholder: "calendly.com/you/30min", hint: "Let founders book a call" },
  { type: "notion", label: "Notion / Deck", placeholder: "notion.so/...", hint: "Deck, memo or build log" },
  { type: "substack", label: "Blog / Substack", placeholder: "you.substack.com", hint: "Your writing" },
  { type: "dribbble", label: "Dribbble / Behance", placeholder: "dribbble.com/you", hint: "Design portfolio" },
  { type: "other", label: "Other", placeholder: "https://...", hint: "Any other link" },
];

export function linkTypeLabel(t: ProfileLinkType) {
  return LINK_TYPES.find((l) => l.type === t)?.label ?? "Link";
}

function httpUrl(v: string) {
  const t = v.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
function handle(v: string) {
  return v.trim().replace(/^@/, "").replace(/\/+$/, "");
}
function digits(v: string) {
  const d = v.replace(/[^\d]/g, "");
  // Default Indian country code when the user typed a bare 10-digit number.
  return d.length === 10 ? `91${d}` : d;
}

/** Turn a stored link into a clickable href. Email opens Gmail's compose window. */
export function linkHref(link: ProfileLink, opts?: { subject?: string; body?: string }): string {
  const v = link.value.trim();
  if (!v) return "#";
  switch (link.type) {
    case "email": {
      const params = new URLSearchParams({ view: "cm", fs: "1", to: v });
      if (opts?.subject) params.set("su", opts.subject);
      if (opts?.body) params.set("body", opts.body);
      return `https://mail.google.com/mail/?${params.toString()}`;
    }
    case "phone":
      return `tel:+${digits(v)}`;
    case "whatsapp":
      return `https://wa.me/${digits(v)}`;
    case "x":
      return /^https?:\/\//i.test(v) ? v : `https://x.com/${handle(v)}`;
    case "instagram":
      return /^https?:\/\//i.test(v) ? v : `https://instagram.com/${handle(v)}`;
    case "telegram":
      return /^https?:\/\//i.test(v) ? v : `https://t.me/${handle(v)}`;
    default:
      return httpUrl(v);
  }
}

export function parseLinks(raw: unknown): ProfileLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is ProfileLink => !!l && typeof l === "object" && typeof (l as ProfileLink).value === "string")
    .map((l) => ({
      type: (LINK_TYPES.some((t) => t.type === l.type) ? l.type : "other") as ProfileLinkType,
      value: String(l.value).trim(),
      ...(l.label ? { label: String(l.label).slice(0, 40) } : {}),
    }))
    .filter((l) => l.value.length > 0)
    .slice(0, 12);
}
