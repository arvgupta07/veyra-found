import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { SkillTag, TierBadge, VerifiedBadges } from "@/components/FounderBits";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowLeft, MapPin, Briefcase, Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile/$founderId")({
  component: FounderProfile,
});

function FounderProfile() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { founderId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["founder-profile", founderId],
    queryFn: async () => {
      const { data: f } = await supabase.from("founders")
        .select("*, profiles(full_name), founder_prompts(prompt_question, prompt_answer, display_order), assessments(*)")
        .eq("id", founderId).maybeSingle();
      return f;
    },
  });

  if (!ready) return null;
  if (isLoading) return <AppShell><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div></AppShell>;
  if (!data) return <AppShell><div className="mx-auto max-w-2xl px-4 py-12 text-center">Founder not found.</div></AppShell>;

  const name = data.profiles?.full_name ?? data.seed_name ?? "Founder";
  const prompts = (data.founder_prompts ?? []).sort((a: { display_order: number | null }, b: { display_order: number | null }) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const a = Array.isArray(data.assessments) ? data.assessments[0] : data.assessments;
  const dims = a ? [
    ["Openness", a.openness_score], ["Conscientiousness", a.conscientiousness_score],
    ["Extraversion", a.extraversion_score], ["Agreeableness", a.agreeableness_score],
    ["Neuroticism", a.neuroticism_score], ["Risk appetite", a.risk_score],
    ["Decision velocity", a.decision_velocity_score], ["Equity philosophy", a.equity_philosophy_score],
    ["Vision scale", a.vision_score],
  ] as [string, number | null][] : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/discover" className="inline-flex items-center gap-1 text-xs font-black text-muted-text hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <div className="mt-4 overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-brutal">
          <div className="bg-hero-radial p-8 pb-14">
            <div className="flex items-start gap-4">
              <img src={founderAvatar({ seed_avatar: data.seed_avatar, seed_name: data.seed_name, profile: data.profiles })}
                className="h-20 w-20 rounded-2xl border-2 border-white/20 object-cover" alt="" />
              <div className="flex-1">
                <div className="text-2xl font-black text-white">{name}</div>
                <div className="mt-1 text-sm text-white/80">{data.headline}</div>
                <div className="mt-2 flex items-center gap-3 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.location}</span>
                  {data.age && <span className="inline-flex items-center gap-1">🎂 {data.age}</span>}
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {data.years_experience}y</span>
                </div>
              </div>
              <TierBadge tier={data.trust_tier ?? "Builder"} />
            </div>
          </div>

          <div className="-mt-8 space-y-6 p-6">
            <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
              <div className="text-sm">{data.bio}</div>
              <div className="mt-3"><VerifiedBadges f={data as never} /></div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-muted-text">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(data.skills ?? []).map((s: string) => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            </div>

            {prompts.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-text">Prompts</div>
                <div className="mt-2 space-y-2">
                  {prompts.map((p: { prompt_question: string; prompt_answer: string }) => (
                    <div key={p.prompt_question} className="rounded-xl border-2 border-ink bg-cream p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-orange">{p.prompt_question}</div>
                      <div className="mt-1 text-sm font-medium">{p.prompt_answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dims.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-text">Personality dimensions</div>
                <div className="mt-3 grid gap-2">
                  {dims.map(([label, v]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-text">{v ?? "—"}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                        <div className="h-full bg-orange transition-all" style={{ width: `${v ?? 0}%` }} />
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
