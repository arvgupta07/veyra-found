import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useMyProfile } from "@/hooks/useMyFounder";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card, Chip, Empty, Field, PageHeader, Pill, TabBar, inputCls } from "@/components/MarketBits";
import {
  REMOTE_PREFS, TALENT_SKILLS, WORK_TYPES, initialsAvatar, labelOf, normalizeUrl, toggleIn,
} from "@/lib/marketplace";
import { GraduationCap, Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

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
              {list.map((p) => <TalentCard key={p.id} p={p} isMe={p.user_id === user?.id} />)}
            </div>
          </>
        )}

        {tab === "profile" && (
          <TalentForm mine={mine} userId={user?.id} defaultName={(profile as { full_name?: string } | null)?.full_name ?? ""}
            onSaved={() => qc.invalidateQueries({ queryKey: ["talent"] })} />
        )}
      </div>
    </AppShell>
  );
}

function TalentCard({ p, isMe }: { p: Talent; isMe: boolean }) {
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
          <Field label="Location"><input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Pune" /></Field>
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
          <Field label="Years of experience"><input type="number" min={0} className={inputCls} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })} /></Field>
          <Field label="When can you start"><input className={inputCls} value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} placeholder="Immediately / from June" /></Field>
          <label className="mt-6 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={f.open_to_equity} onChange={(e) => setF({ ...f, open_to_equity: e.target.checked })} className="h-4 w-4 border-2 border-ink" />
            Open to equity-heavy offers
          </label>
        </div>
        <div className="mt-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">Skills</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TALENT_SKILLS.map((s) => (
              <Chip key={s} active={f.skills.includes(s)} onClick={() => setF({ ...f, skills: toggleIn(f.skills, s) })}>{s}</Chip>
            ))}
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
