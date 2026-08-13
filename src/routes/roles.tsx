import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useMyFounder } from "@/hooks/useMyFounder";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card, Chip, Empty, Field, Modal, PageHeader, Pill, TabBar, inputCls } from "@/components/MarketBits";
import {
  REMOTE_PREFS, ROLE_TYPES, TALENT_SKILLS, compRange, labelOf, normalizeUrl, toggleIn,
} from "@/lib/marketplace";
import { Briefcase, Building2, Loader2, MapPin, Paperclip, Plus, Save, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { LocationInput } from "@/components/LocationInput";
import { useAccountType, useMyTalent } from "@/hooks/useAccountType";
import { isJobSeeker } from "@/lib/account-types";
import { RoleBadge } from "@/components/RoleBadge";

export const Route = createFileRoute("/roles")({
  component: RolesPage,
  head: () => ({
    meta: [
      { title: "Opportunities — Internships & Startup Jobs | Veyra Found" },
      { name: "description", content: "Join an early Indian startup: co-founder, full-time, part-time and internship roles posted by verified founders on Veyra Found." },
      { property: "og:title", content: "Open Roles & Internships — Veyra Found" },
      { property: "og:description", content: "Startup roles and internships posted by Indian founders — apply in one click." },
      { property: "og:url", content: "https://veyrafound.in/roles" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/roles" }],
  }),
});

type Tab = "board" | "mine" | "applications";

type Role = {
  id: string;
  posted_by: string;
  company_name: string | null;
  title: string;
  description: string;
  role_type: string;
  skills: string[];
  location: string | null;
  remote_pref: string;
  comp_min: number | null;
  comp_max: number | null;
  equity_note: string | null;
  apply_url: string | null;
  status: string;
  created_at: string;
};

function RolesPage() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { user } = useSession();
  const { data: me } = useMyFounder();
  const { accountType } = useAccountType();
  const { data: myTalent } = useMyTalent();
  const canPost = !isJobSeeker(accountType);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("board");
  const [type, setType] = useState("all");
  const [remote, setRemote] = useState("all");
  const [compose, setCompose] = useState(false);
  const [applyTo, setApplyTo] = useState<Role | null>(null);
  const [viewApplicants, setViewApplicants] = useState<Role | null>(null);

  const { data: roles } = useQuery({
    queryKey: ["open-roles"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("open_roles").select("*")
        .order("created_at", { ascending: false }).limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as Role[];
    },
  });

  const { data: myApps } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("role_applications")
        .select("*, open_roles(id, title, company_name, role_type)")
        .eq("applicant_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const appliedIds = useMemo(() => new Set((myApps ?? []).map((a: any) => a.role_id)), [myApps]);
  const board = useMemo(() => (roles ?? [])
    .filter((r) => r.status === "open")
    .filter((r) => type === "all" || r.role_type === type)
    .filter((r) => remote === "all" || r.remote_pref === remote), [roles, type, remote]);
  const mineRoles = (roles ?? []).filter((r) => r.posted_by === user?.id);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <PageHeader
          title="Opportunities"
          subtitle="Founders hiring their first team — co-founders, early employees, interns and freelancers."
          action={canPost ? (
            <button onClick={() => setCompose(true)}
              className="inline-flex items-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
              <Plus className="h-4 w-4" /> Post a role
            </button>
          ) : undefined}
        />

        <TabBar<Tab> value={tab} onChange={setTab} tabs={[
          { v: "board", label: "Board", count: board.length },
          ...(canPost ? [{ v: "mine" as Tab, label: "My postings", count: mineRoles.length }] : []),
          { v: "applications", label: "My applications", count: (myApps ?? []).length },
        ]} />

        {tab === "board" && (
          <>
            <div className="mt-5 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Chip active={type === "all"} onClick={() => setType("all")}>All types</Chip>
                {ROLE_TYPES.map((t) => <Chip key={t.v} active={type === t.v} onClick={() => setType(t.v)}>{t.label}</Chip>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={remote === "all"} onClick={() => setRemote("all")}>Anywhere</Chip>
                {REMOTE_PREFS.map((t) => <Chip key={t.v} active={remote === t.v} onClick={() => setRemote(t.v)}>{t.label}</Chip>)}
              </div>
            </div>

            {board.length === 0 && <Empty>No roles match this filter yet. Be the first to post one.</Empty>}
            <div className="mt-5 grid gap-3">
              {board.map((r) => (
                <RoleCard key={r.id} r={r} applied={appliedIds.has(r.id)} mine={r.posted_by === user?.id}
                  onApply={() => setApplyTo(r)} />
              ))}
            </div>
          </>
        )}

        {tab === "mine" && (
          mineRoles.length === 0 ? <Empty>You haven't posted a role yet.</Empty> : (
            <div className="mt-6 grid gap-3">
              {mineRoles.map((r) => (
                <RoleCard key={r.id} r={r} mine onApplicants={() => setViewApplicants(r)}
                  onToggle={async () => {
                    const { error } = await supabase.from("open_roles")
                      .update({ status: r.status === "open" ? "closed" : "open" }).eq("id", r.id);
                    if (error) return toast.error(error.message);
                    toast.success(r.status === "open" ? "Role closed" : "Role reopened");
                    qc.invalidateQueries({ queryKey: ["open-roles"] });
                  }}
                  onDelete={async () => {
                    const { error } = await supabase.from("open_roles").delete().eq("id", r.id);
                    if (error) return toast.error(error.message);
                    toast.success("Role deleted");
                    qc.invalidateQueries({ queryKey: ["open-roles"] });
                  }} />
              ))}
            </div>
          )
        )}

        {tab === "applications" && (
          (myApps ?? []).length === 0 ? <Empty>No applications yet — find something on the board.</Empty> : (
            <div className="mt-6 grid gap-3">
              {(myApps ?? []).map((a: any) => (
                <Card key={a.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-sm font-black">
                      <Briefcase className="h-4 w-4" /> {a.open_roles?.title}
                      <span className="text-muted-text">· {a.open_roles?.company_name || "Startup"}</span>
                    </div>
                    <Pill tone={a.status === "shortlisted" ? "bg-sage" : a.status === "rejected" ? "bg-red text-white" : "bg-cream"}>{a.status}</Pill>
                  </div>
                  {a.note && <p className="mt-2 whitespace-pre-wrap text-sm">{a.note}</p>}
                  <button
                    onClick={async () => {
                      const { error } = await supabase.from("role_applications").delete().eq("id", a.id);
                      if (error) return toast.error(error.message);
                      toast.success("Application withdrawn");
                      qc.invalidateQueries({ queryKey: ["my-applications"] });
                    }}
                    className="mt-3 border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">
                    Withdraw
                  </button>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {compose && (
        <RoleComposer userId={user?.id} founderId={me?.id} onClose={() => setCompose(false)}
          onSaved={() => { setCompose(false); qc.invalidateQueries({ queryKey: ["open-roles"] }); }} />
      )}
      {applyTo && (
        <ApplyModal role={applyTo} userId={user?.id} resumeUrl={(myTalent as { resume_url?: string | null } | null | undefined)?.resume_url ?? null}
          onClose={() => setApplyTo(null)}
          onSent={() => { setApplyTo(null); qc.invalidateQueries({ queryKey: ["my-applications"] }); }} />
      )}
      {viewApplicants && <ApplicantsModal role={viewApplicants} onClose={() => setViewApplicants(null)} />}
    </AppShell>
  );
}

function RoleCard({ r, applied, mine, onApply, onApplicants, onToggle, onDelete }: {
  r: Role; applied?: boolean; mine?: boolean;
  onApply?: () => void; onApplicants?: () => void; onToggle?: () => void; onDelete?: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-black">{r.title}</h3>
          <div className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-text">
            <Building2 className="h-3.5 w-3.5" /> {r.company_name || "Early-stage startup"}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone="bg-orange text-white">{labelOf(ROLE_TYPES, r.role_type)}</Pill>
          <Pill tone="bg-cream">{labelOf(REMOTE_PREFS, r.remote_pref)}</Pill>
          {r.status !== "open" && <Pill tone="bg-red text-white">Closed</Pill>}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{r.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-text">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location || "India / remote"}</span>
        <span>{compRange(r.comp_min, r.comp_max)}</span>
        {r.equity_note && <span>Equity: {r.equity_note}</span>}
      </div>
      {r.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">{r.skills.map((s) => <Pill key={s} tone="bg-white">{s}</Pill>)}</div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!mine && (
          <button onClick={onApply} disabled={applied}
            className={`inline-flex items-center gap-1 border-2 border-ink px-3 py-1.5 text-xs font-black soft-corners ${applied ? "bg-cream text-muted-text" : "bg-orange text-white shadow-brutal-sm box-hover"}`}>
            <Send className="h-3.5 w-3.5" /> {applied ? "Applied" : "Apply"}
          </button>
        )}
        {r.apply_url && (
          <a href={normalizeUrl(r.apply_url)!} target="_blank" rel="noreferrer"
            className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">External link</a>
        )}
        {mine && onApplicants && (
          <button onClick={onApplicants} className="inline-flex items-center gap-1 border-2 border-ink bg-sage px-3 py-1.5 text-xs font-black soft-corners box-hover">
            <Users className="h-3.5 w-3.5" /> Applicants
          </button>
        )}
        {mine && onToggle && (
          <button onClick={onToggle} className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">
            {r.status === "open" ? "Close role" : "Reopen"}
          </button>
        )}
        {mine && onDelete && (
          <button onClick={onDelete} aria-label="Delete role" className="border-2 border-ink bg-white p-1.5 soft-corners hover:bg-red hover:text-white">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
}

function RoleComposer({ userId, founderId, onClose, onSaved }: { userId?: string; founderId?: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title: "", company_name: "", description: "", role_type: "internship",
    remote_pref: "remote", location: "", comp_min: "", comp_max: "",
    equity_note: "", apply_url: "", skills: [] as string[],
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in first");
      if (f.title.trim().length < 3) throw new Error("Add a role title");
      if (f.description.trim().length < 40) throw new Error("Describe the role in at least 40 characters");
      const { error } = await supabase.from("open_roles").insert({
        posted_by: userId, founder_id: founderId ?? null,
        title: f.title.trim(), company_name: f.company_name.trim() || null,
        description: f.description.trim(), role_type: f.role_type,
        remote_pref: f.remote_pref, location: f.location.trim() || null,
        comp_min: f.comp_min === "" ? null : Number(f.comp_min),
        comp_max: f.comp_max === "" ? null : Number(f.comp_max),
        equity_note: f.equity_note.trim() || null,
        apply_url: normalizeUrl(f.apply_url), skills: f.skills,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role posted"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Modal title="Post a role" wide onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border-2 border-ink bg-white px-4 py-2 text-xs font-black uppercase tracking-wider soft-corners box-hover">Cancel</button>
          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm soft-corners box-hover">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publish
          </button>
        </div>
      }>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Role title"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Founding frontend engineer" /></Field>
        <Field label="Startup name"><input className={inputCls} value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} placeholder="Veyra" /></Field>
        <div className="md:col-span-2">
          <Field label="Job description — what they'll do">
            <textarea rows={5} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="The problem, the first 90 days, who you want, how you work." />
          </Field>
        </div>
        <Field label="Type">
          <select className={inputCls} value={f.role_type} onChange={(e) => setF({ ...f, role_type: e.target.value })}>
            {ROLE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Work setup">
          <select className={inputCls} value={f.remote_pref} onChange={(e) => setF({ ...f, remote_pref: e.target.value })}>
            {REMOTE_PREFS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Location"><LocationInput value={f.location} onChange={(v) => setF({ ...f, location: v })} placeholder="Mumbai" /></Field>
        <Field label="Equity / stipend note"><input className={inputCls} value={f.equity_note} onChange={(e) => setF({ ...f, equity_note: e.target.value })} placeholder="0.5–1% ESOP" /></Field>
        <Field label="Pay from (₹ / month)"><input type="number" className={inputCls} value={f.comp_min} onChange={(e) => setF({ ...f, comp_min: e.target.value })} placeholder="15000" /></Field>
        <Field label="Pay up to (₹ / month)"><input type="number" className={inputCls} value={f.comp_max} onChange={(e) => setF({ ...f, comp_max: e.target.value })} placeholder="60000" /></Field>
        <div className="md:col-span-2">
          <Field label="External application link (optional)">
            <input className={inputCls} value={f.apply_url} onChange={(e) => setF({ ...f, apply_url: e.target.value })} placeholder="forms.gle/…" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">Skills you need</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TALENT_SKILLS.map((s) => (
              <Chip key={s} active={f.skills.includes(s)} onClick={() => setF({ ...f, skills: toggleIn(f.skills, s) })}>{s}</Chip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ApplyModal({ role, userId, resumeUrl, onClose, onSent }: {
  role: Role; userId?: string; resumeUrl: string | null; onClose: () => void; onSent: () => void;
}) {
  const [note, setNote] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in first");
      if (!resumeUrl) throw new Error("Add a CV to your profile first — it gets attached to every application");
      if (note.trim().length < 40) throw new Error("Write at least 40 characters about why you're a fit");
      const { error } = await supabase.from("role_applications").insert({
        role_id: role.id, applicant_id: userId, note: note.trim(),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application sent"); onSent(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Modal title={`Apply · ${role.title}`} onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border-2 border-ink bg-white px-4 py-2 text-xs font-black uppercase tracking-wider soft-corners box-hover">Cancel</button>
          <button onClick={() => m.mutate()} disabled={m.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-ink bg-orange px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm soft-corners box-hover">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
      }>
      <Field label="Why you" hint="Founders read the first three lines — lead with proof.">
        <textarea rows={7} maxLength={800} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="What you've built, links, how soon you can start." />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-2 border-ink bg-cream px-3 py-2 soft-corners">
        <Paperclip className="h-4 w-4" />
        {resumeUrl ? (
          <span className="text-xs font-black uppercase tracking-wider">
            CV attached automatically ·{" "}
            <a href={normalizeUrl(resumeUrl)!} target="_blank" rel="noreferrer" className="underline">preview</a>
          </span>
        ) : (
          <span className="text-xs font-black uppercase tracking-wider text-red">
            No CV on your profile — add one in Profile before applying.
          </span>
        )}
      </div>
    </Modal>
  );
}

function ApplicantsModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["applicants", role.id],
    queryFn: async () => {
      const { data: apps } = await supabase.from("role_applications").select("*").eq("role_id", role.id)
        .order("created_at", { ascending: false });
      const ids = (apps ?? []).map((a: any) => a.applicant_id);
      if (ids.length === 0) return [];
      const [{ data: profiles }, { data: talent }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, account_type").in("id", ids),
        supabase.from("talent_profiles").select("*").in("user_id", ids),
      ]);
      return (apps ?? []).map((a: any) => ({
        ...a,
        name: (profiles ?? []).find((p: any) => p.id === a.applicant_id)?.full_name ?? "Applicant",
        account_type: (profiles ?? []).find((p: any) => p.id === a.applicant_id)?.account_type ?? "talent",
        talent: (talent ?? []).find((t: any) => t.user_id === a.applicant_id) ?? null,
      }));
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("role_applications").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["applicants", role.id] });
  }

  return (
    <Modal title={`Applicants · ${role.title}`} wide onClose={onClose}>
      {(data ?? []).length === 0 ? <Empty>No applications yet.</Empty> : (
        <div className="space-y-3">
          {(data ?? []).map((a: any) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black">{a.name}</span>
                  <RoleBadge type={a.account_type} size="xs" />
                </div>
                <Pill tone={a.status === "shortlisted" ? "bg-sage" : a.status === "rejected" ? "bg-red text-white" : "bg-cream"}>{a.status}</Pill>
              </div>
              {a.talent?.headline && <div className="mt-1 text-sm text-muted-text">{a.talent.headline}</div>}
              {a.note && <p className="mt-2 whitespace-pre-wrap text-sm">{a.note}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {a.talent?.linkedin_url && <a className="text-xs font-black underline" href={normalizeUrl(a.talent.linkedin_url)!} target="_blank" rel="noreferrer">LinkedIn</a>}
                {a.talent?.portfolio_url && <a className="text-xs font-black underline" href={normalizeUrl(a.talent.portfolio_url)!} target="_blank" rel="noreferrer">Portfolio</a>}
                {a.talent?.resume_url && (
                  <a className="inline-flex items-center gap-1 border-2 border-ink bg-cream px-2 py-1 text-xs font-black uppercase soft-corners box-hover"
                    href={normalizeUrl(a.talent.resume_url)!} target="_blank" rel="noreferrer">
                    <Paperclip className="h-3 w-3" /> CV
                  </a>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setStatus(a.id, "shortlisted")} className="border-2 border-ink bg-sage px-3 py-1.5 text-xs font-black soft-corners box-hover">Shortlist</button>
                <button onClick={() => setStatus(a.id, "rejected")} className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-black soft-corners box-hover">Reject</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
}
