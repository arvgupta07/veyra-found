import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { MapPin, Sparkles, Send, X, Loader2, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { founderAvatar } from "@/lib/founder-types";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export const Route = createFileRoute("/discover")({
  component: Discover,
});

function Discover() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const [connectFor, setConnectFor] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [openPrompt, setOpenPrompt] = useState<{ founderId: string; question: string } | null>(null);

  const { data: founders, isLoading } = useQuery({
    queryKey: ["discover", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data: fs } = await supabase.from("founders")
        .select("*, founder_prompts(prompt_question, prompt_answer, display_order), profiles(full_name)")
        .eq("profile_complete", true).neq("id", me!.id).limit(20);
      return fs ?? [];
    },
  });

  const current = founders?.[index];
  const atEnd = !!founders && founders.length > 0 && index >= founders.length;

  function advance() {
    setSkipped((s) => s + 1);
    setIndex((i) => i + 1);
    setOpenPrompt(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (!atEnd && current) advance();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!atEnd && current) {
          const first = current.founder_prompts?.[0];
          if (first) setOpenPrompt({ founderId: current.id, question: first.prompt_question });
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, atEnd]);

  useEffect(() => {
    setOpenPrompt(null);
  }, [index]);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Discover</h1>
            <p className="text-sm text-muted-text">Take your time. Skip when you're ready for the next founder.</p>
          </div>
          {founders && founders.length > 0 && !atEnd && (
            <div className="rounded-lg border-2 border-ink bg-cream px-3 py-1 text-xs font-black shadow-brutal-sm">
              {index + 1} / {founders.length}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid place-items-center py-24 text-muted-text"><Loader2 className="h-6 w-6 animate-spin" /></div>
        )}

        {current && (
          <div className="space-y-4">
            <FounderCard
              key={current.id}
              founder={{ ...current, __me: me?.id }}
              onConnect={() => setConnectFor(current.id)}
              openPrompt={openPrompt}
              onOpenPrompt={(q) => setOpenPrompt({ founderId: current.id, question: q })}
              onClosePrompt={() => setOpenPrompt(null)}
            />
            <button
              onClick={advance}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white py-3 text-sm font-black text-ink shadow-brutal box-hover"
            >
              Skip <X className="h-4 w-4" /> Next founder
            </button>
            <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider text-muted-text">
              <span className="inline-flex items-center gap-1 rounded-md border border-ink bg-cream px-2 py-1"><Keyboard className="h-3 w-3" /> S</span>
              <span>Skip</span>
              <span className="text-muted-text/50">·</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-ink bg-cream px-2 py-1">Enter</span>
              <span>Open reply</span>
            </div>
          </div>
        )}

        {(atEnd || (founders && founders.length === 0)) && (
          <div className="rounded-2xl border-2 border-ink bg-cream p-12 text-center shadow-brutal">
            <div className="text-lg font-black">You've seen everyone</div>
            <div className="mt-1 text-sm text-muted-text">
              {atEnd ? `Skipped ${skipped}. ` : ""}New founders join weekly.
            </div>
            {atEnd && (
              <button
                onClick={() => { setIndex(0); setSkipped(0); }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-orange px-4 py-2 text-xs font-black text-white shadow-brutal-sm box-hover"
              >
                Start over
              </button>
            )}
          </div>
        )}

        {connectFor && me && current && (
          <ConnectModal founder={current} myFounderId={me.id} onClose={() => setConnectFor(null)} />
        )}
      </div>
    </AppShell>
  );
}

type F = Awaited<ReturnType<typeof supabase.from>> extends never ? never : any;

function FounderCard({
  founder,
  onConnect,
  openPrompt,
  onOpenPrompt,
  onClosePrompt,
}: {
  founder: any;
  onConnect: () => void;
  openPrompt: { founderId: string; question: string } | null;
  onOpenPrompt: (question: string) => void;
  onClosePrompt: () => void;
}) {
  const name = founder.profiles?.full_name ?? founder.seed_name ?? "Founder";
  const prompts = (founder.founder_prompts ?? []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const avatar = founderAvatar({ seed_avatar: founder.seed_avatar, seed_name: founder.seed_name, profile: founder.profiles });
  const commitmentLabel = { full_time: "Full-time", part_time: "Part-time", exploring: "Exploring" }[founder.commitment as string] ?? "—";
  const stageLabel = { idea: "Idea", mvp: "MVP", revenue: "Revenue", funded: "Funded" }[founder.idea_stage as string] ?? "";

  return (
    <article className="overflow-hidden rounded-3xl border bg-white shadow-card">
      <div className="relative h-40 bg-hero-radial">
        <div className="absolute left-6 top-6 flex items-center gap-3">
          <img src={avatar} alt={name} className="h-16 w-16 rounded-2xl border-2 border-white/20 object-cover" />
          <div>
            <div className="text-lg font-bold text-white">{name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-white/70">
              <MapPin className="h-3 w-3" /> {founder.location} · {founder.years_experience}y
            </div>
          </div>
          <div className="ml-auto"><TierBadge tier={founder.trust_tier ?? "Builder"} /></div>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div>
          <div className="text-sm font-semibold text-foreground">{founder.headline}</div>
          <p className="mt-1 text-sm text-muted-text">{founder.bio}</p>
        </div>
        <VerifiedBadges f={founder} />
        <div className="flex flex-wrap gap-1.5">
          {(founder.skills ?? []).slice(0, 8).map((s: string) => <SkillTag key={s}>{s}</SkillTag>)}
        </div>
        <div className="flex flex-wrap gap-4 rounded-xl bg-surface p-4 text-xs">
          <Fact label="Commitment" value={commitmentLabel} />
          <Fact label="Stage" value={stageLabel} />
          <Fact label="Equity offer" value={founder.equity_offer ?? "—"} />
          <Fact label="Exit" value={{ lifestyle: "Lifestyle", acquisition: "Acquisition", ipo: "IPO" }[founder.exit_vision as string] ?? "—"} />
        </div>

        {founder.has_idea && founder.idea_description && (
          <div className="rounded-xl border-l-4 border-indigo bg-indigo/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo">The idea</div>
            <div className="mt-1 text-sm font-medium">{founder.idea_description}</div>
            {founder.idea_industry && <div className="mt-1 text-xs text-muted-text">{founder.idea_industry}</div>}
          </div>
        )}

        <div className="space-y-3">
          {prompts.map((p: any) => (
            <PromptCard
              key={p.prompt_question}
              question={p.prompt_question}
              answer={p.prompt_answer}
              myFounderId={/* injected via closure */ (founder as any).__me}
              toFounderId={founder.id}
              toName={name}
              isOpen={openPrompt?.founderId === founder.id && openPrompt?.question === p.prompt_question}
              onOpen={() => onOpenPrompt(p.prompt_question)}
              onClose={onClosePrompt}
            />
          ))}
        </div>

        <button onClick={onConnect} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light">
          <Send className="h-4 w-4" /> Send a general intro instead
        </button>
      </div>
    </article>
  );
}

function PromptCard({
  question,
  answer,
  myFounderId,
  toFounderId,
  toName,
  isOpen,
  onOpen,
  onClose,
}: {
  question: string;
  answer: string;
  myFounderId?: string;
  toFounderId: string;
  toName: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(isOpen);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  async function send() {
    if (!myFounderId) return toast.error("Loading your profile…");
    if (reply.trim().length < 20) return toast.error("Add a bit more context (20+ chars).");
    setSending(true);
    const { error } = await supabase.from("connection_requests").insert({
      from_founder_id: myFounderId,
      to_founder_id: toFounderId,
      prompt_question: question,
      message: reply.trim(),
      status: "pending",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Request sent to ${toName}!`);
    setReply("");
    setOpen(false);
    onClose();
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brutal-sm">
      <div className="text-[11px] font-black uppercase tracking-wider text-orange">{question}</div>
      <div className="mt-1 text-sm font-medium text-ink">{answer}</div>

      {!open ? (
        <button
          onClick={() => { setOpen(true); onOpen(); }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-brutal-sm box-hover"
        >
          <Sparkles className="h-3 w-3" /> Reply to this prompt
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            ref={textareaRef}
            rows={3}
            maxLength={400}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            autoFocus
            placeholder={`Reply to "${question}"… be specific.`}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:ring-0"
          />
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold text-muted-text">{reply.length}/400</div>
            <div className="flex gap-2">
              <button onClick={() => { setOpen(false); setReply(""); onClose(); }} className="rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold">Cancel</button>
              <button
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-orange px-3 py-1.5 text-xs font-black text-white shadow-brutal-sm disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[80px]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-text">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function ConnectModal({ founder, myFounderId, onClose }: { founder: any; myFounderId: string; onClose: () => void }) {
  const prompts = (founder.founder_prompts ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
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
    <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo">Send request</div>
            <div className="mt-1 text-xl font-bold">Connect with {name}</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-text" /></button>
        </div>
        <div className="mt-5">
          <div className="text-xs font-semibold text-muted-text">Reacting to</div>
          <select value={selectedPrompt} onChange={(e) => setSelectedPrompt(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
            {prompts.map((p: any) => <option key={p.prompt_question} value={p.prompt_question}>{p.prompt_question}</option>)}
            <option value="General">General intro</option>
          </select>
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-text">Your message</div>
          <textarea rows={5} maxLength={400} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something specific about what resonates. Vague opens get ignored."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          <div className="mt-1 text-right text-[10px] text-muted-text">{message.length}/400</div>
        </div>
        <button onClick={send} disabled={sending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-3 text-sm font-semibold text-white disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send request
        </button>
      </div>
    </div>
  );
}
