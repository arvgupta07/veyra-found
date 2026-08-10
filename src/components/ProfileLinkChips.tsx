import {
  Linkedin,
  Github,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Instagram,
  Send,
  Youtube,
  CalendarClock,
  FileText,
  Newspaper,
  Palette,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { linkHref, linkTypeLabel, type ProfileLink, type ProfileLinkType } from "@/lib/profile-links";

const ICONS: Record<ProfileLinkType, LucideIcon> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  website: Globe,
  x: Send,
  instagram: Instagram,
  telegram: Send,
  youtube: Youtube,
  calendly: CalendarClock,
  notion: FileText,
  substack: Newspaper,
  dribbble: Palette,
  other: LinkIcon,
};

const CHIP =
  "inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-white px-2 py-1 text-[11px] font-black text-ink box-hover";

/** Neo-brutalist chip row of every link on a founder profile. */
export function ProfileLinkChips({
  linkedin,
  github,
  links,
  name,
  className = "",
}: {
  linkedin?: string | null;
  github?: string | null;
  links?: ProfileLink[];
  name?: string | null;
  className?: string;
}) {
  const extra = links ?? [];
  if (!linkedin && !github && extra.length === 0) return null;

  const subject = "Let's talk about co-founding — via Veyra Found";
  const body = `Hi${name ? ` ${name.split(" ")[0]}` : ""},\n\nI found your profile on Veyra Found and I'd love to talk.\n\n`;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noreferrer noopener" className={CHIP}>
          <Linkedin className="h-3 w-3" /> LinkedIn
        </a>
      )}
      {github && (
        <a href={github} target="_blank" rel="noreferrer noopener" className={CHIP}>
          <Github className="h-3 w-3" /> GitHub
        </a>
      )}
      {extra.map((l, i) => {
        const Icon = ICONS[l.type] ?? LinkIcon;
        return (
          <a
            key={`${l.type}-${i}`}
            href={linkHref(l, l.type === "email" ? { subject, body } : undefined)}
            target={l.type === "phone" ? undefined : "_blank"}
            rel="noreferrer noopener"
            title={l.value}
            className={CHIP}
          >
            <Icon className="h-3 w-3" /> {l.label || linkTypeLabel(l.type)}
          </a>
        );
      })}
    </div>
  );
}
