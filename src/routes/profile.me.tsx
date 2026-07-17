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
            initial={{ full_name: profile?.full_name ?? "", headline: me.headline ?? "", bio: me.bio ?? "", location: me.location ?? "", skills: me.skills ?? [] }}
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
