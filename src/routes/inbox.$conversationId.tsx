import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { ScoreRing } from "@/components/FounderBits";
import { Send, ArrowLeft, Sparkles, ChevronDown, Loader2, AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/$conversationId")({
  component: ConversationView,
});

function ConversationView() {
  const { conversationId } = useParams({ from: "/inbox/$conversationId" });
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reportOpen, setReportOpen] = useState(true);
  const [text, setText] = useState("");

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
      return data ?? [];
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
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

  if (!ready || !convo || !me) return null;
  const other = convo.founder_a_id === me.id ? convo.b : convo.a;
  const otherName = other.profiles?.full_name ?? other.seed_name ?? "Founder";

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-5xl flex-col md:h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
          <Link to="/inbox" className="text-muted-text hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <img src={founderAvatar({ seed_avatar: other.seed_avatar, seed_name: other.seed_name, profile: other.profiles })} className="h-10 w-10 rounded-xl object-cover" alt="" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{otherName}</div>
            <div className="truncate text-xs text-muted-text">{other.headline}</div>
          </div>
          <span className="rounded-full bg-indigo/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo">{convo.stage?.replace("_", " ")}</span>
        </div>

        {/* AI Report drawer */}
        <div className="border-b bg-gradient-to-r from-indigo/5 to-transparent">
          <button onClick={() => setReportOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo" />
              <span className="text-sm font-semibold">AI Compatibility Report</span>
              {report?.compatibility_score && (
                <span className="rounded-full bg-indigo px-2 py-0.5 text-[11px] font-bold text-white">{report.compatibility_score}/100</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition ${reportOpen ? "rotate-180" : ""}`} />
          </button>
          {reportOpen && (
            <div className="px-4 pb-5">
              {!report ? (
                <div className="flex items-center gap-2 text-sm text-muted-text">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating your compatibility report…
                </div>
              ) : report.compatibility_score == null ? (
                <div className="text-sm text-muted-text">{report.rationale_summary}</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                  <ScoreRing score={report.compatibility_score} size={110} />
                  <div className="space-y-3">
                    <p className="text-sm">{report.rationale_summary}</p>
                    <ReportList title="Alignment" items={report.alignment_points as string[] | null} color="emerald" icon={CheckCircle2} />
                    <ReportList title="Divergence" items={report.divergence_points as string[] | null} color="amber" icon={AlertTriangle} />
                    <ReportList title="Risk flags" items={report.risk_flags as string[] | null} color="destructive" icon={AlertTriangle} />
                    <ReportList title="Conversation starters" items={report.conversation_starters as string[] | null} color="indigo" icon={MessageCircle} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-surface px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-3">
            {(messages ?? []).map((m) => {
              const mine = m.sender_id === me.user_id || m.seed_sender_founder_id === me.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-indigo text-white" : "bg-white text-foreground shadow-card"}`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t bg-white p-3">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Send a message…"
              className="flex-1 rounded-full border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo" />
            <button onClick={send} disabled={!text.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-indigo text-white disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ReportList({ title, items, color, icon: Icon }: { title: string; items: string[] | null; color: string; icon: any }) {
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
