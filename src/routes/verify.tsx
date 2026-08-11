import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useMyFounder } from "@/hooks/useMyFounder";
import { useMyVerification } from "@/hooks/useVerification";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Get Verified as a Founder · Veyra Found" },
      { name: "description", content: "Verify your founder identity on Veyra Found to unlock co-founder requests and messaging. Real profiles only, reviewed by our team." },
      { property: "og:title", content: "Get Verified as a Founder · Veyra Found" },
      { property: "og:description", content: "Submit your LinkedIn and what you're building. Once approved you can send co-founder requests and message matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function VerifyPage() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
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

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center border-[3px] border-ink bg-orange text-white shadow-brutal-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Founder verification</h1>
            <p className="text-sm text-muted-text">Verified founders can send requests and message matches.</p>
          </div>
        </div>

        {verified ? (
          <div className="border-[3px] border-ink bg-sage p-6 shadow-brutal">
            <div className="flex items-center gap-2 text-ink">
              <BadgeCheck className="h-6 w-6" />
              <h2 className="text-xl font-black">You're verified</h2>
            </div>
            <p className="mt-2 text-sm font-medium text-ink/80">
              Your profile carries the verified badge. Requests and messaging are unlocked.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/discover" className="border-[3px] border-ink bg-ink px-4 py-2 text-xs font-black uppercase tracking-wider text-cream shadow-brutal-sm transition hover:-translate-y-0.5">
                Start discovering
              </Link>
              <Link to="/inbox" className="border-[3px] border-ink bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-ink shadow-brutal-sm transition hover:-translate-y-0.5">
                Open inbox
              </Link>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="border-[3px] border-ink bg-cream p-6 shadow-brutal">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange" />
              <h2 className="text-xl font-black">Under review</h2>
            </div>
            <p className="mt-2 text-sm text-ink/80">
              Submitted {request?.created_at ? new Date(request.created_at).toLocaleString() : "just now"}. Most
              reviews finish within 24 hours. You can keep browsing profiles and posting in the forum meanwhile.
            </p>
            <dl className="mt-4 space-y-2 border-t-2 border-ink/20 pt-4 text-sm">
              <Row label="LinkedIn" value={request?.linkedin_url ?? "—"} />
              <Row label="Company / college" value={request?.affiliation || "—"} />
              <Row label="What you're building" value={request?.note ?? "—"} />
            </dl>
          </div>
        ) : (
          <>
            {status === "rejected" && (
              <div className="mb-4 border-[3px] border-ink bg-red p-4 text-white shadow-brutal-sm">
                <div className="flex items-center gap-2 font-black">
                  <XCircle className="h-5 w-5" /> Previous request declined
                </div>
                {request?.review_note && <p className="mt-1 text-sm">Reviewer note: {request.review_note}</p>}
                <p className="mt-1 text-sm opacity-90">Fix what's flagged and submit again below.</p>
              </div>
            )}

            <div className="border-[3px] border-ink bg-white p-6 shadow-brutal">
              <h2 className="text-xl font-black">Submit for review</h2>
              <p className="mt-1 text-sm text-muted-text">
                A human checks every submission. Make it easy to confirm you're real.
              </p>

              <label className="mt-5 block text-[11px] font-black uppercase tracking-wider text-ink">
                LinkedIn profile <span className="text-red">*</span>
              </label>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/your-handle"
                className="mt-1 w-full border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-brutal-sm"
              />
              {linkedin && !linkedinOk && (
                <p className="mt-1 text-xs font-bold text-red">Use a full linkedin.com/in/… URL.</p>
              )}

              <label className="mt-4 block text-[11px] font-black uppercase tracking-wider text-ink">
                Company or college
              </label>
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
                rows={5}
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
            </div>
          </>
        )}

        <div className="mt-6 border-[3px] border-ink bg-cream p-5 shadow-brutal-sm">
          <h2 className="text-sm font-black uppercase tracking-wider">What verification unlocks</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
            <li>• Sending co-founder requests from Discover and profiles</li>
            <li>• Messaging your matches in DMs</li>
            <li>• A verified badge on your profile so others reply</li>
          </ul>
          <p className="mt-3 text-xs text-muted-text">
            Browsing profiles, the forum and your own profile stay open while you wait.
          </p>
        </div>
      </div>
    </AppShell>
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
