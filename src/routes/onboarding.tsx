import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ChevronRight, Rocket, Briefcase, Palette, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";
import { PROMPTS, SKILLS_LIST, INDUSTRIES, ASSESSMENT_QUESTIONS } from "@/lib/founder-types";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4;
const BACKGROUNDS = [
  { v: "technical", label: "Technical", icon: Wrench },
  { v: "business",  label: "Business",  icon: Briefcase },
  { v: "design",    label: "Design",    icon: Palette },
  { v: "other",     label: "Other",     icon: Rocket },
] as const;

function Onboarding() {
  const router = useRouter();
  const { session, loading: sLoading } = useSession();
  const { data: profile } = useMyProfile();
  const { data: existingFounder } = useMyFounder();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sLoading && !session) router.navigate({ to: "/auth/login" });
  }, [sLoading, session, router]);

  useEffect(() => {
    if (existingFounder?.profile_complete) router.navigate({ to: "/discover" });
  }, [existingFounder, router]);

  // Form state
  const [f, setF] = useState({
    full_name: "", headline: "", bio: "", location: "",
    linkedin_url: "", github_url: "", years_experience: 3,
    background: "technical" as "technical"|"business"|"design"|"other",
    skills: [] as string[], custom_skill: "",
    industry_focus: [] as string[],
    commitment: "full_time" as "full_time"|"part_time"|"exploring",
    idea_stage: "idea" as "idea"|"mvp"|"revenue"|"funded",
    has_idea: false, idea_industry: "", idea_description: "",
    equity_offer: 40, exit_vision: "ipo" as "lifestyle"|"acquisition"|"ipo",
    remote_pref: "hybrid" as "onsite"|"hybrid"|"remote",
    looking_for: [] as string[],
  });
  useEffect(() => { if (profile?.full_name) setF((x) => ({ ...x, full_name: profile.full_name ?? "" })); }, [profile]);

  const [selectedPrompts, setSelectedPrompts] = useState<{ q: string; a: string }[]>([]);
  const [assessQ, setAssessQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A"|"B"|"C"|"D">>({});
  const [generating, setGenerating] = useState(false);

  const progress = ((step - 1) / 4) * 100;
  const canNextP = selectedPrompts.length === 4 && selectedPrompts.every((p) => p.a.trim().length > 0);

  async function saveStep1() {
    if (!session) return;
    setSaving(true);
    // upsert founder (create if missing)
    const { data: existing } = await supabase.from("founders").select("id").eq("user_id", session.user.id).maybeSingle();
    const payload = {
      user_id: session.user.id,
      headline: f.headline, bio: f.bio, location: f.location,
      linkedin_url: f.linkedin_url, github_url: f.github_url,
      years_experience: f.years_experience, background: f.background,
    };
    let err;
    if (existing) ({ error: err } = await supabase.from("founders").update(payload).eq("id", existing.id));
    else ({ error: err } = await supabase.from("founders").insert(payload));
    // also update profile name
    await supabase.from("profiles").update({ full_name: f.full_name }).eq("id", session.user.id);
    setSaving(false);
    if (err) return toast.error(err.message);
    setStep(2);
  }

  async function saveStep2() {
    setSaving(true);
    const { data: founder } = await supabase.from("founders").select("id").eq("user_id", session!.user.id).maybeSingle();
    if (!founder) { setSaving(false); return toast.error("Please complete step 1 first"); }
    const skills = f.custom_skill ? [...new Set([...f.skills, f.custom_skill])] : f.skills;
    const { error } = await supabase.from("founders").update({
      skills, industry_focus: f.industry_focus,
      commitment: f.commitment, idea_stage: f.idea_stage,
      has_idea: f.has_idea,
      idea_industry: f.has_idea ? f.idea_industry : null,
      idea_description: f.has_idea ? f.idea_description : null,
      equity_offer: `${f.equity_offer}%`,
      exit_vision: f.exit_vision,
      remote_pref: f.remote_pref,
      looking_for: f.looking_for,
    }).eq("id", founder.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setStep(3);
  }

  async function saveStep3() {
    setSaving(true);
    const { data: founder } = await supabase.from("founders").select("id").eq("user_id", session!.user.id).maybeSingle();
    if (!founder) return;
    await supabase.from("founder_prompts").delete().eq("founder_id", founder.id);
    await supabase.from("founder_prompts").insert(selectedPrompts.map((p, i) => ({
      founder_id: founder.id, prompt_question: p.q, prompt_answer: p.a, display_order: i,
    })));
    setSaving(false);
    setStep(4);
  }

  function pickAnswer(letter: "A"|"B"|"C"|"D") {
    const next = { ...answers, [assessQ]: letter };
    setAnswers(next);
    if (assessQ < 19) setAssessQ(assessQ + 1);
    else finishAssessment(next);
  }

  async function finishAssessment(final: Record<number, "A"|"B"|"C"|"D">) {
    setGenerating(true);
    // compute simple dimension scores from letter distribution
    const letters = Object.values(final);
    const count = (l: string) => letters.filter((x) => x === l).length;
    const score = (weights: [number, number, number, number]) => {
      const total = weights[0]*count("A") + weights[1]*count("B") + weights[2]*count("C") + weights[3]*count("D");
      return Math.round(Math.max(0, Math.min(100, 40 + total * 3)));
    };
    const scores = {
      openness_score: score([2, 1, -1, 3]),
      conscientiousness_score: score([1, 3, 2, 0]),
      extraversion_score: score([2, 0, 1, 2]),
      agreeableness_score: score([1, 2, -1, 2]),
      neuroticism_score: score([-1, 0, 2, 1]),
      risk_score: score([-2, 0, 2, 3]),
      decision_velocity_score: score([1, 3, 0, 1]),
      equity_philosophy_score: score([3, 1, 1, 2]),
      vision_score: score([1, 2, 3, 2]),
    };
    const { data: founder } = await supabase.from("founders").select("id").eq("user_id", session!.user.id).maybeSingle();
    if (founder) {
      await supabase.from("assessments").upsert({ founder_id: founder.id, ...scores, raw_answers: JSON.parse(JSON.stringify(final)) }, { onConflict: "founder_id" });
      await supabase.from("founders").update({ profile_complete: true }).eq("id", founder.id);
    }
    await new Promise((r) => setTimeout(r, 2500));
    setGenerating(false);
    toast.success("Profile complete!");
    router.navigate({ to: "/discover" });
  }

  const currentQ = ASSESSMENT_QUESTIONS[assessQ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Step {step} of 4</div>
            <div className="text-xs text-muted-text">{["Basic profile","Work & idea","Prompts","Compatibility"][step-1]}</div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-indigo transition-all" style={{ width: `${progress + 25}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 pb-24">
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">Let's build your profile</h1>
            <div className="grid gap-4 rounded-2xl border bg-white p-6 shadow-card">
              <Input label="Full name" value={f.full_name} onChange={(v) => setF({ ...f, full_name: v })} />
              <Input label="Headline" placeholder="Full-stack engineer obsessed with fintech" value={f.headline} onChange={(v) => setF({ ...f, headline: v })} />
              <div>
                <label className="text-xs font-semibold text-muted-text">Bio</label>
                <textarea maxLength={280} rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
                <div className="mt-1 text-right text-[10px] text-muted-text">{f.bio.length}/280</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" placeholder="Mumbai" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
                <div>
                  <label className="text-xs font-semibold text-muted-text">Years of experience</label>
                  <select value={f.years_experience} onChange={(e) => setF({ ...f, years_experience: +e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    {[0,1,2,3,4,5,6,7,8,9,10,12,15,20].map((n) => <option key={n} value={n}>{n === 0 ? "New grad" : `${n}+ years`}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={f.linkedin_url} onChange={(v) => setF({ ...f, linkedin_url: v })} />
                <Input label="GitHub URL" placeholder="https://github.com/..." value={f.github_url} onChange={(v) => setF({ ...f, github_url: v })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-text">Background</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {BACKGROUNDS.map(({ v, label, icon: Icon }) => (
                    <button key={v} type="button" onClick={() => setF({ ...f, background: v })} className={`rounded-lg border-2 p-3 text-center ${f.background === v ? "border-indigo bg-indigo/5" : "border-border"}`}>
                      <Icon className={`mx-auto h-4 w-4 ${f.background === v ? "text-indigo" : "text-muted-text"}`} />
                      <div className="mt-1 text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={saveStep1} disabled={saving || !f.headline || !f.location} className="inline-flex items-center gap-2 rounded-lg bg-indigo px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">Your work & idea</h1>
            <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-card">
              <div>
                <label className="text-xs font-semibold text-muted-text">Skills</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILLS_LIST.map((s) => {
                    const on = f.skills.includes(s);
                    return <button key={s} type="button" onClick={() => setF({ ...f, skills: on ? f.skills.filter((x) => x !== s) : [...f.skills, s] })} className={`rounded-md px-2.5 py-1 text-xs font-medium ${on ? "bg-indigo text-white" : "bg-surface-2 text-muted-text hover:bg-indigo/10"}`}>{s}</button>;
                  })}
                </div>
                <input placeholder="Add a custom skill" value={f.custom_skill} onChange={(e) => setF({ ...f, custom_skill: e.target.value })} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-text">Industry focus</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((s) => {
                    const on = f.industry_focus.includes(s);
                    return <button key={s} type="button" onClick={() => setF({ ...f, industry_focus: on ? f.industry_focus.filter((x) => x !== s) : [...f.industry_focus, s] })} className={`rounded-md px-2.5 py-1 text-xs font-medium ${on ? "bg-indigo text-white" : "bg-surface-2 text-muted-text hover:bg-indigo/10"}`}>{s}</button>;
                  })}
                </div>
              </div>
              <CardChoice label="Commitment" value={f.commitment} onChange={(v) => setF({ ...f, commitment: v as typeof f.commitment })} options={[["full_time","Full-time"],["part_time","Part-time"],["exploring","Exploring"]]} />
              <CardChoice label="Stage" value={f.idea_stage} onChange={(v) => setF({ ...f, idea_stage: v as typeof f.idea_stage })} options={[["idea","Just an idea"],["mvp","Building MVP"],["revenue","Have revenue"],["funded","Already funded"]]} />
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={f.has_idea} onChange={(e) => setF({ ...f, has_idea: e.target.checked })} className="h-4 w-4 rounded" />
                  I have an idea I'm exploring
                </label>
                {f.has_idea && (
                  <div className="mt-3 space-y-3 rounded-lg bg-surface p-4">
                    <select value={f.idea_industry} onChange={(e) => setF({ ...f, idea_industry: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                    <textarea rows={2} placeholder="One-line description of the idea" value={f.idea_description} onChange={(e) => setF({ ...f, idea_description: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-text">Equity offer to a co-founder: <span className="text-foreground">{f.equity_offer}%</span></label>
                <input type="range" min={10} max={60} step={5} value={f.equity_offer} onChange={(e) => setF({ ...f, equity_offer: +e.target.value })} className="mt-2 w-full accent-indigo" />
              </div>
              <CardChoice label="Exit vision" value={f.exit_vision} onChange={(v) => setF({ ...f, exit_vision: v as typeof f.exit_vision })} options={[["lifestyle","Lifestyle"],["acquisition","Get acquired"],["ipo","Go public"]]} />
              <CardChoice label="Work location preference" value={f.remote_pref} onChange={(v) => setF({ ...f, remote_pref: v as typeof f.remote_pref })} options={[["onsite","On-site"],["hybrid","Hybrid"],["remote","Remote"]]} />
              <div>
                <label className="text-xs font-semibold text-muted-text">What I'm looking for in a co-founder</label>
                <p className="text-[11px] text-muted-text">Skills or backgrounds that complement yours.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILLS_LIST.map((s) => {
                    const on = f.looking_for.includes(s);
                    return <button key={s} type="button" onClick={() => setF({ ...f, looking_for: on ? f.looking_for.filter((x) => x !== s) : [...f.looking_for, s] })} className={`rounded-md px-2.5 py-1 text-xs font-medium ${on ? "bg-orange text-white" : "bg-surface-2 text-muted-text hover:bg-orange/10"}`}>{s}</button>;
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="rounded-lg border px-4 py-2 text-sm">Back</button>
              <button onClick={saveStep2} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Pick 4 prompts</h1>
              <p className="mt-1 text-sm text-muted-text">These are the moments a co-founder will connect with. Selected {selectedPrompts.length}/4.</p>
            </div>
            <div className="grid gap-3">
              {PROMPTS.map((q) => {
                const idx = selectedPrompts.findIndex((p) => p.q === q);
                const selected = idx !== -1;
                return (
                  <div key={q} className={`rounded-2xl border-2 bg-white p-4 shadow-card transition ${selected ? "border-indigo" : "border-transparent"}`}>
                    <button type="button" onClick={() => {
                      if (selected) setSelectedPrompts(selectedPrompts.filter((_, i) => i !== idx));
                      else if (selectedPrompts.length < 4) setSelectedPrompts([...selectedPrompts, { q, a: "" }]);
                    }} className="flex w-full items-center justify-between text-left">
                      <span className="text-sm font-semibold">{q}</span>
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${selected ? "bg-indigo text-white" : "bg-surface-2 text-muted-text"}`}>{selected ? idx + 1 : "+"}</span>
                    </button>
                    {selected && (
                      <textarea maxLength={150} rows={2} value={selectedPrompts[idx].a} onChange={(e) => setSelectedPrompts(selectedPrompts.map((p, i) => i === idx ? { ...p, a: e.target.value } : p))} placeholder="Your answer..." className="mt-3 w-full rounded-lg border bg-surface px-3 py-2 text-sm" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="rounded-lg border px-4 py-2 text-sm">Back</button>
              <button onClick={saveStep3} disabled={saving || !canNextP} className="inline-flex items-center gap-2 rounded-lg bg-indigo px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && !generating && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Compatibility assessment</h1>
              <p className="mt-1 text-sm text-muted-text">Question {assessQ + 1} of 20 · Locked after completion.</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-indigo" style={{ width: `${((assessQ + 1) / 20) * 100}%` }} /></div>
            </div>
            <div key={assessQ} className="rounded-2xl border bg-white p-6 shadow-card animate-in fade-in slide-in-from-bottom-2">
              <div className="text-lg font-bold">{currentQ.q}</div>
              <div className="mt-4 grid gap-2">
                {currentQ.opts.map((o, i) => (
                  <button key={i} onClick={() => pickAnswer(["A","B","C","D"][i] as "A"|"B"|"C"|"D")} className="flex items-center gap-3 rounded-lg border-2 border-border p-4 text-left transition hover:border-indigo hover:bg-indigo/5">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-2 text-xs font-bold">{["A","B","C","D"][i]}</span>
                    <span className="text-sm">{o}</span>
                  </button>
                ))}
              </div>
              {assessQ > 0 && <button onClick={() => setAssessQ(assessQ - 1)} className="mt-4 text-xs text-muted-text hover:text-foreground">← Previous question</button>}
            </div>
          </div>
        )}

        {generating && (
          <div className="mt-24 flex flex-col items-center gap-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo" />
            <div>
              <div className="text-xl font-bold">Generating your compatibility profile…</div>
              <div className="mt-2 text-sm text-muted-text">Scoring across 9 dimensions and unlocking Discover.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-text">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo focus:outline-none" />
    </div>
  );
}
function CardChoice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-text">{label}</label>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={`rounded-lg border-2 p-3 text-sm font-medium ${value === v ? "border-indigo bg-indigo/5 text-indigo" : "border-border text-muted-text"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
