import { BadgeCheck, Clock, ShieldAlert, XCircle } from "lucide-react";
import { useMyVerification } from "@/hooks/useVerification";
import { openVerifyModal } from "@/components/VerifyModal";

export function VerifiedTick({ className = "" }: { className?: string }) {
  return (
    <span
      title="Verified founder"
      className={`inline-flex items-center gap-1 border-2 border-ink bg-sage px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink ${className}`}
    >
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );
}

/** Inline block shown wherever an unverified founder tries to reach out. */
export function VerifyRequiredCard({ action = "send requests" }: { action?: string }) {
  const { status } = useMyVerification();

  const copy =
    status === "pending"
      ? {
          icon: Clock,
          tone: "bg-cream",
          title: "Verification under review",
          body: `We're checking your details. Once approved you can ${action} right away — usually within 24 hours.`,
          cta: "View my request",
        }
      : status === "rejected"
        ? {
            icon: XCircle,
            tone: "bg-red text-white",
            title: "Verification was declined",
            body: "Check the reviewer note, fix what's missing and submit again.",
            cta: "Resubmit verification",
          }
        : {
            icon: ShieldAlert,
            tone: "bg-orange text-white",
            title: "Verified founders only",
            body: `Veyra keeps the network real. Get verified to ${action} — it takes a minute.`,
            cta: "Get verified",
          };

  const Icon = copy.icon;
  return (
    <div className="border-[3px] border-ink bg-white p-5 shadow-brutal-sm">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center border-[3px] border-ink shadow-brutal-sm ${copy.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-black tracking-tight">{copy.title}</div>
          <p className="mt-1 text-sm text-muted-text">{copy.body}</p>
          <button
            onClick={openVerifyModal}
            className="mt-3 inline-flex items-center gap-2 border-[3px] border-ink bg-ink px-3 py-2 text-xs font-black uppercase tracking-wider text-cream shadow-brutal-sm transition hover:-translate-y-0.5"
          >
            <BadgeCheck className="h-4 w-4" /> {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Slim top-of-page nudge for unverified founders. */
export function VerifyBanner() {
  const { verified, status, ready, founderId } = useMyVerification();
  if (!ready || !founderId || verified) return null;

  return (
    <button
      onClick={openVerifyModal}
      className="mb-4 w-full text-left flex items-center gap-3 border-[3px] border-ink bg-cream px-4 py-3 shadow-brutal-sm transition hover:-translate-y-0.5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-orange text-white">
        {status === "pending" ? <Clock className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      </span>
      <span className="text-sm font-bold text-ink">
        {status === "pending"
          ? "Verification in review — you can browse, but requests and messages unlock once approved."
          : status === "rejected"
            ? "Verification declined. Resubmit to unlock requests and messages."
            : "You're not verified yet. Verify to send requests and message founders."}
      </span>
      <span className="ml-auto hidden shrink-0 text-[10px] font-black uppercase tracking-wider text-orange sm:block">
        {status === "pending" ? "View status" : "Verify now"}
      </span>
    </button>
  );
}
