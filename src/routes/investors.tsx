import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card, Chip, Empty, Field, Modal, PageHeader, Pill, TabBar, inputCls } from "@/components/MarketBits";
import {
  INDUSTRIES, INVEST_STAGES, checkRange, initialsAvatar, normalizeUrl, toggleIn,
} from "@/lib/marketplace";
import { Banknote, Building2, Globe, Linkedin, Loader2, MapPin, Send, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LocationInput } from "@/components/LocationInput";

export const Route = createFileRoute("/investors")({
  component: InvestorsPage,
  head: () => ({
    meta: [
      { title: "Investors — Veyra Found" },
      { name: "description", content: "Browse angels and early-stage funds backing Indian founders, see cheque sizes and thesis, and pitch them directly on Veyra Found." },
      { property: "og:title", content: "Investors — Veyra Found" },
      { property: "og:description", content: "Angels and early-stage funds for Indian startups, with cheque sizes, stages and direct pitching." },
      { property: "og:url", content: "https://veyrafound.in/investors" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/investors" }],
  }),
});

type Tab = "browse" | "profile" | "pitches";

type Investor = {
  id: string;
  user_id: string | null;
  fund_name: string | null;
  headline: string | null;
  bio: string | null;
  thesis: string | null;
  location: string | null;
  industries: string[] | null;
  stages: string[] | null;
  check_size_min: number | null;
  check_size_max: number | null;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  is_public: boolean;
  verified: boolean | null;
  profiles?: { full_name: string | null } | null;
};

function InvestorsPage() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { user } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("browse");
  const [stage, setStage] = useState<string>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [pitchTo, setPitchTo] = useState<Investor | null>(null);

  const { data: investors } = useQuery({
    queryKey: ["investors"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("investor_profiles")
        .select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Investor[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["my-investor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("investor_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return (data ?? null) as unknown as Investor | null;
    },
  });

  const { data: pitches } = useQuery({
    queryKey: ["pitches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("investor_pitches")
        .select("*, investor_profiles(id, fund_name, user_id, profiles(full_name))")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const sentIds = useMemo(
    () => new Set((pitches ?? []).filter((p: any) => p.from_user === user?.id).map((p: any) => p.investor_profile_id)),
    [pitches, user?.id],
  );

  const list = useMemo(() => {
    return (investors ?? [])
      .filter((i) => i.is_public || i.user_id === user?.id)
      .filter((i) => stage === "all" || (i.stages ?? []).includes(stage))
      .filter((i) => industry === "all" || (i.industries ?? []).includes(industry));
  }, [investors, stage, industry, user?.id]);

  const incoming = (pitches ?? []).filter((p: any) => p.from_user !== user?.id);
  const outgoing = (pitches ?? []).filter((p: any) => p.from_user === user?.id);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <PageHeader
          title="Investors"
          subtitle="Angels and early-stage funds who back Indian founders. Filter by stage and sector, then send one focused pitch."
          action={
            <button onClick={() => setTab("profile")}
              className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
              <Sparkles className="h-4 w-4" /> {mine ? "Edit investor profile" : "I'm an investor"}
            </button>
          }
        />

        <TabBar<Tab>
          value={tab} onChange={setTab}
          tabs={[
            { v: "browse", label: "Browse", count: list.length },
            { v: "profile", label: "My investor profile" },
            { v: "pitches", label: "Pitches", count: (pitches ?? []).length },
          ]}
        />

        {tab === "browse" && (
          <>
            <div className="mt-5 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Chip active={stage === "all"} onClick={() => setStage("all")}>All stages</Chip>
                {INVEST_STAGES.map((s) => (
                  <Chip key={s} active={stage === s} onClick={() => setStage(s)}>{s}</Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={industry === "all"} onClick={() => setIndustry("all")}>All sectors</Chip>
                {INDUSTRIES.map((s) => (
                  <Chip key={s} active={industry === s} onClick={() => setIndustry(s)}>{s}</Chip>
                ))}
              </div>
            </div>

            {list.length === 0 && <Empty>No investors match this filter yet. Check back soon — or invite one you know.</Empty>}

            <div className="mt-5 grid gap-3">
              {list.map((i) => (
                <InvestorCard key={i.id} i={i} isMe={i.user_id === user?.id}
                  pitched={sentIds.has(i.id)} onPitch={() => setPitchTo(i)} />
              ))}
            </div>
          </>
        )}

        {tab === "profile" && <InvestorForm mine={mine ?? null} userId={user?.id} onSaved={() => qc.invalidateQueries()} />}

        {tab === "pitches" && (
          <div className="mt-6 space-y-6">
            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-muted-text">Pitches you received</h2>
              {incoming.length === 0 ? <Empty>No pitches yet.</Empty> : (
                <div className="mt-3 space-y-3">
                  {incoming.map((p: any) => <PitchRow key={p.id} p={p} canAct onDone={() => qc.invalidateQueries({ queryKey: ["pitches"] })} />)}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-muted-text">Pitches you sent</h2>
              {outgoing.length === 0 ? <Empty>You haven't pitched anyone yet.</Empty> : (
                <div className="mt-3 space-y-3">
                  {outgoing.map((p: any) => <PitchRow key={p.id} p={p} />)}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {pitchTo && (
        <PitchModal investor={pitchTo} userId={user?.id} onClose={() => setPitchTo(null)}
          onSent={() => { setPitchTo(null); qc.invalidateQueries({ queryKey: ["pitches"] }); }} />
      )}
    </AppShell>
  );
}

function InvestorCard({ i, isMe, pitched, onPitch }: { i: Investor; isMe: boolean; pitched: boolean; onPitch: () => void }) {
  const name = i.fund_name || i.profiles?.full_name || "Investor";
  return (
    <Card>
      <div className="flex items-start gap-4">
        <img src={i.avatar_url || initialsAvatar(name)} alt={name}
          className="h-14 w-14 shrink-0 border-2 border-ink object-cover soft-corners" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black">{name}</h3>
            {i.verified && <Pill tone="bg-sage">Verified</Pill>}
            {isMe && <Pill tone="bg-orange text-white">You</Pill>}
          </div>
          {i.headline && <p className="mt-0.5 text-sm text-muted-text">{i.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-text">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{i.location || "India"}</span>
            <span className="inline-flex items-center gap-1"><Banknote className="h-3 w-3" />{checkRange(i.check_size_min, i.check_size_max)}</span>
          </div>
          {(i.thesis || i.bio) && <p className="mt-2 line-clamp-3 text-sm">{i.thesis || i.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(i.stages ?? []).map((s) => <Pill key={s} tone="bg-cream">{s}</Pill>)}
            {(i.industries ?? []).slice(0, 6).map((s) => <Pill key={s} tone="bg-white">{s}</Pill>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {i.linkedin_url && (
              <a href={normalizeUrl(i.linkedin_url)!} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
            {i.website_url && (
              <a href={normalizeUrl(i.website_url)!} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
            {!isMe && (
              <button onClick={onPitch} disabled={pitched}
                className={`inline-flex items-center gap-1 border-2 border-ink px-3 py-1.5 text-xs font-black soft-corners ${pitched ? "bg-cream text-muted-text" : "bg-orange text-white shadow-brutal-sm box-hover"}`}>
                <Send className="h-3.5 w-3.5" /> {pitched ? "Pitch sent" : "Send pitch"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PitchModal({ investor, userId, onClose, onSent }: { investor: Investor; userId?: string; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState("");
  const [deck, setDeck] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in first");
      if (message.trim().length < 60) throw new Error("Write at least 60 characters — what you're building, traction, the ask.");
      const { error } = await supabase.from("investor_pitches").insert({
        investor_profile_id: investor.id, from_user: userId,
        message: message.trim(), deck_url: normalizeUrl(deck),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pitch sent"); onSent(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Modal title={`Pitch ${investor.fund_name || investor.profiles?.full_name || "investor"}`} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border-2 border-ink bg-white px-4 py-2 text-xs font-black uppercase tracking-wider soft-corners box-hover">Cancel</button>
          <button onClick={() => m.mutate()} disabled={m.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm soft-corners box-hover">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send pitch
          </button>
        </div>
      }>
      <div className="space-y-4">
        <Field label="Your pitch" hint={`${message.trim().length}/60 minimum · one screen, no fluff`}>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7}
            placeholder="What you're building, who it's for, traction so far, what you're raising and why this investor."
            className={inputCls} />
        </Field>
        <Field label="Deck link (optional)">
          <input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="drive.google.com/…" className={inputCls} />
        </Field>
      </div>
    </Modal>
  );
}

function PitchRow({ p, canAct, onDone }: { p: any; canAct?: boolean; onDone?: () => void }) {
  const set = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("investor_pitches").update({ status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); onDone?.(); },
    onError: (e: any) => toast.error(e.message),
  });
  const tone = p.status === "replied" ? "bg-sage" : p.status === "passed" ? "bg-red text-white" : "bg-cream";
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-black">
          <Building2 className="h-4 w-4" />
          {p.investor_profiles?.fund_name || p.investor_profiles?.profiles?.full_name || "Investor"}
        </div>
        <Pill tone={tone}>{p.status}</Pill>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{p.message}</p>
      {p.deck_url && (
        <a href={p.deck_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-black underline">Open deck</a>
      )}
      {canAct && p.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => set.mutate("replied")} className="border-2 border-ink bg-sage px-3 py-1.5 text-xs font-black soft-corners box-hover">Mark replied</button>
          <button onClick={() => set.mutate("passed")} className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">Pass</button>
        </div>
      )}
    </Card>
  );
}

function InvestorForm({ mine, userId, onSaved }: { mine: Investor | null; userId?: string; onSaved: () => void }) {
  const [f, setF] = useState(() => ({
    fund_name: mine?.fund_name ?? "",
    headline: mine?.headline ?? "",
    bio: mine?.bio ?? "",
    thesis: mine?.thesis ?? "",
    location: mine?.location ?? "",
    check_size_min: mine?.check_size_min ?? "",
    check_size_max: mine?.check_size_max ?? "",
    linkedin_url: mine?.linkedin_url ?? "",
    website_url: mine?.website_url ?? "",
    industries: mine?.industries ?? [],
    stages: mine?.stages ?? [],
    is_public: mine?.is_public ?? true,
  }));

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in first");
      if (!f.fund_name.trim()) throw new Error("Add your fund or angel name");
      if (!f.headline.trim()) throw new Error("Add a one-line headline");
      if (f.stages.length === 0) throw new Error("Pick at least one stage you invest at");
      const payload = {
        user_id: userId,
        fund_name: f.fund_name.trim(),
        headline: f.headline.trim(),
        bio: f.bio.trim() || null,
        thesis: f.thesis.trim() || null,
        location: f.location.trim() || null,
        check_size_min: f.check_size_min === "" ? null : Number(f.check_size_min),
        check_size_max: f.check_size_max === "" ? null : Number(f.check_size_max),
        linkedin_url: normalizeUrl(f.linkedin_url),
        website_url: normalizeUrl(f.website_url),
        industries: f.industries,
        stages: f.stages,
        is_public: f.is_public,
      };
      const q = mine
        ? supabase.from("investor_profiles").update(payload as never).eq("id", mine.id)
        : supabase.from("investor_profiles").insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Investor profile saved"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">Who you are</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Fund / angel name">
            <input className={inputCls} value={f.fund_name} onChange={(e) => setF({ ...f, fund_name: e.target.value })} placeholder="e.g. Anand Angels" />
          </Field>
          <Field label="Location">
            <LocationInput value={f.location} onChange={(v) => setF({ ...f, location: v })} placeholder="Bengaluru" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Headline">
              <input className={inputCls} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="Angel writing first cheques into Indian SaaS" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Investment thesis">
              <textarea rows={4} className={inputCls} value={f.thesis} onChange={(e) => setF({ ...f, thesis: e.target.value })}
                placeholder="What you look for, how you help, what a good intro looks like." />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">Cheque & focus</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Min cheque (₹)">
            <input type="number" className={inputCls} value={f.check_size_min as number | string}
              onChange={(e) => setF({ ...f, check_size_min: e.target.value as never })} placeholder="500000" />
          </Field>
          <Field label="Max cheque (₹)">
            <input type="number" className={inputCls} value={f.check_size_max as number | string}
              onChange={(e) => setF({ ...f, check_size_max: e.target.value as never })} placeholder="5000000" />
          </Field>
        </div>
        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">Stages</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVEST_STAGES.map((s) => (
              <Chip key={s} active={f.stages.includes(s)} onClick={() => setF({ ...f, stages: toggleIn(f.stages, s) })}>{s}</Chip>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">Sectors</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDUSTRIES.map((s) => (
              <Chip key={s} active={f.industries.includes(s)} onClick={() => setF({ ...f, industries: toggleIn(f.industries, s) })}>{s}</Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">Links & visibility</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="LinkedIn">
            <input className={inputCls} value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} placeholder="linkedin.com/in/…" />
          </Field>
          <Field label="Website">
            <input className={inputCls} value={f.website_url} onChange={(e) => setF({ ...f, website_url: e.target.value })} placeholder="fund.vc" />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })}
            className="h-4 w-4 border-2 border-ink" />
          Show my investor profile in the directory
        </label>
      </Card>

      <button onClick={() => save.mutate()} disabled={save.isPending}
        className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save investor profile
      </button>
    </div>
  );
}
