import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { isDockViewport, openDockedChat } from "@/lib/chat-dock";
import { AppShell } from "@/components/AppShell";
import { VerifyBanner } from "@/components/VerifyGate";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { Check, X, Loader2, MessageSquare, Tag, Plus, Pin, PinOff, UserMinus } from "lucide-react";
import { useUnreadConversations } from "@/hooks/useLiveInbox";
import { toast } from "sonner";


export const Route = createFileRoute("/inbox/")({
  component: Inbox,
  head: () => ({
    meta: [
      { title: "Inbox & Requests — Veyra Found" },
      { name: "description", content: "Manage co-founder conversations, sent and received requests, labels and pinned chats in your Veyra Found inbox." },
      { property: "og:title", content: "Inbox & Requests — Veyra Found" },
      { property: "og:description", content: "Conversations, sent and received co-founder requests, labels and pinned chats." },
      { property: "og:url", content: "https://veyrafound.in/inbox" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/inbox" }],
  }),
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
  const unread = useUnreadConversations();


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
        .eq("from_founder_id", me!.id)
        .neq("status", "accepted")
        .order("created_at", { ascending: false });
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

  async function disconnect(otherFounderId: string) {
    if (!me) return;
    if (!window.confirm("Remove this connection? The chat history is deleted and you'll both need to send a new request to reconnect.")) return;
    const { error } = await supabase.rpc("disconnect_founder", { _other_founder_id: otherFounderId });
    if (error) return toast.error(error.message);
    toast.success("Connection removed");
    qc.invalidateQueries({ queryKey: ["inbox-convos"] });
    qc.invalidateQueries({ queryKey: ["inbox-requests"] });
    qc.invalidateQueries({ queryKey: ["connected-ids"] });
    qc.invalidateQueries({ queryKey: ["matches-pool"] });
  }

  async function clearChat(convId: string) {
    if (!window.confirm("Delete this chat? Every message will be removed for both of you. You'll stay connected.")) return;
    const { error } = await supabase.rpc("clear_conversation", { _conversation_id: convId });
    if (error) return toast.error(error.message);
    toast.success("Chat deleted");
    qc.invalidateQueries({ queryKey: ["inbox-convos"] });
    qc.invalidateQueries({ queryKey: ["messages", convId] });
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

  // Filter chips = built-in labels + every custom label the user has created.
  const filterChips = useMemo(() => {
    const counts = new Map<string, number>();
    (myLabels ?? []).forEach((l) => {
      counts.set(l.label, (counts.get(l.label) ?? 0) + 1);
    });
    const builtInNames = new Set(BUILT_IN_LABELS.map((l) => l.name));
    const custom = [...counts.keys()].filter((n) => !builtInNames.has(n)).sort();
    return [
      ...BUILT_IN_LABELS.map((l) => ({ name: l.name, emoji: l.emoji, color: l.color, count: counts.get(l.name) ?? 0 })),
      ...custom.map((n) => ({ name: n, emoji: "🏷️", color: labelStyle(n), count: counts.get(n) ?? 0 })),
    ];
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
        <VerifyBanner />
        <h1 className="text-3xl font-black tracking-tight">Inbox</h1>
        <div className="mt-6 flex gap-2 border-[3px] border-ink bg-white p-1.5 shadow-brutal-sm soft-corners">
          {(["requests", "sent", "talking"] as const).map((t) => {
            const count = t === "requests" ? (requests?.length ?? 0)
              : t === "sent" ? (sent?.length ?? 0)
              : (conversations?.length ?? 0);
            const badgeCls = t === "requests" ? "bg-orange text-white"
              : t === "sent" ? "bg-ink text-white"
              : "bg-sage text-ink";
            const activeTab = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`relative flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider transition soft-corners ${
                  activeTab ? "border-2 border-ink bg-cream text-ink shadow-brutal-sm bg-hatch" : "text-muted-text hover:text-ink"
                }`}>
                {t}
                {count > 0 && (
                  <span className={`grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink px-1 text-[10px] font-black ${badgeCls}`}>
                    {count}
                  </span>
                )}
                {t === "talking" && unread.length > 0 && (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-ink bg-red" />
                )}
              </button>
            );
          })}
        </div>


        {tab === "talking" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-black uppercase text-muted-text"><Tag className="inline h-3 w-3" /> Filter:</div>
            <button onClick={() => setLabelFilter(null)}
              className={`rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-black transition ${!labelFilter ? "bg-ink text-white shadow-brutal-sm -translate-y-0.5 ring-2 ring-orange" : "bg-white opacity-80 hover:opacity-100"}`}>
              All <span className="opacity-70">{conversations?.length ?? 0}</span>
            </button>
            {filterChips.map((l) => {
              const on = labelFilter === l.name;
              return (
                <button key={l.name} onClick={() => setLabelFilter(on ? null : l.name)}
                  className={`inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-0.5 text-[11px] font-black transition ${on ? `${l.color} shadow-brutal-sm -translate-y-0.5 ring-2 ring-orange` : "bg-white opacity-80 hover:opacity-100 hover:-translate-y-0.5"}`}>
                  {on && <Check className="h-3 w-3" />}
                  {l.emoji} {l.name} <span className="opacity-70">{l.count}</span>
                </button>
              );
            })}
            {filterChips.length === 0 && (
              <span className="text-[11px] text-muted-text">Add a label to a chat to filter by it.</span>
            )}
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
            const pinned = pinnedSet.has(c.id);
            const isUnread = unread.includes(c.id);
            return (
              <div key={c.id} className={`rounded-2xl border-2 border-ink p-4 shadow-brutal-sm ${isUnread ? "bg-cream ring-2 ring-red" : pinned ? "bg-cream" : "bg-white"}`}>
                <div className="flex items-center gap-4">
                  <Link to="/inbox/$conversationId" params={{ conversationId: c.id }} className="flex flex-1 items-center gap-4 min-w-0"
                    onClick={(e) => { if (isDockViewport()) { e.preventDefault(); openDockedChat(c.id); } }}>
                    <span className="relative shrink-0">
                      <img src={founderAvatar({ seed_avatar: other.seed_avatar, seed_name: other.seed_name, profile: other.profiles })}
                        className="h-12 w-12 rounded-xl border-2 border-ink object-cover" alt="" />
                      {isUnread && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-ink bg-red" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {pinned && <Pin className="h-3 w-3 fill-orange text-orange" />}
                        <div className="font-black truncate">{other.profiles?.full_name ?? other.seed_name}</div>
                        <div className="ml-auto text-[10px] font-black uppercase text-muted-text">{c.stage?.replace("_", " ")}</div>
                      </div>
                      <div className={`truncate text-xs ${isUnread ? "font-bold text-ink" : "text-muted-text"}`}>{lastMsg?.content ?? "Start the conversation →"}</div>
                    </div>

                    <MessageSquare className="h-4 w-4 text-muted-text" />
                  </Link>
                  <button onClick={() => togglePin(c.id)}
                    title={pinned ? "Unpin" : "Pin to top"}
                    className={`shrink-0 rounded-md border-2 border-ink p-2 shadow-brutal-sm box-hover ${pinned ? "bg-orange text-white" : "bg-white text-ink"}`}>
                    {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => clearChat(c.id)}
                    title="Delete chat (keeps connection)"
                    className="shrink-0 rounded-md border-2 border-ink bg-white p-2 text-ink shadow-brutal-sm box-hover hover:bg-red hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => disconnect(other.id)}
                    title="Remove connection"
                    className="shrink-0 rounded-md border-2 border-ink bg-white p-2 text-ink shadow-brutal-sm box-hover hover:bg-red hover:text-white">
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>

                </div>
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
