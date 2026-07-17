import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { Send, ArrowLeft, Pencil, Trash2, Smile, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/$conversationId")({
  component: ConversationView,
});

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "🤔"];

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  seed_sender_founder_id: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reactions: Record<string, string[]> | null;
};

function ConversationView() {
  const { conversationId } = useParams({ from: "/inbox/$conversationId" });
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [activeMsg, setActiveMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: convo } = useQuery({
    queryKey: ["convo", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("conversations")
        .select("*, a:founders!conversations_founder_a_id_fkey(*, profiles(full_name)), b:founders!conversations_founder_b_id_fkey(*, profiles(full_name))")
        .eq("id", conversationId).maybeSingle();
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("messages")
        .select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
      return (data ?? []) as unknown as MessageRow[];
    },
  });

  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ["report", conversationId],
    queryFn: async () => {
      const { data } = await supabase.from("compatibility_reports").select("*").eq("conversation_id", conversationId).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`msgs-${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, qc]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!report && convo) {
      const t = setTimeout(async () => {
        try {
          const mod = await import("@/lib/compat.functions");
          await mod.generateCompatibilityReport({ data: { conversationId } });
          refetchReport();
        } catch (e) { console.error(e); }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [convo, report, conversationId, refetchReport]);

  async function send() {
    if (!text.trim() || !me) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId, sender_id: me.user_id, content,
    });
    if (error) toast.error(error.message);
  }

  async function saveEdit(id: string) {
    const content = editText.trim();
    if (!content) return;
    const { error } = await supabase.from("messages")
      .update({ content, edited_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    setEditingId(null); setEditText("");
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
  }

  async function deleteMsg(id: string) {
    const { error } = await supabase.from("messages")
      .update({ deleted_at: new Date().toISOString(), content: "" }).eq("id", id);
    if (error) return toast.error(error.message);
    setActiveMsg(null);
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
  }

  async function toggleReaction(m: MessageRow, emoji: string) {
    if (!me?.user_id) return;
    const current = (m.reactions as Record<string, string[]> | null) ?? {};
    const list = current[emoji] ?? [];
    const has = list.includes(me.user_id);
    const next = { ...current, [emoji]: has ? list.filter((u) => u !== me.user_id) : [...list, me.user_id] };
    if (next[emoji].length === 0) delete next[emoji];
    const { error } = await supabase.from("messages").update({ reactions: next }).eq("id", m.id);
    if (error) toast.error(error.message);
    setActiveMsg(null);
  }

  if (!ready || !convo || !me) return null;
  const other = convo.founder_a_id === me.id ? convo.b : convo.a;
  const otherName = other.profiles?.full_name ?? other.seed_name ?? "Founder";

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-5xl flex-col md:h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 border-b-2 border-ink bg-white px-4 py-3">
          <Link to="/inbox" className="text-muted-text hover:text-ink"><ArrowLeft className="h-5 w-5" /></Link>
          <Link to="/profile/$founderId" params={{ founderId: other.id }} className="flex items-center gap-3 flex-1 min-w-0">
            <img src={founderAvatar({ seed_avatar: other.seed_avatar, seed_name: other.seed_name, profile: other.profiles })}
              className="h-10 w-10 rounded-xl border-2 border-ink object-cover transition hover:-translate-y-0.5" alt="" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-black hover:text-orange">{otherName}</div>
              <div className="truncate text-xs text-muted-text">{other.headline}</div>
            </div>
          </Link>
          <span className="rounded-md border-2 border-ink bg-cream px-2 py-1 text-[10px] font-black uppercase tracking-wider">{convo.stage?.replace("_", " ")}</span>
        </div>

        {/* AI report intentionally removed */}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-surface px-4 py-6" onClick={() => setActiveMsg(null)}>
          <div className="mx-auto max-w-2xl space-y-3">
            {(messages ?? []).map((m) => {
              const mine = m.sender_id === me.user_id || m.seed_sender_founder_id === me.id;
              const deleted = !!m.deleted_at;
              const editing = editingId === m.id;
              const reactions = (m.reactions as Record<string, string[]> | null) ?? {};
              const isActive = activeMsg === m.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="relative max-w-[80%]">
                    <div
                      onClick={(e) => { e.stopPropagation(); if (!deleted && !editing) setActiveMsg(isActive ? null : m.id); }}
                      className={`cursor-pointer rounded-2xl border-2 border-ink px-4 py-2.5 text-sm shadow-brutal-sm ${
                        deleted ? "bg-white text-muted-text italic" :
                        mine ? "bg-orange text-white" : "bg-white text-ink"
                      }`}
                    >
                      {deleted ? "message deleted" : editing ? (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2}
                            className="w-full rounded-md border-2 border-ink bg-white p-1.5 text-sm text-ink" />
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditingId(null); setEditText(""); }} className="rounded border-2 border-ink bg-white px-2 py-0.5 text-xs font-black text-ink"><X className="h-3 w-3" /></button>
                            <button onClick={() => saveEdit(m.id)} className="rounded border-2 border-ink bg-sage px-2 py-0.5 text-xs font-black text-ink"><Check className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>{m.content}</div>
                          {m.edited_at && <div className="mt-0.5 text-[9px] font-bold opacity-70">edited</div>}
                        </>
                      )}
                    </div>

                    {/* Reactions summary */}
                    {!deleted && Object.keys(reactions).length > 0 && (
                      <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(reactions).map(([em, users]) => (
                          <button key={em} onClick={(e) => { e.stopPropagation(); toggleReaction(m, em); }}
                            className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-1.5 py-0.5 text-[11px] font-black ${users.includes(me.user_id ?? "") ? "bg-cream" : ""}`}>
                            {em} <span>{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action bar */}
                    {isActive && !deleted && !editing && (
                      <div className={`absolute -top-9 z-10 flex items-center gap-1 rounded-xl border-2 border-ink bg-white p-1 shadow-brutal-sm ${mine ? "right-0" : "left-0"}`}
                        onClick={(e) => e.stopPropagation()}>
                        {REACTIONS.map((em) => (
                          <button key={em} onClick={() => toggleReaction(m, em)} className="rounded px-1 text-base hover:bg-cream">{em}</button>
                        ))}
                        {mine && (
                          <>
                            <div className="mx-1 h-4 w-px bg-ink/20" />
                            <button onClick={() => { setEditingId(m.id); setEditText(m.content); setActiveMsg(null); }} className="grid h-6 w-6 place-items-center rounded hover:bg-cream" title="Edit"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => deleteMsg(m.id)} className="grid h-6 w-6 place-items-center rounded text-red hover:bg-red/10" title="Delete"><Trash2 className="h-3 w-3" /></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* AI starters intentionally removed */}

        {/* Composer */}
        <div className="border-t-2 border-ink bg-white p-3">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Send a message…"
              className="flex-1 rounded-lg border-2 border-ink bg-white px-4 py-2.5 text-sm outline-none" />
            <button onClick={send} disabled={!text.trim()}
              className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink bg-orange text-white shadow-brutal-sm disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mx-auto mt-1 max-w-2xl text-[10px] text-muted-text">
            <Smile className="mr-1 inline h-3 w-3" /> Tap any message to react, edit, or delete.
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function ReportList({ title, items, color, icon: Icon }: { title: string; items: string[] | null; color: string; icon: React.ComponentType<{ className?: string }> }) {
  if (!items?.length) return null;
  const colorMap: Record<string, string> = { emerald: "text-emerald", amber: "text-amber", destructive: "text-destructive", indigo: "text-indigo" };
  return (
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${colorMap[color]}`}>{title}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <Icon className={`mt-0.5 h-3 w-3 flex-none ${colorMap[color]}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
