import { GraduationCap, Landmark, Rocket, Briefcase } from "lucide-react";
import { accountBadgeClass, accountLabel } from "@/lib/account-types";

const ICONS: Record<string, typeof Rocket> = {
  founder: Rocket,
  investor: Landmark,
  intern: GraduationCap,
  talent: Briefcase,
};

/**
 * The role badge shown next to a member's name everywhere — discover, inbox,
 * profiles, applicant lists. Colour tells you instantly who you're talking to.
 */
export function RoleBadge({
  type,
  size = "sm",
  className = "",
}: {
  type?: string | null;
  size?: "xs" | "sm";
  className?: string;
}) {
  const Icon = ICONS[type ?? "founder"] ?? Rocket;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 border-2 border-ink font-black uppercase tracking-wider soft-corners ${accountBadgeClass(type)} ${
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${className}`}
    >
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {accountLabel(type)}
    </span>
  );
}
