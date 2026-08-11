import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Clock, Loader2, ShieldCheck, X, XCircle } from "lucide-react";
import { useMyFounder } from "@/hooks/useMyFounder";
import { useMyVerification } from "@/hooks/useVerification";
import { supabase } from "@/integrations/supabase/client";

/* ------- tiny global store so any component can pop the modal ------- */
let open = false;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function openVerifyModal() {
  open = true;
  emit();
}
export function closeVerifyModal() {
  open = false;
  emit();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function useVerifyModalOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

/** Mounted once (in AppShell). Renders the verification popup on demand. */
export function VerifyModalHost() {
  const isOpen = useVerifyModalOpen();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVerifyModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/60 px-4 py-8" onClick={closeVerifyModal}>
      <div
        className="w-full max-w-lg animate-pop-in border-[3px] border-ink bg-white p-6 shadow-brutal soft-corners"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Founder verification"
      >
        <VerifyModalBody />
      </div>
    </div>
  );
}

function VerifyModalBody() {
  const { data: me } = useMyFounder();
  const { verified, request, status } = useMyVerification();
  const qc = useQueryClient();

  const [linkedin, setLinkedin] = useState(me?.linkedin_url ?? "");
  const [affiliation, setAffiliation] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const linkedinOk = /linkedin\.com\/in\/[^/\s]+/i.test(linkedin.trim());
  const noteOk = note.trim().length >= 40;
  const canSubmit = linkedinOk && noteOk && !!me?.id && !sending;

  async function submit() {
    if (!me?.id) return;
    setSending(true);
    const { error } = await supabase.from("verification_requests").insert({
      founder_id: me.id,
      linkedin_url: linkedin.trim(),
      affiliation: affiliation.trim() || null,
      note: note.trim(),
      status: "pending",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted — we'll review it shortly.");
    setNote("");
    qc.invalidateQueries({ queryKey: ["my-verification"] });
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center border-[3px] border-ink bg-orange text-white shadow-brutal-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight">Founder verification</h2>
          <p className="text-sm text-muted-text">Verified founders can send requests and message matches.</p>
        </div>
        <button
          onClick={closeVerifyModal}
          aria-label="Close verification"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-white shadow-brutal-sm box-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {verified ? (
        <div className="mt-5 border-[3px] border-ink bg-sage p-4 shadow-brutal-sm">
          <div className="flex items-center gap-2 text-ink">
            <BadgeCheck className="h-5 w-5" />
            <h3 className="text-lg font-black">You're verified</h3>
          </div>
          <p className="mt-1 text-sm font-medium text-ink/80">Requests and messaging are unlocked.</p>
        </div>
      ) : status === "pending" ? (
        <div className="mt-5 border-[3px] border-ink bg-cream p-4 shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange" />
            <h3 className="text-lg font-black">Under review</h3>
          </div>
          <p className="mt-1 text-sm text-ink/80">
            Submitted {request?.created_at ? new Date(request.created_at).toLocaleString() : "just now"}. Most reviews
            finish within 24 hours — keep browsing meanwhile.
          </p>
          <dl className="mt-3 space-y-2 border-t-2 border-ink/20 pt-3 text-sm">
            <Row label="LinkedIn" value={request?.linkedin_url ?? "—"} />
            <Row label="Company / college" value={request?.affiliation || "—"} />
            <Row label="What you're building" value={request?.note ?? "—"} />
          </dl>
        </div>
      ) : (
        <>
          {status === "rejected" && (
            <div className="mt-4 border-[3px] border-ink bg-red p-3 text-white shadow-brutal-sm">
              <div className="flex items-center gap-2 text-sm font-black">
                <XCircle className="h-4 w-4" /> Previous request declined
              </div>
              {request?.review_note && <p className="mt-1 text-sm">Reviewer note: {request.review_note}</p>}
            </div>
          )}

          <label className="mt-5 block text-[11px] font-black uppercase tracking-wider text-ink">
            LinkedIn profile <span className="text-red">*</span>
          </label>
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/your-handle"
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-brutal-sm"
          />
          {linkedin && !linkedinOk && <p className="mt-1 text-xs font-bold text-red">Use a full linkedin.com/in/… URL.</p>}

          <label className="mt-4 block text-[11px] font-black uppercase tracking-wider text-ink">Company or college</label>
          <input
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="e.g. BITS Pilani / Zomato / building solo"
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-brutal-sm"
          />

          <label className="mt-4 block text-[11px] font-black uppercase tracking-wider text-ink">
            What are you building &amp; what co-founder do you need? <span className="text-red">*</span>
          </label>
          <textarea
            rows={4}
            maxLength={600}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Two or three lines about your idea, stage, and the kind of co-founder you're looking for."
            className="mt-1 w-full border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-brutal-sm"
          />
          <div className="mt-1 flex justify-between text-[10px] font-semibold text-muted-text">
            <span>{noteOk ? "Looks good" : "At least 40 characters"}</span>
            <span>{note.length}/600</span>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="mt-5 flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Submit for verification
          </button>
        </>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-wider text-muted-text">{label}</dt>
      <dd className="break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
