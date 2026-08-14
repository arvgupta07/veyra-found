import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleBadge } from "@/components/RoleBadge";
import { sendConnectionRequest } from "@/lib/connect-requests";
import { useAccountType } from "@/hooks/useAccountType";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { SkillTag, VerifiedBadges } from "@/components/FounderBits";
import { MapPin, Sparkles, Send, X, Loader2, Keyboard, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { founderAvatar } from "@/lib/founder-types";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConnectedIds } from "@/hooks/useConnectedIds";
import { useMyVerification } from "@/hooks/useVerification";
import { VerifyBanner, VerifyRequiredCard } from "@/components/VerifyGate";
import { getDiscoverCursor, setDiscoverCursor } from "@/lib/discover-cursor";
import { FilterBar, type FilterValues } from "@/components/FilterPanel";


export const Route = createFileRoute("/discover")({
  component: Discover,
  head: () => ({
    meta: [
      { title: "Discover Co-Founders — Veyra Found" },
      { name: "description", content: "Browse one verified Indian founder at a time: their idea, skills, prompts and compatibility signals, then reply to the prompt that resonates." },
      { property: "og:title", content: "Discover Co-Founders — Veyra Found" },
      { property: "og:description", content: "Meet verified Indian founders one profile at a time and reply to the prompt that resonates." },
      { property: "og:url", content: "https://veyrafound.in/discover" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/discover" }],
  }),
});

function Discover() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const [connectFor, setConnectFor] = useState<string | null>(null);
  const [index, setIndex] = useState(() => getDiscoverCursor().index);
  const [skipped, setSkipped] = useState(() => getDiscoverCursor().skipped);
  const [openPrompt, setOpenPrompt] = useState<{ founderId: string; question: string } | null>(null);
  const [filters, setFilters] = useState<FilterValues>({ background: "all", stage: "all", commitment: "all", remote: "all" });
  const [q, setQ] = useState("");

  useEffect(() => {
    setDiscoverCursor({ index, skipped });
  }, [index, skipped]);


  const connectedIds = useConnectedIds(me?.id);

  const { data: allFounders, isLoading } = useQuery({
    queryKey: ["discover", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data: fs } = await supabase.from("founders")
        .select("*, founder_prompts(prompt_question, prompt_answer, display_order), profiles(full_name)")
        .eq("profile_complete", true).eq("account_type", "founder").neq("id", me!.id).limit(20);
      return fs ?? [];
    },
  });

  const founders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (allFounders ?? [])
      .filter((f) => !connectedIds.has(f.id))
      .filter((f) => filters.background === "all" || f.background === filters.background)
      .filter((f) => filters.stage === "all" || f.idea_stage === filters.stage)
      .filter((f) => filters.commitment === "all" || f.commitment === filters.commitment)
      .filter((f) => filters.remote === "all" || f.remote_pref === filters.remote)
      .filter((f) => {
        if (!needle) return true;
        const hay = [
          f.headline, f.bio, f.location, f.idea_industry,
          (f.skills ?? []).join(" "),
          (f as { profiles?: { full_name?: string | null } | null }).profiles?.full_name,
          f.seed_name,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(needle);
      });
  }, [allFounders, connectedIds, filters, q]);

  const current = founders?.[index];
  const atEnd = !!founders && founders.length > 0 && index >= founders.length;
  const allConnected = (allFounders?.length ?? 0) > 0 && founders.length === 0;


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

  // A new filter set is a new deck — start from the top of it.
  useEffect(() => {
    setIndex(0);
    setSkipped(0);
  }, [filters, q]);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <VerifyBanner />
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

        <div className="-mt-2 mb-6">
          <FilterBar
            resultCount={founders.length}
            resultNoun="founders"
            search={{ value: q, onChange: setQ, placeholder: "Search idea, skill, city…" }}
            values={filters}
            onChange={setFilters}
            groups={[
              { key: "background", label: "Background", options: [
                { v: "technical", label: "Technical" }, { v: "business", label: "Business" },
                { v: "design", label: "Design" }, { v: "other", label: "Other" },
              ] },
              { key: "stage", label: "Idea stage", options: [
                { v: "idea", label: "Idea" }, { v: "mvp", label: "MVP" },
                { v: "revenue", label: "Revenue" }, { v: "funded", label: "Funded" },
              ] },
              { key: "commitment", label: "Commitment", options: [
                { v: "full_time", label: "Full time" }, { v: "part_time", label: "Part time" },
                { v: "exploring", label: "Exploring" },
              ] },
              { key: "remote", label: "Work setup", options: [
                { v: "onsite", label: "Onsite" }, { v: "hybrid", label: "Hybrid" }, { v: "remote", label: "Remote" },
              ] },
            ]}
          />
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

        {!isLoading && (atEnd || (founders && founders.length === 0)) && (
          <div className="rounded-2xl border-2 border-ink bg-cream p-12 text-center shadow-brutal">
            <div className="text-lg font-black">
              {allConnected ? "You're connected with everyone" : atEnd ? "You've seen everyone" : "No founders to show yet"}
            </div>
            <div className="mt-1 text-sm text-muted-text">
              {allConnected
                ? "Every founder on Veyra right now is already in your inbox. New founders join weekly."
                : atEnd
                  ? `Skipped ${skipped}. New founders join weekly.`
                  : "Veyra is brand new — invite a founder or check back soon."}
            </div>
            {atEnd && founders.length > 0 && (
              <button
                onClick={() => { setIndex(0); setSkipped(0); }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-orange px-4 py-2 text-xs font-black text-white shadow-brutal-sm box-hover"
              >
                Start over
              </button>
            )}
            <Link
              to="/inbox"
              className="mt-4 ml-2 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-black text-ink shadow-brutal-sm box-hover"
            >
              Go to DMs
            </Link>
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
    <article className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-brutal">
      {/* Hero band */}
      <div className="relative bg-ink px-5 pt-5 pb-14 text-cream">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge type={founder.account_type ?? "founder"} size="xs" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cream/70">{founder.trust_tier ?? "Builder"}</span>
          </div>
          <div className="rounded-md border-2 border-cream bg-orange px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            {commitmentLabel}
          </div>
        </div>
        <div className="mt-3 text-3xl font-black leading-tight tracking-tight">
          <Link to="/profile/$founderId" params={{ founderId: founder.id }} className="hover:text-orange">{name}</Link>
        </div>
        {founder.headline && <div className="mt-1 text-sm font-semibold text-cream/85">{founder.headline}</div>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {founder.location && (
            <span className="inline-flex items-center gap-1 rounded-md border-2 border-cream bg-ink/40 px-2 py-0.5">
              <MapPin className="h-3 w-3" /> {founder.location}
            </span>
          )}
          {founder.age && <span className="rounded-md border-2 border-cream bg-ink/40 px-2 py-0.5">🎂 {founder.age}</span>}
          <span className="rounded-md border-2 border-cream bg-ink/40 px-2 py-0.5">{founder.years_experience}y exp</span>
          {stageLabel && <span className="rounded-md border-2 border-cream bg-sage px-2 py-0.5 text-ink">{stageLabel}</span>}
        </div>
      </div>

      {/* Avatar tab straddling hero */}
      <div className="relative -mt-10 px-5">
        <Link to="/profile/$founderId" params={{ founderId: founder.id }} className="inline-block">
          <img src={avatar} alt={name}
            className="h-20 w-20 rounded-2xl border-2 border-ink bg-white object-cover shadow-brutal transition hover:-translate-x-0.5 hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="space-y-5 p-5 pt-4">
        {founder.bio && <p className="text-sm leading-relaxed text-ink/85">{founder.bio}</p>}
        <VerifiedBadges f={founder} />
        {(founder.skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(founder.skills ?? []).slice(0, 10).map((s: string) => <SkillTag key={s}>{s}</SkillTag>)}
          </div>
        )}

        {founder.has_idea && founder.idea_description && (
          <div className="rounded-xl border-2 border-ink bg-sage p-4">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-ink">The idea</h2>
            <div className="mt-1 text-sm font-semibold text-ink">{founder.idea_description}</div>
            {founder.idea_industry && <div className="mt-1 text-xs text-ink/70">{founder.idea_industry}</div>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs">
          <Fact label="Equity" value={founder.equity_offer ?? "—"} />
          <Fact label="Exit" value={{ lifestyle: "Lifestyle", acquisition: "Acquisition", ipo: "IPO" }[founder.exit_vision as string] ?? "—"} />
          <Fact label="Tier" value={founder.trust_tier ?? "Builder"} />
        </div>

        <div className="space-y-3">
          {prompts.length > 0 ? (
            prompts.map((p: any) => (
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
            ))
          ) : (
            <div className="rounded-2xl border-2 border-ink/40 bg-cream p-4 text-center text-sm font-bold text-muted-text">
              No prompts added yet
            </div>
          )}
        </div>

        <button onClick={onConnect} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink py-3 text-sm font-black text-white shadow-brutal-sm box-hover">
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
  const { verified } = useMyVerification();
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
    const { error } = await sendConnectionRequest({
      fromFounderId: myFounderId,
      toFounderId: toFounderId,
      promptQuestion: question,
      message: reply.trim(),
    });
    setSending(false);
    if (error) return toast.error(error);
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
      ) : !verified ? (
        <div className="mt-3"><VerifyRequiredCard action="reply to prompts" /></div>
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
  const { verified } = useMyVerification();
  const { accountType } = useAccountType();
  const isFounderAccount = accountType === "founder";
  const limit = isFounderAccount ? 400 : 300;

  async function send() {
    if (message.trim().length < 20) return toast.error("Add a bit more context (20+ chars).");
    setSending(true);
    const { error } = await sendConnectionRequest({
      fromFounderId: myFounderId,
      toFounderId: founder.id,
      promptQuestion: isFounderAccount ? selectedPrompt : "Direct note",
      message: message.trim(),
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Request sent to ${name}!`);
    onClose();
  }

  if (!verified) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-ink/70 p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md"><VerifyRequiredCard /></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border-[3px] border-ink bg-white p-6 shadow-brutal-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange">Send request</div>
            <div className="mt-1 text-2xl font-black tracking-tight">Connect with {name}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center border-2 border-ink bg-cream box-hover"><X className="h-4 w-4" /></button>
        </div>
        {isFounderAccount && (
        <div className="mt-5">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-text">Reacting to</div>
          <PromptDropdown
            value={selectedPrompt}
            onChange={setSelectedPrompt}
            options={[
              ...prompts.map((p: any) => ({ value: p.prompt_question, label: p.prompt_question })),
              { value: "General", label: "General intro" },
            ]}
          />
        </div>
        )}
        <div className="mt-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-text">
            {isFounderAccount ? "Your message" : "Your note"}
          </div>
          <textarea rows={5} maxLength={limit} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something specific about what resonates. Vague opens get ignored."
            className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-brutal-sm" />
          <div className="mt-1 text-right text-[10px] font-semibold text-muted-text">{message.length}/{limit}</div>
        </div>
        <button onClick={send} disabled={sending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-3 text-sm font-black uppercase text-white shadow-brutal-sm box-hover disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send request
        </button>
      </div>
    </div>
  );
}

function PromptDropdown({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-ink bg-cream px-3 py-2.5 text-left text-sm font-bold text-ink shadow-brutal-sm box-hover"
      >
        <span className="truncate">{current?.label ?? "Pick a prompt"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-lg border-2 border-ink bg-white shadow-brutal animate-pop-in">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 border-b-2 border-ink/10 px-3 py-2.5 text-left text-sm font-semibold last:border-b-0 ${active ? "bg-orange text-white" : "bg-white hover:bg-cream"}`}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

