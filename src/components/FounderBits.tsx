import { CheckCircle2, ShieldCheck, Award, Sparkles } from "lucide-react";
import type { Founder } from "@/lib/founder-types";

export function TierBadge({ tier }: { tier: Founder["trust_tier"] }) {
  const map: Record<Founder["trust_tier"], { icon: React.ComponentType<{ className?: string }>; label: string; cls: string }> = {
    Builder: { icon: Sparkles, label: "Builder", cls: "bg-slate-100 text-slate-700" },
    Maker:   { icon: Award, label: "Maker", cls: "bg-indigo/10 text-indigo" },
    Veteran: { icon: ShieldCheck, label: "Veteran", cls: "bg-emerald/10 text-emerald" },
  };
  const { icon: Icon, label, cls } = map[tier];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function VerifiedBadges({ f }: { f: Founder }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {f.github_verified && (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800"><CheckCircle2 className="h-3 w-3" />GitHub</span>
      )}
      {f.aadhaar_verified && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber"><CheckCircle2 className="h-3 w-3" />Aadhaar</span>
      )}
    </div>
  );
}

export function ScoreRing({ score, size = 96, label = "Compatibility" }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = pct >= 80 ? "var(--emerald)" : pct >= 60 ? "var(--indigo)" : "var(--amber)";
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-2)" strokeWidth="8" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} />
      </svg>
      <div className="-mt-[calc(50%+8px)] text-center" style={{ height: 0 }}>
        <div className="rotate-0 text-2xl font-black text-foreground">{score}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function SkillTag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground">{children}</span>;
}
