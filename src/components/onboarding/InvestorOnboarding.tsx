import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Landmark, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { LocationInput } from "@/components/LocationInput";
import { Chip, Field, inputCls } from "@/components/MarketBits";
import { INDUSTRIES, INVEST_STAGES, normalizeUrl, toggleIn } from "@/lib/marketplace";
import { clearPendingAccountType } from "@/lib/account-types";
import { OnboardShell, StepBar, isValidLinkedIn } from "./OnboardShell";


const FIRM_TYPES = [
  { v: "angel", label: "Angel" },
  { v: "syndicate", label: "Syndicate" },
  { v: "vc_fund", label: "VC fund" },
  { v: "family_office", label: "Family office" },
  { v: "accelerator", label: "Accelerator" },
  { v: "other", label: "Other" },
] as const;

const STEPS = ["Firm", "Thesis & cheque", "Portfolio & links"];

/** Investor onboarding — a 3-step profile. No compatibility assessment, no prompts. */
export function InvestorOnboarding({ fullName }: { fullName: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { session } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    full_name: fullName,
    fund_name: "",
    firm_type: "angel" as string,
    headline: "",
    bio: "",
    thesis: "",
    location: "",
    companies_invested: 0,
    notable_investments: "",
    check_size_min: "",
    check_size_max: "",
    linkedin_url: "",
    website_url: "",
    industries: [] as string[],
    stages: [] as string[],
  });

  const valid =
    f.full_name.trim() &&
    f.fund_name.trim() &&
    f.headline.trim() &&
    f.bio.trim().length >= 30 &&
    f.location.trim() &&
    isValidLinkedIn(f.linkedin_url) &&
    f.stages.length > 0;

  async function save() {
    if (!session) return;
    if (!valid) {
      if (!f.fund_name.trim()) return toast.error("Tell us your firm, fund or angel name.");
      if (f.bio.trim().length < 30) return toast.error("Add at least 30 characters about your investing.");
      if (!f.location.trim()) return toast.error("Location is required.");
      if (!isValidLinkedIn(f.linkedin_url)) return toast.error("A valid LinkedIn profile URL (linkedin.com/in/...) is required.");
      if (f.stages.length === 0) return toast.error("Pick at least one stage you invest at.");
      return toast.error("Please fill in the required fields.");
    }
    setSaving(true);
    const uid = session.user.id;

    await supabase.from("profiles").update({ full_name: f.full_name, account_type: "investor" }).eq("id", uid);

    // Lightweight member record so investors can message and request founders,
    // without showing up in the co-founder discovery feed.
    const { data: existingFounder } = await supabase.from("founders").select("id").eq("user_id", uid).maybeSingle();
    const memberRow = {
      user_id: uid,
      account_type: "investor",
      headline: f.headline,
      bio: f.bio,
      location: f.location,
      linkedin_url: normalizeUrl(f.linkedin_url),
      profile_complete: true,
      looking_for: [] as string[],
    };
    if (existingFounder) await supabase.from("founders").update(memberRow).eq("id", existingFounder.id);
    else await supabase.from("founders").insert(memberRow);

    const { data: mine } = await supabase.from("investor_profiles").select("id").eq("user_id", uid).maybeSingle();
    const row = {
      user_id: uid,
      fund_name: f.fund_name,
      firm_type: f.firm_type,
      headline: f.headline,
      bio: f.bio,
      thesis: f.thesis || null,
      location: f.location,
      companies_invested: f.companies_invested || 0,
      notable_investments: f.notable_investments || null,
      check_size_min: f.check_size_min ? Number(f.check_size_min) : null,
      check_size_max: f.check_size_max ? Number(f.check_size_max) : null,
      linkedin_url: normalizeUrl(f.linkedin_url),
      website_url: normalizeUrl(f.website_url),
      industries: f.industries,
      stages: f.stages,
      is_public: true,
    };
    const { error } = mine
      ? await supabase.from("investor_profiles").update(row).eq("id", mine.id)
      : await supabase.from("investor_profiles").insert(row);
    setSaving(false);
    if (error) return toast.error(error.message);

    clearPendingAccountType();
    await qc.invalidateQueries();
    toast.success("Investor profile ready!");
    router.navigate({ to: "/discover" });
  }

  return (
    <OnboardShell
      icon={Landmark}
      kicker="Investor"
      title="Set up your investor profile"
      subtitle="No assessment, no prompts — just your firm, thesis and cheque size. Founders can then reach out to you, and you can pitch them a note."
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name *"><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Fund / firm / angel name *"><input className={inputCls} value={f.fund_name} onChange={(e) => setF({ ...f, fund_name: e.target.value })} placeholder="e.g. Blume Ventures, or Angel — Arjun M" /></Field>
        </div>

        <Field label="Firm type *">
          <div className="flex flex-wrap gap-2">
            {FIRM_TYPES.map((t) => (
              <Chip key={t.v} active={f.firm_type === t.v} onClick={() => setF({ ...f, firm_type: t.v })}>{t.label}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Headline *"><input className={inputCls} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} placeholder="Pre-seed cheques into Indian SaaS" /></Field>

        <Field label="About your investing * (min 30 chars)">
          <textarea rows={3} maxLength={400} className={inputCls} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Who you back, how you help, how you decide." />
        </Field>

        <Field label="Investment thesis">
          <textarea rows={2} maxLength={400} className={inputCls} value={f.thesis} onChange={(e) => setF({ ...f, thesis: e.target.value })} placeholder="What you're actively looking for right now." />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location *"><LocationInput value={f.location} onChange={(v) => setF({ ...f, location: v })} placeholder="Start typing a city…" /></Field>
          <Field label="Companies invested in">
            <input type="number" min={0} max={999} className={inputCls} value={f.companies_invested}
              onChange={(e) => setF({ ...f, companies_invested: Math.max(0, Math.min(999, Number(e.target.value) || 0)) })} />
          </Field>
        </div>

        <Field label="Notable investments">
          <input className={inputCls} value={f.notable_investments} onChange={(e) => setF({ ...f, notable_investments: e.target.value })} placeholder="Comma separated — e.g. Zepto, Slice, Wint Wealth" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cheque size min (₹)"><input type="number" min={0} className={inputCls} value={f.check_size_min} onChange={(e) => setF({ ...f, check_size_min: e.target.value })} placeholder="500000" /></Field>
          <Field label="Cheque size max (₹)"><input type="number" min={0} className={inputCls} value={f.check_size_max} onChange={(e) => setF({ ...f, check_size_max: e.target.value })} placeholder="5000000" /></Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="LinkedIn *"><input className={inputCls} value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="Website"><input className={inputCls} value={f.website_url} onChange={(e) => setF({ ...f, website_url: e.target.value })} placeholder="fund.com" /></Field>
        </div>

        <Field label="Stages you invest at *">
          <div className="flex flex-wrap gap-2">
            {INVEST_STAGES.map((s) => (
              <Chip key={s} active={f.stages.includes(s)} onClick={() => setF({ ...f, stages: toggleIn(f.stages, s) })}>{s}</Chip>
            ))}
          </div>
        </Field>

        <Field label="Industries">
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((s) => (
              <Chip key={s} active={f.industries.includes(s)} onClick={() => setF({ ...f, industries: toggleIn(f.industries, s) })}>{s}</Chip>
            ))}
          </div>
        </Field>

        <button onClick={save} disabled={saving}
          className="mt-2 flex items-center justify-center gap-2 border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase shadow-brutal-sm box-hover disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Finish setup
        </button>
      </div>
    </OnboardShell>
  );
}
