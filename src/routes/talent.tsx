import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card, Chip, Empty, Field, PageHeader, Pill, TabBar, inputCls } from "@/components/MarketBits";
import {
  EXPERIENCE_BUCKETS, REMOTE_PREFS, TALENT_SKILLS, WORK_TYPES, initialsAvatar, labelOf, normalizeUrl, toggleIn,
} from "@/lib/marketplace";
import { GraduationCap, Loader2, MapPin, Save, Send, User, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { sendConnectionRequest } from "@/lib/connect-requests";
import { toast } from "sonner";
import { LocationInput } from "@/components/LocationInput";

export const Route = createFileRoute("/talent")({
  component: TalentPage,
  head: () => ({
    meta: [
      { title: "Talent & Interns — Veyra Found" },
      { name: "description", content: "Browse operators, engineers, designers and interns who want to join early Indian startups — skills, availability and links in one place." },
      { property: "og:title", content: "Talent & Interns — Veyra Found" },
      { property: "og:description", content: "Early-startup talent in India: engineers, designers, growth folks and interns ready to join." },
      { property: "og:url", content: "https://veyrafound.in/talent" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/talent" }],
  }),
});

type Tab = "browse" | "profile";

type Talent = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  desired_role: string | null;
  work_type: string;
  experience_years: number;
  location: string | null;
  remote_pref: string;
  linkedin_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  availability: string | null;
  open_to_equity: boolean;
  is_public: boolean;
};

function TalentPage() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { user } = useSession();
  const { data: profile } = useMyProfile();
  const { data: meFounder } = useMyFounder();
  const [noteTo, setNoteTo] = useState<{ founderId: string; name: string } | null>(null);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("browse");
  const [work, setWork] = useState("all");
  const [skill, setSkill] = useState("all");
  const [q, setQ] = useState("");

  const { data: people } = useQuery({
    queryKey: ["talent"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("talent_profiles").select("*")
        .order("updated_at", { ascending: false }).limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as Talent[];
    },
  });

  // Member rows for talent/intern accounts, so their profiles are openable and
  // they can send each other a note.
  const { data: founderRows } = useQuery({
    queryKey: ["talent-member-rows"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("founders").select("id, user_id")
        .in("account_type", ["talent", "intern"]).limit(500);
      return data ?? [];
    },
  });
  const founderIdByUser = useMemo(() => {
    const m = new Map<string, string>();
    (founderRows ?? []).forEach((r) => { if (r.user_id) m.set(r.user_id, r.id); });
    return m;
  }, [founderRows]);

  const mine = useMemo(() => (people ?? []).find((p) => p.user_id === user?.id) ?? null, [people, user?.id]);

  const list = useMemo(() => (people ?? [])
    .filter((p) => p.is_public || p.user_id === user?.id)
    .filter((p) => work === "all" || p.work_type === work)
    .filter((p) => skill === "all" || p.skills.includes(skill))
    .filter((p) => {
      if (!q.trim()) return true;
      const hay = `${p.full_name ?? ""} ${p.headline ?? ""} ${p.bio ?? ""} ${p.skills.join(" ")}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    }), [people, work, skill, q, user?.id]);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <PageHeader
          title="Talent & interns"
          subtitle="People who want to join an early startup — engineers, designers, growth folks and interns. Founders: reach out from here."
          action={
            <button onClick={() => setTab("profile")}
              className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
              <GraduationCap className="h-4 w-4" /> {mine ? "Edit my talent profile" : "I want to join a startup"}
            </button>
          }
        />

        <TabBar<Tab> value={tab} onChange={setTab} tabs={[
          { v: "browse", label: "Browse talent", count: list.length },
          { v: "profile", label: "My talent profile" },
        ]} />

        {tab === "browse" && (
          <>
            <div className="mt-5 space-y-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, skill or headline…"
                className="w-full border-2 border-ink bg-white px-3 py-2.5 text-sm font-medium outline-none soft-corners focus:shadow-brutal-sm" />
              <div className="flex flex-wrap gap-2">
                <Chip active={work === "all"} onClick={() => setWork("all")}>All availability</Chip>
                {WORK_TYPES.map((t) => <Chip key={t.v} active={work === t.v} onClick={() => setWork(t.v)}>{t.label}</Chip>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={skill === "all"} onClick={() => setSkill("all")}>All skills</Chip>
                {TALENT_SKILLS.map((t) => <Chip key={t} active={skill === t} onClick={() => setSkill(t)}>{t}</Chip>)}
              </div>
            </div>

            {list.length === 0 && <Empty>No one matches this filter yet.</Empty>}
            <div className="mt-5 grid gap-3">
              {list.map((p) => (
                <TalentCard key={p.id} p={p} isMe={p.user_id === user?.id}
                  founderId={founderIdByUser.get(p.user_id) ?? null}
                  canConnect={!!meFounder?.id}
                  onConnect={(fid) => setNoteTo({ founderId: fid, name: p.full_name || "them" })} />
              ))}
            </div>
          </>
        )}

        {tab === "profile" && (
          <TalentForm mine={mine} userId={user?.id} defaultName={(profile as { full_name?: string } | null)?.full_name ?? ""}
            onSaved={() => qc.invalidateQueries({ queryKey: ["talent"] })} />
        )}
      </div>
      {noteTo && meFounder?.id && (
        <NoteModal toFounderId={noteTo.founderId} name={noteTo.name} fromFounderId={meFounder.id}
          onClose={() => setNoteTo(null)} />
      )}
    </AppShell>
  );
}

function NoteModal({ toFounderId, fromFounderId, name, onClose }: {
  toFounderId: string; fromFounderId: string; name: string; onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function send() {
    if (message.trim().length < 20) return toast.error("Add a bit more context (20+ chars).");
    setSending(true);
    const { error } = await sendConnectionRequest({
      fromFounderId, toFounderId, promptQuestion: "Direct note", message: message.trim(),
    });
    setSending(false);
    if (error) return toast.error(error);
    toast.success(`Note sent to ${name}!`);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg border-[3px] border-ink bg-white p-6 shadow-brutal-lg soft-corners">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange">Send a note</div>
            <div className="mt-1 text-2xl font-black tracking-tight">Reach out to {name}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center border-2 border-ink bg-cream box-hover"><X className="h-4 w-4" /></button>
        </div>
        <textarea rows={5} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="What you'd like to work on together, and why them."
          className="mt-4 w-full border-2 border-ink bg-white px-3 py-2 text-sm outline-none soft-corners focus:shadow-brutal-sm" />
        <div className="mt-1 text-right text-[10px] font-bold text-muted-text">{message.length}/300</div>
        <button onClick={send} disabled={sending}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-orange px-4 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners disabled:opacity-60">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send note
        </button>
      </div>
    </div>
  );
}

function TalentCard({ p, isMe, founderId, canConnect, onConnect }: {
  p: Talent; isMe: boolean; founderId?: string | null; canConnect?: boolean; onConnect?: (founderId: string) => void;
}) {
  const name = p.full_name || "Candidate";
  return (
    <Card>
      <div className="flex items-start gap-4">
        <img src={p.avatar_url || initialsAvatar(name)} alt={name}
          className="h-14 w-14 shrink-0 border-2 border-ink object-cover soft-corners" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black">{name}</h3>
            <Pill tone="bg-orange text-white">{labelOf(WORK_TYPES, p.work_type)}</Pill>
            {isMe && <Pill tone="bg-cream">You</Pill>}
          </div>
          {p.headline && <p className="mt-0.5 text-sm text-muted-text">{p.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-text">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location || "India"}</span>
            <span>{labelOf(REMOTE_PREFS, p.remote_pref)}</span>
            <span>{p.experience_years} yr{p.experience_years === 1 ? "" : "s"} exp</span>
            {p.open_to_equity && <span>Open to equity</span>}
            {p.availability && <span>{p.availability}</span>}
          </div>
          {p.bio && <p className="mt-2 line-clamp-3 text-sm">{p.bio}</p>}
          {p.desired_role && <p className="mt-2 text-sm"><span className="font-black">Wants: </span>{p.desired_role}</p>}
          {p.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">{p.skills.slice(0, 8).map((s) => <Pill key={s} tone="bg-white">{s}</Pill>)}</div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {p.linkedin_url && <a className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover" href={normalizeUrl(p.linkedin_url)!} target="_blank" rel="noreferrer">LinkedIn</a>}
            {p.portfolio_url && <a className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover" href={normalizeUrl(p.portfolio_url)!} target="_blank" rel="noreferrer">Portfolio</a>}
            {p.resume_url && <a className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover" href={normalizeUrl(p.resume_url)!} target="_blank" rel="noreferrer">Resume</a>}
            {founderId && (
              <Link to="/profile/$founderId" params={{ founderId }}
                className="inline-flex items-center gap-1 border-2 border-ink bg-cream px-3 py-1.5 text-xs font-black soft-corners box-hover">
                <User className="h-3.5 w-3.5" /> View profile
              </Link>
            )}
            {founderId && !isMe && canConnect && (
              <button onClick={() => onConnect?.(founderId)}
                className="inline-flex items-center gap-1 border-2 border-ink bg-orange px-3 py-1.5 text-xs font-black text-white soft-corners shadow-brutal-sm box-hover">
                <Send className="h-3.5 w-3.5" /> Send note
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TalentForm({ mine, userId, defaultName, onSaved }: {
  mine: Talent | null; userId?: string; defaultName: string; onSaved: () => void;
}) {
  const [f, setF] = useState(() => ({
    full_name: mine?.full_name ?? defaultName,
    headline: mine?.headline ?? "",
    bio: mine?.bio ?? "",
    desired_role: mine?.desired_role ?? "",
    work_type: mine?.work_type ?? "internship",
    experience_years: String(mine?.experience_years ?? 0),
    location: mine?.location ?? "",
    remote_pref: mine?.remote_pref ?? "remote",
    linkedin_url: mine?.linkedin_url ?? "",
    portfolio_url: mine?.portfolio_url ?? "",
    resume_url: mine?.resume_url ?? "",
    availability: mine?.availability ?? "",
    open_to_equity: mine?.open_to_equity ?? false,
    is_public: mine?.is_public ?? true,
    skills: mine?.skills ?? [],
  }));

  const [extraSkill, setExtraSkill] = useState("");
  function addExtraSkill() {
    const v = extraSkill.trim();
    if (!v) return;
    if (!f.skills.some((s) => s.toLowerCase() === v.toLowerCase())) setF((x) => ({ ...x, skills: [...x.skills, v] }));
    setExtraSkill("");
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in first");
      if (!f.full_name.trim()) throw new Error("Add your name");
      if (f.headline.trim().length < 8) throw new Error("Add a short headline");
      if (f.bio.trim().length < 30) throw new Error("Write at least 30 characters about yourself");
      if (f.skills.length === 0) throw new Error("Pick at least one skill");
      if (!f.linkedin_url.trim()) throw new Error("LinkedIn is required so founders can verify you");
      const payload = {
        user_id: userId,
        full_name: f.full_name.trim(),
        headline: f.headline.trim(),
        bio: f.bio.trim(),
        desired_role: f.desired_role.trim() || null,
        work_type: f.work_type,
        experience_years: Number(f.experience_years) || 0,
        location: f.location.trim() || null,
        remote_pref: f.remote_pref,
        linkedin_url: normalizeUrl(f.linkedin_url),
        portfolio_url: normalizeUrl(f.portfolio_url),
        resume_url: normalizeUrl(f.resume_url),
        availability: f.availability.trim() || null,
        open_to_equity: f.open_to_equity,
        is_public: f.is_public,
        skills: f.skills,
      };
      const q = mine
        ? supabase.from("talent_profiles").update(payload as never).eq("id", mine.id)
        : supabase.from("talent_profiles").insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Talent profile saved"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">About you</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Full name"><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Location"><LocationInput value={f.location} onChange={(v) => setF({ ...f, location: v })} placeholder="Pune" /></Field>
          <div className="md:col-span-2">
            <Field label="Headline"><input className={inputCls} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="3rd-year CS student shipping React products" /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="About" hint={`${f.bio.trim().length}/30 minimum`}>
              <textarea rows={4} className={inputCls} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })}
                placeholder="What you've built, what you want to learn, what kind of team you thrive in." />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">What you're looking for</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Availability type">
            <select className={inputCls} value={f.work_type} onChange={(e) => setF({ ...f, work_type: e.target.value })}>
              {WORK_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Work setup">
            <select className={inputCls} value={f.remote_pref} onChange={(e) => setF({ ...f, remote_pref: e.target.value })}>
              {REMOTE_PREFS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Desired role"><input className={inputCls} value={f.desired_role} onChange={(e) => setF({ ...f, desired_role: e.target.value })} placeholder="Frontend intern / growth associate" /></Field>
          <Field label="Experience">
            <select className={inputCls} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })}>
              {EXPERIENCE_BUCKETS.map((b) => <option key={b.v} value={String(b.v)}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="When can you start"><input className={inputCls} value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} placeholder="Immediately / from June" /></Field>
          <label className="mt-6 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={f.open_to_equity} onChange={(e) => setF({ ...f, open_to_equity: e.target.checked })} className="h-4 w-4 border-2 border-ink" />
            Open to equity-heavy offers
          </label>
        </div>
        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">Skills</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...TALENT_SKILLS, ...f.skills.filter((s) => !TALENT_SKILLS.includes(s as never))].map((s) => (
              <Chip key={s} active={f.skills.includes(s)} onClick={() => setF({ ...f, skills: toggleIn(f.skills, s) })}>{s}</Chip>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className={inputCls} value={extraSkill} placeholder="Add your own skill"
              onChange={(e) => setExtraSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraSkill(); } }} />
            <button type="button" onClick={addExtraSkill}
              className="mt-1 shrink-0 border-2 border-ink bg-ink px-4 text-xs font-black uppercase text-white shadow-brutal-sm box-hover soft-corners">Add</button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-black uppercase tracking-wider">Links & visibility</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="LinkedIn (required)"><input className={inputCls} value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} placeholder="linkedin.com/in/…" /></Field>
          <Field label="Portfolio / GitHub"><input className={inputCls} value={f.portfolio_url} onChange={(e) => setF({ ...f, portfolio_url: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field label="Resume link"><input className={inputCls} value={f.resume_url} onChange={(e) => setF({ ...f, resume_url: e.target.value })} placeholder="drive.google.com/…" /></Field>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} className="h-4 w-4 border-2 border-ink" />
          Show me in the talent directory
        </label>
      </Card>

      <button onClick={() => save.mutate()} disabled={save.isPending}
        className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save talent profile
      </button>
    </div>
  );
}
