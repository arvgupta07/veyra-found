import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { founderAvatar, SKILLS_LIST } from "@/lib/founder-types";
import { MapPin, Briefcase, Pencil, X, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/profile/me")({
  component: MyProfile,
});

function MyProfile() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
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
            initial={{ full_name: profile?.full_name ?? "", headline: me.headline ?? "", bio: me.bio ?? "", location: me.location ?? "", age: me.age ?? 0, skills: me.skills ?? [] }}
            founderId={me.id}
            userId={me.user_id ?? ""}
            onClose={() => setEditing(false)}
            onSaved={() => { qc.invalidateQueries(); setEditing(false); }}
          />}

          <div className="-mt-8 space-y-6 p-6">
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
      </div>
    </AppShell>
  );
}

function EditPanel({ initial, founderId, userId, onClose, onSaved }: {
  initial: { full_name: string; headline: string; bio: string; location: string; age: number; skills: string[] };
  founderId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  async function save() {
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("founders").update({
        headline: form.headline, bio: form.bio, location: form.location, skills: form.skills,
      }).eq("id", founderId),
      userId ? supabase.from("profiles").update({ full_name: form.full_name }).eq("id", userId) : Promise.resolve({ error: null }),
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
          <Field label="Full name" v={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Headline" v={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
          <div>
            <label className="text-[11px] font-black uppercase text-muted-text">Bio</label>
            <textarea rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          </div>
          <Field label="Location" v={form.location} onChange={(v) => setForm({ ...form, location: v })} />
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
