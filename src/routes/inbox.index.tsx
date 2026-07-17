import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { Check, X, Loader2, MessageSquare, Tag, Plus, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/")({
  component: Inbox,
});

// Built-in labels per spec
const BUILT_IN_LABELS: { name: string; color: string; emoji: string }[] = [
  { name: "Important",     color: "bg-orange text-white",  emoji: "⭐" },
  { name: "Trial Project", color: "bg-sage text-ink",      emoji: "🔄" },
  { name: "Confirmed",     color: "bg-ink text-white",     emoji: "✅" },
  { name: "Follow Up",     color: "bg-cream text-ink",     emoji: "📋" },
  { name: "Maybe",         color: "bg-white text-ink",     emoji: "📁" },
  { name: "Not a Fit",     color: "bg-red text-white",     emoji: "🚫" },
];

function labelStyle(name: string): string {
  return BUILT_IN_LABELS.find((l) => l.name === name)?.color ?? "bg-cream text-ink";
}
function labelEmoji(name: string): string {
  return BUILT_IN_LABELS.find((l) => l.name === name)?.emoji ?? "🏷️";
}

function Inbox() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"requests" | "sent" | "talking">("requests");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

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

  const { data: myLabels } = useQuery({
    queryKey: ["conv-labels", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("conversation_labels")
        .select("*").eq("founder_id", me!.id);
      return data ?? [];
    },
  });

  const { data: myPins } = useQuery({
    queryKey: ["conv-pins", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("conversation_pins")
        .select("id, conversation_id").eq("founder_id", me!.id);
      return data ?? [];
    },
  });

  const pinnedSet = useMemo(() => new Set((myPins ?? []).map((p) => p.conversation_id)), [myPins]);
  const pinIdByConv = useMemo(() => {
    const m = new Map<string, string>();
    (myPins ?? []).forEach((p) => m.set(p.conversation_id, p.id));
    return m;
  }, [myPins]);

  async function togglePin(convId: string) {
    if (!me) return;
    const existing = pinIdByConv.get(convId);
    if (existing) {
      const { error } = await supabase.from("conversation_pins").delete().eq("id", existing);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("conversation_pins").insert({ conversation_id: convId, founder_id: me.id });
      if (error) return toast.error(error.message);
      toast.success("Pinned");
    }
    qc.invalidateQueries({ queryKey: ["conv-pins", me.id] });
  }

  const labelsByConv = useMemo(() => {
    const m = new Map<string, { id: string; label: string; color: string }[]>();
    (myLabels ?? []).forEach((l) => {
      const cid = l.conversation_id;
      if (!cid) return;
      const arr = m.get(cid) ?? [];
      arr.push({ id: l.id, label: l.label, color: l.color ?? "" });
      m.set(cid, arr);
    });
    return m;
  }, [myLabels]);

  async function addLabel(convId: string, name: string) {
    if (!me) return;
    const existing = (labelsByConv.get(convId) ?? []).find((l) => l.label === name);
    if (existing) return;
    const { error } = await supabase.from("conversation_labels").insert({
      conversation_id: convId, founder_id: me.id, label: name, color: labelStyle(name),
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["conv-labels", me.id] });
  }

  async function removeLabel(labelId: string) {
    const { error } = await supabase.from("conversation_labels").delete().eq("id", labelId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["conv-labels", me?.id] });
  }

  async function respond(reqId: string, fromId: string, action: "accepted" | "declined") {
    const { error } = await supabase.from("connection_requests")
      .update({ status: action, responded_at: new Date().toISOString() }).eq("id", reqId);
    if (error) return toast.error(error.message);

    if (action === "accepted" && me) {
      const { data: convo, error: cErr } = await supabase.from("conversations").insert({
        founder_a_id: fromId, founder_b_id: me.id, request_id: reqId, stage: "talking",
      }).select().single();
      if (cErr) return toast.error(cErr.message);
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

  const filteredConvos = (conversations ?? []).filter((c) => {
    if (!labelFilter) return true;
    const labels = labelsByConv.get(c.id) ?? [];
    return labels.some((l) => l.label === labelFilter);
  }).slice().sort((a, b) => {
    const ap = pinnedSet.has(a.id) ? 1 : 0;
    const bp = pinnedSet.has(b.id) ? 1 : 0;
    return bp - ap;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <h1 className="text-3xl font-black tracking-tight">Inbox</h1>
        <div className="mt-6 flex gap-6 border-b-2 border-ink">
          {(["requests", "sent", "talking"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-black capitalize transition ${tab === t ? "text-orange" : "text-muted-text hover:text-ink"}`}>
              {t} {t === "requests" && (requests?.length ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-orange px-1.5 py-0.5 text-[10px] text-white">{requests!.length}</span>
              )}
              {t === "sent" && (sent?.length ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-white">{sent!.length}</span>
              )}
              {tab === t && <span className="absolute inset-x-0 -bottom-[2px] h-1 bg-orange" />}
            </button>
          ))}
        </div>

        {tab === "talking" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-black uppercase text-muted-text"><Tag className="inline h-3 w-3" /> Filter:</div>
            <button onClick={() => setLabelFilter(null)} className={`rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-black ${!labelFilter ? "bg-ink text-white" : "bg-white"}`}>All</button>
            {BUILT_IN_LABELS.map((l) => (
              <button key={l.name} onClick={() => setLabelFilter(labelFilter === l.name ? null : l.name)}
                className={`rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-black ${labelFilter === l.name ? l.color : "bg-white"}`}>
                {l.emoji} {l.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {tab === "requests" && requests?.map((r) => (
            <div key={r.id} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
              <div className="flex items-start gap-4">
                <Link to="/profile/$founderId" params={{ founderId: r.from_founder_id }}>
                  <img src={founderAvatar({ seed_avatar: r.founder.seed_avatar, seed_name: r.founder.seed_name, profile: r.founder.profiles })}
                    className="h-12 w-12 rounded-xl border-2 border-ink object-cover transition hover:scale-105" alt="" />
                </Link>
                <div className="flex-1">
                  <Link to="/profile/$founderId" params={{ founderId: r.from_founder_id }} className="font-black hover:text-orange">{r.founder.profiles?.full_name ?? r.founder.seed_name}</Link>
                  <div className="text-xs text-muted-text">{r.founder.headline}</div>
                  {r.prompt_question && (
                    <div className="mt-3 rounded-lg border-2 border-ink bg-cream p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-orange">Reacting to</div>
                      <div className="text-xs italic">"{r.prompt_question}"</div>
                    </div>
                  )}
                  <p className="mt-3 text-sm">{r.message}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => respond(r.id, r.from_founder_id, "accepted")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink bg-sage px-4 py-2 text-sm font-black text-ink shadow-brutal-sm">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                    <button onClick={() => respond(r.id, r.from_founder_id, "declined")}
                      className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold">
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tab === "requests" && (requests?.length ?? 0) === 0 && <Empty label="No pending requests." />}

          {tab === "sent" && sent?.map((r) => {
            const badgeStyle: Record<string, string> = {
              pending:  "bg-cream text-ink border-ink",
              accepted: "bg-sage text-ink border-ink",
              declined: "bg-red text-white border-ink",
            };
            const badge = badgeStyle[r.status ?? "pending"] ?? badgeStyle.pending;
            return (
              <div key={r.id} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm">
                <div className="flex items-start gap-4">
                  <Link to="/profile/$founderId" params={{ founderId: r.to_founder_id }}>
                    <img src={founderAvatar({ seed_avatar: r.founder.seed_avatar, seed_name: r.founder.seed_name, profile: r.founder.profiles })}
                      className="h-12 w-12 shrink-0 rounded-xl border-2 border-ink object-cover transition hover:scale-105" alt="" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-black">To {r.founder.profiles?.full_name ?? r.founder.seed_name}</div>
                        <div className="truncate text-xs text-muted-text">{r.founder.headline}</div>
                      </div>
                      <span className={`shrink-0 rounded-md border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.prompt_question && (
                      <div className="mt-3 rounded-lg border-2 border-ink bg-cream p-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-orange">Reacting to</div>
                        <div className="text-xs italic">"{r.prompt_question}"</div>
                      </div>
                    )}
                    <p className="mt-3 text-sm">{r.message}</p>
                    <div className="mt-3 text-[10px] text-muted-text">
                      Sent {new Date(r.created_at!).toLocaleDateString()}
                      {r.status === "accepted" && " · They accepted — check Talking"}
                      {r.status === "declined" && " · They passed"}
                      {r.status === "pending" && " · Waiting for reply"}
                    </div>
                    {r.status === "pending" && (
                      <button
                        onClick={async () => {
                          const { data: deleted, error } = await supabase
                            .from("connection_requests")
                            .delete()
                            .eq("id", r.id)
                            .select("id");
                          if (error) return toast.error(error.message);
                          if (!deleted || deleted.length === 0) {
                            return toast.error("Couldn't retract — permission denied.");
                          }
                          toast.success("Request retracted");
                          await qc.invalidateQueries({ queryKey: ["inbox-sent", me?.id] });
                          await qc.invalidateQueries({ queryKey: ["inbox-requests"] });
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-ink bg-red px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm hover:-translate-y-0.5 transition">
                        <X className="h-3.5 w-3.5" /> Retract request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {tab === "sent" && (sent?.length ?? 0) === 0 && <Empty label="No requests sent yet." />}

          {tab === "talking" && filteredConvos.map((c) => {
            const other = c.founder_a_id === me!.id ? c.b : c.a;
            const lastMsg = (c.messages ?? []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0];
            const labels = labelsByConv.get(c.id) ?? [];
            return (
              <div key={c.id} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-brutal-sm">
                <Link to="/inbox/$conversationId" params={{ conversationId: c.id }}
                  className="flex items-center gap-4">
                  <img src={founderAvatar({ seed_avatar: other.seed_avatar, seed_name: other.seed_name, profile: other.profiles })}
                    className="h-12 w-12 rounded-xl border-2 border-ink object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-black">{other.profiles?.full_name ?? other.seed_name}</div>
                      <div className="text-[10px] font-black uppercase text-muted-text">{c.stage?.replace("_", " ")}</div>
                    </div>
                    <div className="truncate text-xs text-muted-text">{lastMsg?.content ?? "Start the conversation →"}</div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-text" />
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {labels.map((l) => (
                    <button key={l.id} onClick={() => removeLabel(l.id)}
                      title="Click to remove"
                      className={`inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 text-[10px] font-black ${labelStyle(l.label)}`}>
                      {labelEmoji(l.label)} {l.label} <X className="h-2.5 w-2.5" />
                    </button>
                  ))}
                  <LabelPicker onPick={(name) => addLabel(c.id, name)} existing={labels.map((l) => l.label)} />
                </div>
              </div>
            );
          })}
          {tab === "talking" && filteredConvos.length === 0 && <Empty label={labelFilter ? `No conversations labelled "${labelFilter}".` : "No active conversations yet."} />}
        </div>
      </div>
    </AppShell>
  );
}

function LabelPicker({ onPick, existing }: { onPick: (name: string) => void; existing: string[] }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-md border-2 border-dashed border-ink bg-white px-2 py-0.5 text-[10px] font-black text-ink hover:bg-cream">
        <Plus className="h-2.5 w-2.5" /> Label
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border-2 border-ink bg-white p-2 shadow-brutal-sm">
          <div className="text-[10px] font-black uppercase text-muted-text">Built-in</div>
          <div className="mt-1 space-y-1">
            {BUILT_IN_LABELS.filter((l) => !existing.includes(l.name)).map((l) => (
              <button key={l.name} onClick={() => { onPick(l.name); setOpen(false); }}
                className={`flex w-full items-center gap-1.5 rounded-md border-2 border-ink px-2 py-1 text-[11px] font-black hover:opacity-90 ${l.color}`}>
                {l.emoji} {l.name}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[10px] font-black uppercase text-muted-text">Custom</div>
          <div className="mt-1 flex gap-1">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Label name"
              className="flex-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-[11px]" />
            <button onClick={() => { if (custom.trim()) { onPick(custom.trim()); setCustom(""); setOpen(false); } }}
              className="rounded-md border-2 border-ink bg-orange px-2 py-1 text-[10px] font-black text-white">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-2xl border-2 border-dashed border-ink p-12 text-center text-sm text-muted-text">{label}</div>;
}
