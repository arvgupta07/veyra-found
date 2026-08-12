import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, GraduationCap, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { LocationInput } from "@/components/LocationInput";
import { Chip, Field, inputCls } from "@/components/MarketBits";
import { REMOTE_PREFS, TALENT_SKILLS, WORK_TYPES, normalizeUrl, toggleIn } from "@/lib/marketplace";
import { clearPendingAccountType } from "@/lib/account-types";
import { uploadDocument } from "@/lib/uploads";
import { OnboardShell, isValidLinkedIn } from "./OnboardShell";

/** Talent / intern onboarding — profile + CV. No assessment, no prompts. */
export function TalentOnboarding({ fullName }: { fullName: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useSession();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({
    full_name: fullName,
    headline: "",
    bio: "",
    location: "",
    education: "",
    desired_role: "",
    work_type: "internship" as string,
    remote_pref: "remote" as string,
    experience_years: 0,
    availability: "",
    skills: [] as string[],
    linkedin_url: "",
    portfolio_url: "",
    resume_url: "",
    open_to_equity: false,
  });

  const valid =
    f.full_name.trim() &&
    f.headline.trim() &&
    f.bio.trim().length >= 30 &&
    f.location.trim() &&
    f.education.trim() &&
    f.desired_role.trim() &&
    f.skills.length > 0 &&
    isValidLinkedIn(f.linkedin_url) &&
    !!f.resume_url.trim();

  async function pickCv(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadDocument(file, "cv");
      setF((x) => ({ ...x, resume_url: url }));
      toast.success("CV uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!session) return;
    if (!valid) {
      if (f.bio.trim().length < 30) return toast.error("Add at least 30 characters about yourself.");
      if (!f.education.trim()) return toast.error("Education is required.");
      if (!f.desired_role.trim()) return toast.error("Tell us the role you want.");
      if (f.skills.length === 0) return toast.error("Pick at least one skill.");
      if (!isValidLinkedIn(f.linkedin_url)) return toast.error("A valid LinkedIn profile URL (linkedin.com/in/...) is required.");
      if (!f.resume_url.trim()) return toast.error("A CV is required — upload a file or paste a link.");
      return toast.error("Please fill in the required fields.");
    }
    setSaving(true);
    const uid = session.user.id;

    await supabase.from("profiles").update({ full_name: f.full_name, account_type: "talent" }).eq("id", uid);

    const { data: existingFounder } = await supabase.from("founders").select("id").eq("user_id", uid).maybeSingle();
    const memberRow = {
      user_id: uid,
      account_type: "talent",
      headline: f.headline,
      bio: f.bio,
      location: f.location,
      education: f.education,
      skills: f.skills,
      linkedin_url: normalizeUrl(f.linkedin_url),
      profile_complete: true,
      looking_for: [] as string[],
    };
    if (existingFounder) await supabase.from("founders").update(memberRow).eq("id", existingFounder.id);
    else await supabase.from("founders").insert(memberRow);

    const { data: mine } = await supabase.from("talent_profiles").select("id").eq("user_id", uid).maybeSingle();
    const row = {
      user_id: uid,
      full_name: f.full_name,
      headline: f.headline,
      bio: f.bio,
      location: f.location,
      education: f.education,
      desired_role: f.desired_role,
      work_type: f.work_type,
      remote_pref: f.remote_pref,
      experience_years: f.experience_years,
      availability: f.availability || null,
      skills: f.skills,
      linkedin_url: normalizeUrl(f.linkedin_url),
      portfolio_url: normalizeUrl(f.portfolio_url),
      resume_url: normalizeUrl(f.resume_url),
      open_to_equity: f.open_to_equity,
      is_public: true,
    };
    const { error } = mine
      ? await supabase.from("talent_profiles").update(row).eq("id", mine.id)
      : await supabase.from("talent_profiles").insert(row);
    setSaving(false);
    if (error) return toast.error(error.message);

    clearPendingAccountType();
    await qc.invalidateQueries();
    toast.success("Profile ready!");
    router.navigate({ to: "/discover" });
  }

  return (
    <OnboardShell
      icon={GraduationCap}
      kicker="Talent / Intern"
      title="Set up your talent profile"
      subtitle="No assessment, no prompts — a clean profile with your CV. Founders hiring for open roles can find you, and you can reach out to them with a note."
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name *"><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Headline *"><input className={inputCls} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="Final-year CS student, React + Node" /></Field>
        </div>

        <Field label="About you * (min 30 chars)">
          <textarea rows={3} maxLength={400} className={inputCls} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="What you've built, what you want to work on." />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location *"><LocationInput value={f.location} onChange={(v) => setF({ ...f, location: v })} placeholder="Start typing a city…" /></Field>
          <Field label="Education *"><input className={inputCls} value={f.education} onChange={(e) => setF({ ...f, education: e.target.value })} placeholder="BTech CSE, VIT Vellore — 2026" /></Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Role you want *"><input className={inputCls} value={f.desired_role} onChange={(e) => setF({ ...f, desired_role: e.target.value })} placeholder="Frontend engineering intern" /></Field>
          <Field label="Years of experience">
            <input type="number" min={0} max={40} className={inputCls} value={f.experience_years}
              onChange={(e) => setF({ ...f, experience_years: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })} />
          </Field>
        </div>

        <Field label="Looking for *">
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map((t) => (
              <Chip key={t.v} active={f.work_type === t.v} onClick={() => setF({ ...f, work_type: t.v })}>{t.label}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Work style">
          <div className="flex flex-wrap gap-2">
            {REMOTE_PREFS.map((t) => (
              <Chip key={t.v} active={f.remote_pref === t.v} onClick={() => setF({ ...f, remote_pref: t.v })}>{t.label}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Skills *">
          <div className="flex flex-wrap gap-2">
            {TALENT_SKILLS.map((s) => (
              <Chip key={s} active={f.skills.includes(s)} onClick={() => setF({ ...f, skills: toggleIn(f.skills, s) })}>{s}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Availability"><input className={inputCls} value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} placeholder="20 hrs/week, from January" /></Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="LinkedIn *"><input className={inputCls} value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="Portfolio / GitHub"><input className={inputCls} value={f.portfolio_url} onChange={(e) => setF({ ...f, portfolio_url: e.target.value })} placeholder="github.com/you" /></Field>
        </div>

        <Field label="CV *">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <input className={inputCls} value={f.resume_url} onChange={(e) => setF({ ...f, resume_url: e.target.value })} placeholder="Paste a link, or upload a PDF →" />
            <label className="flex cursor-pointer items-center justify-center gap-2 border-[3px] border-ink bg-cream px-3 py-2 text-xs font-black uppercase shadow-brutal-sm box-hover">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload PDF
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => void pickCv(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </Field>

        <label className="flex items-center gap-2 text-xs font-black uppercase">
          <input type="checkbox" checked={f.open_to_equity} onChange={(e) => setF({ ...f, open_to_equity: e.target.checked })} className="h-4 w-4 accent-orange" />
          Open to equity-heavy offers
        </label>

        <button onClick={save} disabled={saving || uploading}
          className="mt-2 flex items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase shadow-brutal-sm box-hover disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Finish setup
        </button>
      </div>
    </OnboardShell>
  );
}
