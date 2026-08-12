import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { founderAvatar, SKILLS_LIST, AVATAR_PRESETS, PROMPT_GROUPS, LOOKING_FOR_OPTIONS, INDUSTRIES } from "@/lib/founder-types";
import { uploadImage } from "@/lib/uploads";
import { LocationInput } from "@/components/LocationInput";
import { AgeField } from "@/components/AgeField";
import { ProfileLinkChips } from "@/components/ProfileLinkChips";
import { LINK_TYPES, parseLinks, type ProfileLink, type ProfileLinkType } from "@/lib/profile-links";
import { MapPin, Briefcase, Pencil, X, Loader2, Save, LogOut, Trash2, ImagePlus, Linkedin, Github, Eye, EyeOff, Plus, MessageSquareQuote, Trash, Rocket, Zap, BarChart3, Users, type LucideIcon } from "lucide-react";


export const Route = createFileRoute("/profile/me")({
  component: MyProfile,
});

function MyProfile() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editingPrompts, setEditingPrompts] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth/login" });
  }
  async function deleteAccount() {
    setDeleting(true);
    try {
      const mod = await import("@/lib/account.functions");
      await mod.deleteMyAccount();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      router.navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function toggleAssessmentPrivacy() {
    if (!me) return;
    setPrivacyBusy(true);
    const next = !me.assessment_public;
    const { error } = await supabase.from("founders").update({ assessment_public: next }).eq("id", me.id);
    setPrivacyBusy(false);
    if (error) return toast.error(error.message);
    toast.success(next ? "Compatibility results are now public" : "Compatibility results are now private");
    qc.invalidateQueries({ queryKey: ["my-founder"] });
    qc.invalidateQueries();
  }

  const { data: assessment } = useQuery({
    queryKey: ["assessment", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("*").eq("founder_id", me!.id).maybeSingle();
      return data;
    },
  });
  const { data: prompts } = useQuery({
    queryKey: ["my-prompts", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("founder_prompts").select("*").eq("founder_id", me!.id).order("display_order");
      return data ?? [];
    },
  });

  if (!ready || !me) return null;
  const name = profile?.full_name ?? me.seed_name ?? "Founder";

  const dims = [
    { label: "Openness", v: assessment?.openness_score },
    { label: "Conscientiousness", v: assessment?.conscientiousness_score },
    { label: "Extraversion", v: assessment?.extraversion_score },
    { label: "Agreeableness", v: assessment?.agreeableness_score },
    { label: "Neuroticism", v: assessment?.neuroticism_score },
    { label: "Risk", v: assessment?.risk_score },
    { label: "Decision velocity", v: assessment?.decision_velocity_score },
    { label: "Equity philosophy", v: assessment?.equity_philosophy_score },
    { label: "Vision", v: assessment?.vision_score },
  ];

  // Profile completeness — 10 checks × 10pts
  const checks = [
    { key: "Name",        ok: !!(profile?.full_name && profile.full_name.length >= 2) },
    { key: "Headline",    ok: !!(me.headline && me.headline.length >= 10) },
    { key: "Bio (50+ chars)", ok: !!(me.bio && me.bio.length >= 50) },
    { key: "Location",    ok: !!me.location },
    { key: "Age",         ok: !!me.age },
    { key: "Avatar",      ok: !!me.seed_avatar },
    { key: "3+ skills",   ok: (me.skills ?? []).length >= 3 },
    { key: "3 prompts",   ok: (prompts ?? []).length >= 3 },
    { key: "Assessment",  ok: !!assessment },
    // "Verified" = at least one linked professional profile (LinkedIn / GitHub).
    { key: "LinkedIn or GitHub link", ok: !!(me.linkedin_url || me.github_url) },
  ];
  const done = checks.filter((c) => c.ok).length;
  const pct = Math.round((done / checks.length) * 100);
  const missing = checks.filter((c) => !c.ok);
  const barColor = pct >= 80 ? "bg-sage" : pct >= 50 ? "bg-orange" : "bg-red";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <div className="overflow-hidden rounded-3xl border bg-white shadow-card">
          <div className="bg-hero-radial p-8 pb-14">
            <div className="flex items-start gap-4">
              <img src={founderAvatar({ seed_avatar: me.seed_avatar, seed_name: me.seed_name, profile: { full_name: profile?.full_name } })}
                className="h-20 w-20 rounded-2xl border-2 border-white/20 object-cover" alt="" />
              <div className="flex-1">
                <div className="text-2xl font-black text-white">{name}</div>
                <div className="mt-1 text-sm text-white/70">{me.headline}</div>
                <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {me.location}</span>
                  {me.age && <span className="inline-flex items-center gap-1">🎂 {me.age}</span>}
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {me.years_experience}y</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <TierBadge tier={me.trust_tier ?? "Builder"} />
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-orange px-2 py-1 text-[11px] font-black text-white shadow-brutal-sm">
                  <Pencil className="h-3 w-3" /> Customize
                </button>
                <button onClick={() => setEditingPrompts(true)} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-[11px] font-black text-ink shadow-brutal-sm">
                  <MessageSquareQuote className="h-3 w-3" /> Prompts
                </button>
              </div>
            </div>
          </div>

          {editing && <EditPanel
            initial={{
              full_name: profile?.full_name ?? "",
              headline: me.headline ?? "",
              bio: me.bio ?? "",
              location: me.location ?? "",
              age: me.age ?? 0,
              years_experience: me.years_experience ?? 0,
              education: me.education ?? "",
              skills: me.skills ?? [],
              industry_focus: me.industry_focus ?? [],
              looking_for: me.looking_for ?? [],
              linkedin_url: me.linkedin_url ?? "",
              github_url: me.github_url ?? "",
              links: parseLinks(me.links),

              commitment: me.commitment ?? "full_time",
              remote_pref: me.remote_pref ?? "hybrid",
              active_status: me.active_status ?? "active",
              has_idea: !!me.has_idea,
              idea_description: me.idea_description ?? "",
              idea_industry: me.idea_industry ?? "",
              idea_stage: me.idea_stage ?? "idea",
              seed_avatar: me.seed_avatar ?? AVATAR_PRESETS[0],
            }}
            founderId={me.id}
            userId={me.user_id ?? ""}
            onClose={() => setEditing(false)}
            onSaved={() => { qc.invalidateQueries(); setEditing(false); }}
          />}

          {editingPrompts && <PromptsPanel
            founderId={me.id}
            existing={(prompts ?? []) as { id: string; prompt_question: string; prompt_answer: string; display_order: number | null }[]}
            onClose={() => setEditingPrompts(false)}
            onSaved={() => { qc.invalidateQueries({ queryKey: ["my-prompts", me.id] }); setEditingPrompts(false); }}
          />}

          <div className="-mt-8 space-y-6 p-6">
            <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-text">Profile completeness</div>
                  <div className="mt-0.5 text-xl font-black">{pct}% <span className="text-xs font-bold text-muted-text">· {done}/{checks.length} done</span></div>
                </div>
                <div className={`rounded-md border-2 border-ink px-2 py-1 text-[10px] font-black uppercase ${pct >= 80 ? "bg-sage text-ink" : pct >= 50 ? "bg-orange text-white" : "bg-red text-white"}`}>
                  {pct >= 80 ? "Strong" : pct >= 50 ? "Getting there" : "Add more"}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full border-2 border-ink bg-cream">
                <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              {missing.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-black uppercase text-muted-text">Missing</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {missing.map((m) => (
                      <span key={m.key} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-black text-ink">
                        <X className="h-2.5 w-2.5" /> {m.key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-card">
              <div className="text-sm">{me.bio}</div>
              <div className="mt-3"><VerifiedBadges f={me} /></div>
              <ProfileLinkChips className="mt-3" linkedin={me.linkedin_url} github={me.github_url} links={parseLinks(me.links)} name={name} />

            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(me.skills ?? []).map((s) => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-text">Prompts</div>
                <button onClick={() => setEditingPrompts(true)} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-black box-hover">
                  <Pencil className="h-3 w-3" /> Edit prompts
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {(prompts ?? []).length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm font-bold text-muted-text">
                    No prompts yet — add up to 3 so founders know how to open a conversation.
                  </div>
                )}
                {prompts?.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-surface p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo">{p.prompt_question}</div>
                    <div className="mt-1 text-sm font-medium">{p.prompt_answer}</div>
                  </div>
                ))}
              </div>
            </div>

            {assessment && (
              <div>
                <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-brutal-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider">Compatibility results</div>
                      <div className="mt-0.5 text-[11px] font-bold text-muted-text">
                        {me.assessment_public
                          ? "Public — other founders can see your personality dimensions."
                          : "Private — only you (and admins) can see your dimensions."}
                      </div>
                    </div>
                    <button onClick={toggleAssessmentPrivacy} disabled={privacyBusy}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-ink px-3 py-2 text-[11px] font-black shadow-brutal-sm box-hover disabled:opacity-60 ${me.assessment_public ? "bg-sage text-ink" : "bg-white text-ink"}`}>
                      {privacyBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : me.assessment_public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {me.assessment_public ? "Public" : "Private"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-text">Compatibility dimensions</div>
                <div className="mt-3 grid gap-2">
                  {dims.map((d) => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{d.label}</span>
                        <span className="text-muted-text">{d.v ?? "—"}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full bg-indigo transition-all" style={{ width: `${d.v ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account actions */}
        <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
          <div className="text-xs font-black uppercase tracking-wider text-muted-text">Account</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-black shadow-brutal-sm box-hover">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-red px-4 py-2 text-xs font-black text-white shadow-brutal-sm box-hover">
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" onClick={() => !deleting && setConfirmDelete(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
            <div className="text-xl font-black">Delete your account?</div>
            <p className="mt-2 text-sm text-ink/80">This wipes your profile, prompts, requests, and conversations. Cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                className="flex-1 rounded-lg border-2 border-ink bg-white py-2 text-sm font-black">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-ink bg-red py-2 text-sm font-black text-white disabled:opacity-50">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

type EditForm = {
  full_name: string; headline: string; bio: string; location: string; age: number;
  years_experience: number; education: string; skills: string[]; industry_focus: string[];
  looking_for: string[]; linkedin_url: string; github_url: string; links: ProfileLink[];
  commitment: string; remote_pref: string; active_status: string;
  has_idea: boolean; idea_description: string; idea_industry: string; idea_stage: string;
  seed_avatar: string;
};

function EditPanel({ initial, founderId, userId, onClose, onSaved }: {
  initial: EditForm;
  founderId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditForm>(initial);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  function cleanUrl(v: string) {
    const t = v.trim();
    if (!t) return "";
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  }

  async function save() {
    const linkedin = cleanUrl(form.linkedin_url);
    const github = cleanUrl(form.github_url);
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("founders").update({
        headline: form.headline, bio: form.bio, location: form.location, skills: form.skills,
        industry_focus: form.industry_focus,
        looking_for: form.looking_for,
        education: form.education || null,
        years_experience: form.years_experience > 0 ? form.years_experience : null,
        age: form.age > 0 ? form.age : null,
        linkedin_url: linkedin || null,
        github_url: github || null,
        links: form.links
          .map((l) => ({ type: l.type, value: l.value.trim(), ...(l.label?.trim() ? { label: l.label.trim() } : {}) }))
          .filter((l) => l.value.length > 0),
        // A linked profile counts as verified for badge purposes.
        linkedin_verified: !!linkedin,
        github_verified: !!github,

        commitment: form.commitment as never,
        remote_pref: form.remote_pref as never,
        active_status: form.active_status as never,
        has_idea: form.has_idea,
        idea_description: form.has_idea ? form.idea_description : null,
        idea_industry: form.has_idea ? form.idea_industry : null,
        idea_stage: form.has_idea ? (form.idea_stage as never) : null,
        seed_avatar: form.seed_avatar,
      }).eq("id", founderId),
      userId ? supabase.from("profiles").update({ full_name: form.full_name, avatar_url: form.seed_avatar }).eq("id", userId) : Promise.resolve({ error: null }),
    ]);
    setSaving(false);
    if (e1 || e2) return toast.error(e1?.message ?? e2?.message ?? "Save failed");
    toast.success("Profile updated");
    onSaved();
  }

  function toggleSkill(s: string) {
    setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] }));
  }
  function toggleIn(key: "industry_focus" | "looking_for", v: string) {
    setForm((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/70 p-3 sm:p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brutal-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-ink bg-white p-5 sm:p-6">
          <div>
            <div className="text-2xl font-black sm:text-3xl">Customize profile</div>
            <div className="mt-1 text-xs font-bold text-muted-text">Edit what founders see. Changes publish instantly.</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink bg-cream shadow-brutal-sm box-hover"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Left column — identity */}
            <div className="space-y-5 lg:col-span-1">
              <Section title="Photo" icon={ImagePlus}>
                <div className="flex items-center gap-4">
                  <img src={form.seed_avatar} alt="" className="h-20 w-20 rounded-xl border-2 border-ink object-cover shadow-brutal-sm" />
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2.5 text-xs font-black shadow-brutal-sm box-hover ${uploading ? "opacity-50" : ""}`}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Upload photo
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploading(true);
                        try {
                          const url = await uploadImage(file, "avatars");
                          setForm((f) => ({ ...f, seed_avatar: url }));
                          toast.success("Photo ready — hit save");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Upload failed");
                        } finally {
                          setUploading(false);
                        }
                      }} />
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {AVATAR_PRESETS.map((url) => {
                    const on = form.seed_avatar === url;
                    return (
                      <button key={url} type="button" onClick={() => setForm({ ...form, seed_avatar: url })}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 border-ink transition ${on ? "shadow-brutal -translate-x-0.5 -translate-y-0.5 ring-2 ring-orange" : "shadow-brutal-sm hover:-translate-y-0.5"}`}>
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        {on && <div className="absolute inset-0 bg-orange/40" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-[10px] font-bold text-muted-text">PNG/JPG · max 5 MB</div>
              </Section>

              <Section title="Basics" icon={Pencil}>
                <div className="space-y-3">
                  <Field label="Full name" v={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                  <Field label="Headline" v={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder="e.g. Ex-Flipkart PM building in fintech" />
                  <div>
                    <label className="text-[11px] font-black uppercase text-muted-text">Bio</label>
                    <textarea rows={4} maxLength={280} value={form.bio} placeholder="What should a potential co-founder know about you?"
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                    <div className="mt-1 text-right text-[10px] font-bold text-muted-text">{form.bio.length}/280</div>
                  </div>
                </div>
              </Section>

              <Section title="Details" icon={MapPin}>
                <div className="grid gap-3">
                  <div>
                    <label className="text-[11px] font-black uppercase text-muted-text">Location</label>
                    <div className="mt-1.5">
                      <LocationInput value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Start typing a city…" />
                    </div>
                  </div>
                  <AgeField value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black uppercase text-muted-text">Experience</label>
                    <input type="number" min={0} max={60} value={form.years_experience || ""}
                      onChange={(e) => setForm({ ...form, years_experience: +e.target.value || 0 })}
                      className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                  </div>
                  <Field label="Education" v={form.education} onChange={(v) => setForm({ ...form, education: v })} placeholder="College / degree" />
                </div>
              </Section>
            </div>

            {/* Right column — links, preferences, skills */}
            <div className="space-y-5 lg:col-span-2">
              <Section title="Links" icon={Linkedin}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-muted-text"><Linkedin className="h-3.5 w-3.5" /> LinkedIn URL</label>
                    <input value={form.linkedin_url} placeholder="linkedin.com/in/yourname"
                      onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-muted-text"><Github className="h-3.5 w-3.5" /> GitHub URL</label>
                    <input value={form.github_url} placeholder="github.com/yourhandle"
                      onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                  </div>
                </div>

                <div className="mt-5 border-t-2 border-dashed border-ink/30 pt-4">
                  <div className="text-[11px] font-black uppercase text-muted-text">More links · email, WhatsApp, X, Calendly…</div>
                  <div className="mt-3 space-y-3">
                    {form.links.map((l, i) => {
                      const meta = LINK_TYPES.find((t) => t.type === l.type);
                      return (
                        <div key={i} className="rounded-xl border-2 border-ink bg-cream p-3 shadow-brutal-sm">
                          <div className="flex items-center gap-2">
                            <select value={l.type}
                              onChange={(e) => setForm((f) => ({
                                ...f,
                                links: f.links.map((x, j) => j === i ? { ...x, type: e.target.value as ProfileLinkType } : x),
                              }))}
                              className="rounded-md border-2 border-ink bg-white px-2 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-orange">
                              {LINK_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                            </select>
                            <input value={l.value} placeholder={meta?.placeholder ?? "https://..."}
                              onChange={(e) => setForm((f) => ({
                                ...f,
                                links: f.links.map((x, j) => j === i ? { ...x, value: e.target.value } : x),
                              }))}
                              className="min-w-0 flex-1 rounded-md border-2 border-ink bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                            <button type="button" title="Remove link"
                              onClick={() => setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }))}
                              className="rounded-md border-2 border-ink bg-red px-2 py-1.5 text-white shadow-brutal-sm box-hover">
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                          <input value={l.label ?? ""} placeholder="Custom label (optional)"
                            onChange={(e) => setForm((f) => ({
                              ...f,
                              links: f.links.map((x, j) => j === i ? { ...x, label: e.target.value } : x),
                            }))}
                            className="mt-2 w-full rounded-md border-2 border-ink bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange" />
                          {meta && <div className="mt-1.5 text-[10px] font-bold text-muted-text">{meta.hint}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {form.links.length < 12 && (
                    <button type="button"
                      onClick={() => setForm((f) => ({ ...f, links: [...f.links, { type: "email", value: "" }] }))}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-sage px-3 py-2 text-xs font-black shadow-brutal-sm box-hover">
                      <Plus className="h-3.5 w-3.5" /> Add link
                    </button>
                  )}
                </div>
              </Section>

              <div className="grid gap-5 md:grid-cols-2">
                <Section title="Preferences" icon={Briefcase}>
                  <div className="space-y-3">
                    <Select label="Commitment" v={form.commitment} onChange={(v) => setForm({ ...form, commitment: v })}
                      opts={[["full_time", "Full time"], ["part_time", "Part time"], ["exploring", "Exploring"]]} />
                    <Select label="Work setup" v={form.remote_pref} onChange={(v) => setForm({ ...form, remote_pref: v })}
                      opts={[["onsite", "On-site"], ["hybrid", "Hybrid"], ["remote", "Remote"]]} />
                    <Select label="Status" v={form.active_status} onChange={(v) => setForm({ ...form, active_status: v })}
                      opts={[["active", "Actively looking"], ["open", "Open to chats"], ["paused", "Paused"]]} />
                  </div>
                </Section>

                <Section title="Idea" icon={Rocket}>
                  <label className="flex items-center gap-2.5 text-sm font-black">
                    <input type="checkbox" checked={form.has_idea} onChange={(e) => setForm({ ...form, has_idea: e.target.checked })} className="h-4 w-4" />
                    I have an idea I'm building
                  </label>
                  {form.has_idea && (
                    <div className="mt-3 space-y-3">
                      <textarea rows={3} maxLength={400} value={form.idea_description} placeholder="What are you building?"
                        onChange={(e) => setForm({ ...form, idea_description: e.target.value })}
                        className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                      <div className="grid grid-cols-2 gap-3">
                        <Select label="Industry" v={form.idea_industry || INDUSTRIES[0]} onChange={(v) => setForm({ ...form, idea_industry: v })}
                          opts={INDUSTRIES.map((i) => [i, i] as [string, string])} />
                        <Select label="Stage" v={form.idea_stage} onChange={(v) => setForm({ ...form, idea_stage: v })}
                          opts={[["idea", "Idea"], ["mvp", "MVP"], ["revenue", "Revenue"], ["funded", "Funded"]]} />
                      </div>
                    </div>
                  )}
                </Section>
              </div>

              <Section title="Skills" icon={Zap}>
                <div className="flex flex-wrap gap-2">
                  {[...new Set([...SKILLS_LIST, ...form.skills])].map((s) => {
                    const on = form.skills.includes(s);
                    return <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`rounded-md border-2 border-ink px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 ${on ? "bg-orange text-white shadow-brutal-sm" : "bg-white shadow-brutal-sm hover:shadow-brutal"}`}>{s}</button>;
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom skill"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault();
                      const s = custom.trim(); if (!s) return;
                      setForm((f) => ({ ...f, skills: [...new Set([...f.skills, s])] })); setCustom("");
                    } }}
                    className="flex-1 rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                  <button type="button" onClick={() => {
                    const s = custom.trim(); if (!s) return;
                    setForm((f) => ({ ...f, skills: [...new Set([...f.skills, s])] })); setCustom("");
                  }} className="rounded-lg border-2 border-ink bg-ink px-5 py-2.5 text-sm font-black text-white shadow-brutal-sm box-hover">Add</button>
                </div>
              </Section>

              <div className="grid gap-5 md:grid-cols-2">
                <Section title="Industry focus" icon={BarChart3}>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((i) => (
                      <button key={i} type="button" onClick={() => toggleIn("industry_focus", i)}
                        className={`rounded-md border-2 border-ink px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 ${form.industry_focus.includes(i) ? "bg-sage text-ink shadow-brutal-sm" : "bg-white shadow-brutal-sm hover:shadow-brutal"}`}>{i}</button>
                    ))}
                  </div>
                </Section>

                <Section title="Looking for" icon={Users}>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR_OPTIONS.map((i) => (
                      <button key={i} type="button" onClick={() => toggleIn("looking_for", i)}
                        className={`rounded-md border-2 border-ink px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 ${form.looking_for.includes(i) ? "bg-orange text-white shadow-brutal-sm" : "bg-white shadow-brutal-sm hover:shadow-brutal"}`}>{i}</button>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-ink bg-white p-4 sm:p-6">
          <button onClick={onClose} className="rounded-lg border-2 border-ink bg-cream px-5 py-2.5 text-sm font-black shadow-brutal-sm box-hover">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-orange px-6 py-2.5 text-sm font-black text-white shadow-brutal box-hover disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

type PromptRow = { id: string; prompt_question: string; prompt_answer: string; display_order: number | null };

function PromptsPanel({ founderId, existing, onClose, onSaved }: {
  founderId: string;
  existing: PromptRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState(
    existing.length
      ? existing.map((p) => ({ question: p.prompt_question, answer: p.prompt_answer }))
      : [{ question: "", answer: "" }],
  );
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<{ question: string; answer: string }>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function save() {
    const clean = rows.filter((r) => r.question.trim() && r.answer.trim()).slice(0, 3);
    setSaving(true);
    // Replace the founder's prompt set with the edited list.
    const { error: delErr } = await supabase.from("founder_prompts").delete().eq("founder_id", founderId);
    if (delErr) { setSaving(false); return toast.error(delErr.message); }
    if (clean.length) {
      const { error } = await supabase.from("founder_prompts").insert(
        clean.map((r, i) => ({
          founder_id: founderId,
          prompt_question: r.question.trim(),
          prompt_answer: r.answer.trim(),
          display_order: i,
        })),
      );
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Prompts updated");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/70 p-3 sm:p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brutal-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-ink bg-white p-5 sm:p-6">
          <div>
            <div className="text-2xl font-black sm:text-3xl">Your prompts</div>
            <div className="mt-1 text-xs font-bold text-muted-text">Pick up to 3 conversation starters. Change them any time.</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink bg-cream shadow-brutal-sm box-hover"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            {rows.map((row, i) => (
              <div key={i} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brutal-sm sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-orange px-2.5 py-1 text-[10px] font-black uppercase text-white">
                    Prompt {i + 1}
                  </div>
                  {rows.length > 1 && (
                    <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                      className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-red px-2 py-1 text-[10px] font-black text-white shadow-brutal-sm box-hover">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
                <label className="text-[11px] font-black uppercase text-muted-text">Question</label>
                <select value={row.question} onChange={(e) => update(i, { question: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange">
                  <option value="">Choose a prompt…</option>
                  {PROMPT_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.prompts.map((p) => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  ))}
                  {row.question && !PROMPT_GROUPS.some((g) => g.prompts.includes(row.question)) && (
                    <option value={row.question}>{row.question}</option>
                  )}
                </select>
                <label className="mt-4 block text-[11px] font-black uppercase text-muted-text">Answer</label>
                <textarea rows={4} maxLength={300} value={row.answer} placeholder="Your answer…"
                  onChange={(e) => update(i, { answer: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
                <div className="mt-1 text-right text-[10px] font-bold text-muted-text">{row.answer.length}/300</div>
              </div>
            ))}
            {rows.length < 3 && (
              <button onClick={() => setRows((r) => [...r, { question: "", answer: "" }])}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink bg-white py-3 text-sm font-black shadow-brutal-sm box-hover">
                <Plus className="h-4 w-4" /> Add another prompt
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-ink bg-white p-4 sm:p-6">
          <button onClick={onClose} className="rounded-lg border-2 border-ink bg-cream px-5 py-2.5 text-sm font-black shadow-brutal-sm box-hover">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-orange px-6 py-2.5 text-sm font-black text-white shadow-brutal box-hover disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save prompts
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, onChange, placeholder }: { label: string; v: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase text-muted-text">{label}</label>
      <input value={v} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
    </div>
  );
}

function Select({ label, v, onChange, opts }: { label: string; v: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase text-muted-text">{label}</label>
      <select value={v} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border-2 border-ink bg-white px-2 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange">
        {opts.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
      </select>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brutal-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b-2 border-ink/10 pb-2">
        <div className="grid h-7 w-7 place-items-center rounded-md border-2 border-ink bg-cream">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs font-black uppercase tracking-wider text-muted-text">{title}</div>
      </div>
      {children}
    </div>
  );
}
