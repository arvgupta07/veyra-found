import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { Check, X, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/")({
  component: Inbox,
});

function Inbox() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const [tab, setTab] = useState<"requests" | "sent" | "talking">("requests");

  const { data: requests, refetch: refetchReq } = useQuery({
    queryKey: ["inbox-requests", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("connection_requests")
        .select("*, founder:founders!connection_requests_from_founder_id_fkey(*, profiles(full_name))")
        .eq("to_founder_id", me!.id).eq("status", "pending").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: sent } = useQuery({
    queryKey: ["inbox-sent", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("connection_requests")
        .select("*, founder:founders!connection_requests_to_founder_id_fkey(*, profiles(full_name))")
        .eq("from_founder_id", me!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ["inbox-convos", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("conversations")
        .select("*, a:founders!conversations_founder_a_id_fkey(*, profiles(full_name)), b:founders!conversations_founder_b_id_fkey(*, profiles(full_name)), messages(content, created_at)")
        .or(`founder_a_id.eq.${me!.id},founder_b_id.eq.${me!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function respond(reqId: string, fromId: string, action: "accepted" | "declined") {
    const { error } = await supabase.from("connection_requests")
      .update({ status: action, responded_at: new Date().toISOString() }).eq("id", reqId);
    if (error) return toast.error(error.message);

    if (action === "accepted" && me) {
      const { data: convo, error: cErr } = await supabase.from("conversations").insert({
        founder_a_id: fromId, founder_b_id: me.id, request_id: reqId, stage: "talking",
      }).select().single();
      if (cErr) return toast.error(cErr.message);
      // Fire and forget AI report generation
      try {
        const mod = await import("@/lib/compat.functions");
        mod.generateCompatibilityReport({ data: { conversationId: convo.id } }).catch(() => {});
      } catch {}
      toast.success("Connected! Chat unlocked.");
    } else {
      toast("Request declined.");
    }
    refetchReq();
  }

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <h1 className="text-3xl font-black tracking-tight">Inbox</h1>
        <div className="mt-6 flex gap-6 border-b">
          {(["requests", "sent", "talking"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-semibold capitalize transition ${tab === t ? "text-indigo" : "text-muted-text hover:text-foreground"}`}>
              {t} {t === "requests" && (requests?.length ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-indigo px-1.5 py-0.5 text-[10px] text-white">{requests!.length}</span>
              )}
              {t === "sent" && (sent?.length ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-white">{sent!.length}</span>
              )}
              {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo" />}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {tab === "requests" && requests?.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-white p-5 shadow-card">
              <div className="flex items-start gap-4">
                <img src={founderAvatar({ seed_avatar: r.founder.seed_avatar, seed_name: r.founder.seed_name, profile: r.founder.profiles })}
                  className="h-12 w-12 rounded-xl object-cover" alt="" />
                <div className="flex-1">
                  <div className="font-bold">{r.founder.profiles?.full_name ?? r.founder.seed_name}</div>
                  <div className="text-xs text-muted-text">{r.founder.headline}</div>
                  {r.prompt_question && (
                    <div className="mt-3 rounded-lg bg-indigo/5 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo">Reacting to</div>
                      <div className="text-xs italic">"{r.prompt_question}"</div>
                    </div>
                  )}
                  <p className="mt-3 text-sm">{r.message}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => respond(r.id, r.from_founder_id, "accepted")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                    <button onClick={() => respond(r.id, r.from_founder_id, "declined")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-surface">
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tab === "requests" && (requests?.length ?? 0) === 0 && <Empty label="No pending requests." />}

          {tab === "sent" && sent?.map((r) => {
            const statusStyle: Record<string, string> = {
              pending: "bg-amber/20 text-ink border-ink",
              accepted: "bg-sage text-ink border-ink",
              declined: "bg-red/20 text-ink border-ink",
            };
            const badge = statusStyle[r.status ?? "pending"] ?? statusStyle.pending;
            return (
              <div key={r.id} className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brutal-sm">
                <div className="flex items-start gap-4">
                  <img src={founderAvatar({ seed_avatar: r.founder.seed_avatar, seed_name: r.founder.seed_name, profile: r.founder.profiles })}
                    className="h-12 w-12 shrink-0 rounded-xl border-2 border-ink object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-bold">To {r.founder.profiles?.full_name ?? r.founder.seed_name}</div>
                        <div className="truncate text-xs text-muted-text">{r.founder.headline}</div>
                      </div>
                      <span className={`shrink-0 rounded-md border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.prompt_question && (
                      <div className="mt-3 rounded-lg border-2 border-ink bg-white p-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-orange">Reacting to</div>
                        <div className="text-xs italic">"{r.prompt_question}"</div>
                      </div>
                    )}
                    <p className="mt-3 text-sm">{r.message}</p>
                    <div className="mt-2 text-[10px] text-muted-text">
                      Sent {new Date(r.created_at!).toLocaleDateString()}
                      {r.status === "accepted" && " · They accepted — check Talking"}
                      {r.status === "declined" && " · They passed"}
                      {r.status === "pending" && " · Waiting for reply"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {tab === "sent" && (sent?.length ?? 0) === 0 && <Empty label="No requests sent yet." />}


          {tab === "talking" && conversations?.map((c) => {
            const other = c.founder_a_id === me!.id ? c.b : c.a;
            const lastMsg = (c.messages ?? []).sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0];
            return (
              <Link key={c.id} to="/inbox/$conversationId" params={{ conversationId: c.id }}
                className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card hover:border-indigo">
                <img src={founderAvatar({ seed_avatar: other.seed_avatar, seed_name: other.seed_name, profile: other.profiles })}
                  className="h-12 w-12 rounded-xl object-cover" alt="" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">{other.profiles?.full_name ?? other.seed_name}</div>
                    <div className="text-[10px] text-muted-text">{c.stage?.replace("_", " ")}</div>
                  </div>
                  <div className="truncate text-xs text-muted-text">{lastMsg?.content ?? "Start the conversation →"}</div>
                </div>
                <MessageSquare className="h-4 w-4 text-muted-text" />
              </Link>
            );
          })}
          {tab === "talking" && (conversations?.length ?? 0) === 0 && <Empty label="No active conversations yet." />}
        </div>
      </div>
    </AppShell>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-2xl border-2 border-dashed p-12 text-center text-sm text-muted-text">{label}</div>;
}
