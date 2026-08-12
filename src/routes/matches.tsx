import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { VerifyBanner } from "@/components/VerifyGate";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConnectedIds } from "@/hooks/useConnectedIds";
import { TierBadge, VerifiedBadges, SkillTag } from "@/components/FounderBits";
import { founderAvatar } from "@/lib/founder-types";
import { scoreCompatibility, bandLabel } from "@/lib/compatibility";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
  head: () => ({
    meta: [
      { title: "Your Co-Founder Matches — Veyra Found" },
      { name: "description", content: "See the founders who accepted your request, review compatibility scores and start the conversation that turns a match into a co-founder." },
      { property: "og:title", content: "Your Co-Founder Matches — Veyra Found" },
      { property: "og:description", content: "Mutual matches with compatibility scores, ready to message on Veyra Found." },
      { property: "og:url", content: "https://veyrafound.in/matches" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/matches" }],
  }),
});

function MatchesPage() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();


  const { data: myAssessment } = useQuery({
    queryKey: ["my-assessment", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("assessments").select("*").eq("founder_id", me!.id).maybeSingle();
      return data;
    },
  });

  const { data: pool } = useQuery({
    queryKey: ["matches-pool", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("founders")
        .select("*, profiles(full_name), assessments(*), founder_prompts(prompt_question, prompt_answer, display_order)")
        .eq("profile_complete", true).neq("id", me!.id).limit(60);
      return data ?? [];
    },
  });

  const connectedIds = useConnectedIds(me?.id);

  const ranked = useMemo(() => {
    if (!pool || !myAssessment) return [];
    return pool
      .filter((f) => !connectedIds.has(f.id))
      .map((f: Record<string, unknown> & { assessments?: unknown }) => {
        const a = Array.isArray(f.assessments) ? f.assessments[0] : f.assessments;
        return { f, score: scoreCompatibility(myAssessment as Record<string, unknown>, a as Record<string, unknown> | null) };
      })
      .sort((a, b) => b.score - a.score);
  }, [pool, myAssessment, connectedIds]);

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <VerifyBanner />
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Your matches</h1>
            <p className="mt-1 text-sm text-muted-text">Ranked by compatibility with your assessment.</p>
          </div>
        </div>

        {ranked.length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-ink p-12 text-center text-sm text-muted-text">
            Finding compatible founders — check back soon.
          </div>
        )}

        <div className="mt-6 space-y-3">
          {ranked.map(({ f, score }, i) => (
            <MatchRow key={(f as { id: string }).id} f={f as never} score={score} rank={i + 1} />
          ))}
        </div>
      </div>

    </AppShell>
  );
}

function MatchRow({ f, score, rank }: { f: Record<string, unknown> & { id: string }; score: number; rank: number }) {
  const founder = f as Record<string, unknown> & {
    id: string;
    seed_name?: string | null;
    seed_avatar?: string | null;
    profiles?: { full_name?: string | null } | null;
    headline?: string | null;
    location?: string | null;
    skills?: string[];
    trust_tier?: "Builder" | "Maker" | "Veteran";
    linkedin_verified?: boolean;
    github_verified?: boolean;
    aadhaar_verified?: boolean;
  };
  const name = founder.profiles?.full_name ?? founder.seed_name ?? "Founder";
  const band = bandLabel(score);
  return (
    <article className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brutal box-hover md:p-5">
      <div className="flex items-start gap-4">
        <img
          src={founderAvatar({ seed_avatar: founder.seed_avatar ?? null, seed_name: founder.seed_name ?? null, profile: founder.profiles ?? null })}
          alt={name}
          className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-black text-muted-text">#{rank}</div>
            <div className="truncate text-base font-black">{name}</div>
            <TierBadge tier={(founder.trust_tier ?? "Builder")} />
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-text">{founder.headline}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-text">
            <MapPin className="h-3 w-3" /> {founder.location ?? "—"}
          </div>
          <div className="mt-2">
            <VerifiedBadges f={founder as never} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(founder.skills ?? []).slice(0, 5).map((s) => <SkillTag key={s}>{s}</SkillTag>)}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="grid h-16 w-16 place-items-center rounded-xl border-2 border-ink bg-sage font-black shadow-brutal-sm">
            <div className="text-2xl leading-none">{score}</div>
            <div className="text-[9px] uppercase">match</div>
          </div>
          <span className={`rounded-md border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase ${band.cls}`}>{band.label}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to="/profile/$founderId"
          params={{ founderId: founder.id }}
          className="flex-1 rounded-lg border-2 border-ink bg-white py-2 text-center text-xs font-black shadow-brutal-sm box-hover"
        >
          View profile
        </Link>
        <Link
          to="/profile/$founderId"
          params={{ founderId: founder.id }}
          hash="connect"
          className="flex-1 rounded-lg border-2 border-ink bg-orange py-2 text-center text-xs font-black text-white shadow-brutal-sm box-hover"
        >
          Message
        </Link>
      </div>
    </article>
  );
}
