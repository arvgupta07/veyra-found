import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { TrendingUp, Eye, Rocket } from "lucide-react";

export const Route = createFileRoute("/investor-feed")({
  component: InvestorFeed,
});

function InvestorFeed() {
  const { ready } = useRequireAuth();
  const { data: listings } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data } = await supabase.from("investor_feed_listings")
        .select("*, conversation:conversations(a:founders!conversations_founder_a_id_fkey(*, profiles(full_name)), b:founders!conversations_founder_b_id_fkey(*, profiles(full_name)))")
        .eq("active", true).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo/10 text-indigo"><TrendingUp className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Investor Feed</h1>
            <p className="text-sm text-muted-text">Matched founding teams actively raising.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {listings?.map((l) => {
            const a = l.conversation?.a;
            const b = l.conversation?.b;
            return (
              <article key={l.id} className="overflow-hidden rounded-2xl border bg-white shadow-card">
                <div className="bg-hero-radial p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[a, b].map((p, i) => (
                        <img key={i} src={p?.seed_avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p?.seed_name ?? "F")}`}
                          className="h-9 w-9 rounded-full border-2 border-navy object-cover" alt="" />
                      ))}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {a?.profiles?.full_name ?? a?.seed_name} × {b?.profiles?.full_name ?? b?.seed_name}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo">The idea</div>
                    <div className="mt-1 text-sm font-semibold">{l.idea_oneliner}</div>
                  </div>
                  {l.traction_metrics && (
                    <div className="rounded-lg bg-surface p-3 text-xs">
                      <div className="font-semibold text-muted-text">Traction</div>
                      <div className="mt-1">{l.traction_metrics}</div>
                    </div>
                  )}
                  <div className="flex gap-3 text-xs">
                    <div className="flex-1 rounded-lg bg-emerald/10 p-2.5">
                      <div className="text-[10px] font-semibold uppercase text-emerald">Raising</div>
                      <div className="mt-0.5 font-bold">{l.raise_amount ?? "—"}</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-surface p-2.5">
                      <div className="text-[10px] font-semibold uppercase text-muted-text">For</div>
                      <div className="mt-0.5 font-semibold">{l.raise_purpose ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-text">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {l.views ?? 0} views</span>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 font-semibold text-white">
                      <Rocket className="h-3 w-3" /> Express interest
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {listings && listings.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed p-12 text-center text-sm text-muted-text">No active listings yet.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
