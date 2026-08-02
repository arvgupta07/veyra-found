import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowLeft, MapPin, Briefcase, Loader2, Send, X, Ban, ShieldCheck, Linkedin, Github, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/$founderId")({
  component: FounderProfile,
});

function FounderProfile() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { founderId } = Route.useParams();
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#connect") setConnectOpen(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["founder-profile", founderId],
    queryFn: async () => {
      const { data: f } = await supabase.from("founders")
        .select("*, profiles(full_name), founder_prompts(prompt_question, prompt_answer, display_order), assessments(*)")
        .eq("id", founderId).maybeSingle();
      return f;
    },
  });

  const { data: block } = useQuery({
    queryKey: ["block", me?.id, founderId],
    enabled: !!me?.id && me?.id !== founderId,
    queryFn: async () => {
      const { data } = await supabase.from("blocks")
        .select("id, blocker_id, blocked_id")
        .or(`and(blocker_id.eq.${me!.id},blocked_id.eq.${founderId}),and(blocker_id.eq.${founderId},blocked_id.eq.${me!.id})`)
        .maybeSingle();
      return data;
    },
  });

  async function toggleBlock() {
    if (!me) return;
    if (block?.blocker_id === me.id) {
      const { error } = await supabase.from("blocks").delete().eq("id", block.id);
      if (error) return toast.error(error.message);
      toast.success("Unblocked");
    } else if (block) {
      return toast.error("This user has blocked you.");
    } else {
      const { error } = await supabase.from("blocks").insert({ blocker_id: me.id, blocked_id: founderId });
      if (error) return toast.error(error.message);
      toast.success("Blocked. They can no longer message you.");
    }
    qc.invalidateQueries({ queryKey: ["block", me.id, founderId] });
    qc.invalidateQueries({ queryKey: ["discover-feed"] });
    qc.invalidateQueries({ queryKey: ["inbox-convos"] });
    qc.invalidateQueries({ queryKey: ["inbox-requests"] });
  }

  if (!ready) return null;
  if (isLoading) return <AppShell><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div></AppShell>;
  if (!data) return <AppShell><div className="mx-auto max-w-2xl px-4 py-12 text-center">Founder not found.</div></AppShell>;

  const name = data.profiles?.full_name ?? data.seed_name ?? "Founder";
  const prompts = (data.founder_prompts ?? []).sort((a: { display_order: number | null }, b: { display_order: number | null }) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const rawAssessment = Array.isArray(data.assessments) ? data.assessments[0] : data.assessments;
  // Founders can keep their compatibility results private.
  const assessmentPublic = (data as { assessment_public?: boolean | null }).assessment_public !== false;
  const a = assessmentPublic ? rawAssessment : null;
  const dims = a ? [
    ["Openness", a.openness_score], ["Conscientiousness", a.conscientiousness_score],
    ["Extraversion", a.extraversion_score], ["Agreeableness", a.agreeableness_score],
    ["Neuroticism", a.neuroticism_score], ["Risk appetite", a.risk_score],
    ["Decision velocity", a.decision_velocity_score], ["Equity philosophy", a.equity_philosophy_score],
    ["Vision scale", a.vision_score],
  ] as [string, number | null][] : [];

  const isMe = me?.id === data.id;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/discover" className="inline-flex items-center gap-1 text-xs font-black text-muted-text hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <div className="mt-4 rounded-3xl border-2 border-ink bg-white shadow-brutal">
          {/* Flat brutal header */}
          <div className="border-b-2 border-ink p-6">
            <div className="flex items-start gap-4">
              <img src={founderAvatar({ seed_avatar: data.seed_avatar, seed_name: data.seed_name, profile: data.profiles })}
                className="h-20 w-20 rounded-2xl border-2 border-ink object-cover shadow-brutal-sm" alt="" />
              <div className="flex-1">
                <div className="text-2xl font-black text-ink">{name}</div>
                <div className="mt-1 text-sm font-semibold text-ink/80">{data.headline}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/70">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.location}</span>
                  {data.age && <span className="inline-flex items-center gap-1">🎂 {data.age}</span>}
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {data.years_experience}y</span>
                </div>
              </div>
              <TierBadge tier={data.trust_tier ?? "Builder"} />
            </div>
            {!isMe && me && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!block && (
                  <button onClick={() => setConnectOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-orange px-4 py-2 text-xs font-black text-white shadow-brutal-sm box-hover">
                    <Send className="h-3 w-3" /> Send message
                  </button>
                )}
                {block?.blocker_id === me.id && (
                  <button onClick={toggleBlock}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-sage px-4 py-2 text-xs font-black text-ink shadow-brutal-sm box-hover">
                    <ShieldCheck className="h-3 w-3" /> Unblock
                  </button>
                )}
                {block?.blocked_id === me.id && block.blocker_id !== me.id && (
                  <span className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-cream px-4 py-2 text-xs font-black text-ink">
                    <Ban className="h-3 w-3" /> This user has blocked you
                  </span>
                )}
                {!block && (
                  <button onClick={toggleBlock}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-black text-ink shadow-brutal-sm box-hover">
                    <Ban className="h-3 w-3" /> Block
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6 p-6">
            <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brutal-sm">
              <div className="text-sm">{data.bio}</div>
              <div className="mt-3"><VerifiedBadges f={data as never} /></div>
              {(data.linkedin_url || data.github_url) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.linkedin_url && (
                    <a href={data.linkedin_url} target="_blank" rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-white px-2 py-1 text-[11px] font-black box-hover">
                      <Linkedin className="h-3 w-3" /> LinkedIn
                    </a>
                  )}
                  {data.github_url && (
                    <a href={data.github_url} target="_blank" rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-white px-2 py-1 text-[11px] font-black box-hover">
                      <Github className="h-3 w-3" /> GitHub
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-muted-text">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(data.skills ?? []).map((s: string) => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            </div>

            {prompts.length > 0 ? (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-text">Prompts</div>
                <div className="mt-2 space-y-2">
                  {prompts.map((p: { prompt_question: string; prompt_answer: string }) => (
                    <div key={p.prompt_question} className="rounded-xl border-2 border-ink bg-cream p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-orange">{p.prompt_question}</div>
                      <div className="mt-1 text-sm font-medium">{p.prompt_answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-text">Prompts</div>
                <div className="mt-2 rounded-xl border-2 border-ink/40 bg-cream p-3 text-sm font-bold text-muted-text">
                  No prompts added yet
                </div>
              </div>
            )}

            {!assessmentPublic && rawAssessment && (
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-ink/50 bg-cream p-3 text-xs font-bold text-muted-text">
                <EyeOff className="h-3.5 w-3.5" /> This founder keeps their compatibility results private.
              </div>
            )}
            {dims.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-text">Personality dimensions</div>
                <div className="mt-3 grid gap-2">
                  {dims.map(([label, v]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-text">{v ?? "—"}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                        <div className="h-full bg-orange transition-all" style={{ width: `${v ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {connectOpen && me && data && (
        <ConnectModal
          founder={data as never}
          myFounderId={me.id}
          onClose={() => setConnectOpen(false)}
        />
      )}
    </AppShell>
  );
}

function ConnectModal({ founder, myFounderId, onClose }: {
  founder: { id: string; seed_name?: string | null; profiles?: { full_name?: string | null } | null; founder_prompts?: { prompt_question: string; display_order: number | null }[] };
  myFounderId: string;
  onClose: () => void;
}) {
  const prompts = (founder.founder_prompts ?? []).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const [selectedPrompt, setSelectedPrompt] = useState<string>(prompts[0]?.prompt_question ?? "General");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const name = founder.profiles?.full_name ?? founder.seed_name ?? "them";

  async function send() {
    if (message.trim().length < 20) return toast.error("Add a bit more context (20+ chars).");
    setSending(true);
    const { error } = await supabase.from("connection_requests").insert({
      from_founder_id: myFounderId,
      to_founder_id: founder.id,
      prompt_question: selectedPrompt,
      message: message.trim(),
      status: "pending",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Request sent to ${name}!`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-orange">Send request</div>
            <div className="mt-1 text-xl font-black">Connect with {name}</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {prompts.length > 0 && (
          <div className="mt-5">
            <div className="text-[10px] font-black uppercase text-muted-text">Reacting to</div>
            <select value={selectedPrompt} onChange={(e) => setSelectedPrompt(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm">
              {prompts.map((p) => <option key={p.prompt_question} value={p.prompt_question}>{p.prompt_question}</option>)}
              <option value="General">General intro</option>
            </select>
          </div>
        )}
        <div className="mt-4">
          <div className="text-[10px] font-black uppercase text-muted-text">Your message</div>
          <textarea rows={5} maxLength={400} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something specific. Vague opens get ignored."
            className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          <div className="mt-1 text-right text-[10px] text-muted-text">{message.length}/400</div>
        </div>
        <button onClick={send} disabled={sending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-3 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send request
        </button>
      </div>
    </div>
  );
}
