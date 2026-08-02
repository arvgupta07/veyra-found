import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { founderAvatar, SKILLS_LIST, AVATAR_PRESETS } from "@/lib/founder-types";
import { uploadImage } from "@/lib/uploads";
import { MapPin, Briefcase, Pencil, X, Loader2, Save, LogOut, Trash2, ImagePlus } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    { key: "Verified",    ok: !!(me.linkedin_verified || me.github_verified || me.aadhaar_verified) },
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
              </div>
            </div>
          </div>

          {editing && <EditPanel
            initial={{ full_name: profile?.full_name ?? "", headline: me.headline ?? "", bio: me.bio ?? "", location: me.location ?? "", age: me.age ?? 0, skills: me.skills ?? [], seed_avatar: me.seed_avatar ?? AVATAR_PRESETS[0] }}
            founderId={me.id}
            userId={me.user_id ?? ""}
            onClose={() => setEditing(false)}
            onSaved={() => { qc.invalidateQueries(); setEditing(false); }}
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
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(me.skills ?? []).map((s) => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-text">Prompts</div>
              <div className="mt-2 space-y-2">
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
                <div className="text-xs font-bold uppercase tracking-wider text-muted-text">Compatibility dimensions</div>
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

function EditPanel({ initial, founderId, userId, onClose, onSaved }: {
  initial: { full_name: string; headline: string; bio: string; location: string; age: number; skills: string[]; seed_avatar: string };
  founderId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  async function save() {
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("founders").update({
        headline: form.headline, bio: form.bio, location: form.location, skills: form.skills,
        age: form.age > 0 ? form.age : null,
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

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div className="text-xl font-black">Customize profile</div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-black uppercase text-muted-text">Avatar</label>
            <div className="mt-2 flex items-center gap-3">
              <img src={form.seed_avatar} alt="" className="h-14 w-14 rounded-xl border-2 border-ink object-cover" />
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-brutal-sm box-hover ${uploading ? "opacity-50" : ""}`}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
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
              <span className="text-[10px] font-bold text-muted-text">PNG/JPG · max 5 MB</span>
            </div>
            <div className="mt-2 text-[10px] font-black uppercase text-muted-text">Or pick a preset</div>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((url) => {
                const on = form.seed_avatar === url;
                return (
                  <button key={url} type="button" onClick={() => setForm({ ...form, seed_avatar: url })}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 border-ink transition ${on ? "shadow-brutal -translate-x-0.5 -translate-y-0.5" : "shadow-brutal-sm hover:-translate-y-0.5"}`}>
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {on && <div className="absolute inset-0 bg-orange/60" />}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Full name" v={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Headline" v={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
          <div>
            <label className="text-[11px] font-black uppercase text-muted-text">Bio</label>
            <textarea rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" v={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <div>
              <label className="text-[11px] font-black uppercase text-muted-text">Age</label>
              <input type="number" min={16} max={100} value={form.age || ""}
                onChange={(e) => setForm({ ...form, age: +e.target.value || 0 })}
                className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase text-muted-text">Skills</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...new Set([...SKILLS_LIST, ...form.skills])].map((s) => {
                const on = form.skills.includes(s);
                return <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`rounded-md border-2 border-ink px-2 py-1 text-xs font-black ${on ? "bg-orange text-white" : "bg-white"}`}>{s}</button>;
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom skill"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault();
                  const s = custom.trim(); if (!s) return;
                  setForm((f) => ({ ...f, skills: [...new Set([...f.skills, s])] })); setCustom("");
                } }}
                className="flex-1 rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
              <button type="button" onClick={() => {
                const s = custom.trim(); if (!s) return;
                setForm((f) => ({ ...f, skills: [...new Set([...f.skills, s])] })); setCustom("");
              }} className="rounded-lg border-2 border-ink bg-ink px-4 py-2 text-sm font-black text-white">Add</button>
            </div>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, v, onChange }: { label: string; v: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase text-muted-text">{label}</label>
      <input value={v} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
    </div>
  );
}
