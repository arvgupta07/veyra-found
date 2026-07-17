import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowBigUp, ArrowBigDown, ArrowLeft, Loader2, Bookmark, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forum/$postId")({
  component: PostView,
});

function PostView() {
  const { postId } = useParams({ from: "/forum/$postId" });
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectMsg, setConnectMsg] = useState("");
  const [connectSending, setConnectSending] = useState(false);

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_posts")
        .select("*, author:founders!forum_posts_author_id_fkey(*, profiles(full_name))").eq("id", postId).maybeSingle();
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_comments")
        .select("*, author:founders!forum_comments_author_id_fkey(*, profiles(full_name))")
        .eq("post_id", postId).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["saved", postId, me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("forum_saves").select("post_id")
        .eq("founder_id", me!.id).eq("post_id", postId).maybeSingle();
      return !!data;
    },
  });

  const { data: myVote } = useQuery({
    queryKey: ["myvote", postId, me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data } = await supabase.from("forum_upvotes").select("value")
        .eq("founder_id", me!.id).eq("post_id", postId).maybeSingle();
      return (data?.value ?? 0) as number;
    },
  });

  async function vote(next: 1 | -1) {
    if (!me) return;
    const current = myVote ?? 0;
    if (current === next) {
      await supabase.from("forum_upvotes").delete().eq("post_id", postId).eq("founder_id", me.id);
    } else if (current === 0) {
      await supabase.from("forum_upvotes").insert({ post_id: postId, founder_id: me.id, value: next });
    } else {
      await supabase.from("forum_upvotes").update({ value: next }).eq("post_id", postId).eq("founder_id", me.id);
    }
    qc.invalidateQueries({ queryKey: ["myvote", postId, me.id] });
    qc.invalidateQueries({ queryKey: ["post", postId] });
  }

  async function toggleSave() {
    if (!me) return;
    if (saved) {
      await supabase.from("forum_saves").delete().eq("founder_id", me.id).eq("post_id", postId);
    } else {
      await supabase.from("forum_saves").insert({ founder_id: me.id, post_id: postId });
    }
    qc.invalidateQueries({ queryKey: ["saved", postId, me.id] });
  }

  async function submitReply(parentId: string | null = null, text?: string) {
    const content = (text ?? reply).trim();
    if (!content || !me) return;
    setSaving(true);
    const { error } = await supabase.from("forum_comments").insert({
      post_id: postId, author_id: me.id, content, parent_comment_id: parentId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (parentId) { setReplyingTo(null); setReplyText(""); }
    else setReply("");
    qc.invalidateQueries({ queryKey: ["comments", postId] });
  }

  async function sendConnect() {
    if (!me || !post?.author_id || connectMsg.trim().length < 20) return toast.error("Add 20+ characters");
    setConnectSending(true);
    const { error } = await supabase.from("connection_requests").insert({
      from_founder_id: me.id, to_founder_id: post.author_id,
      prompt_question: `Forum post: ${post.title}`, message: connectMsg.trim(), status: "pending",
    });
    setConnectSending(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent!");
    setConnectOpen(false);
    setConnectMsg("");
  }

  if (!ready || !post) return null;

  // group into top-level + replies
  const topLevel = (comments ?? []).filter((c) => !c.parent_comment_id);
  const repliesOf = (id: string) => (comments ?? []).filter((c) => c.parent_comment_id === id);
  const isLFC = post.category === "looking_for_cofounder";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/forum" className="mb-4 inline-flex items-center gap-1 text-xs font-black text-muted-text hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to forum
        </Link>
        <article className="rounded-2xl border-2 border-ink bg-white p-6 shadow-brutal">
          <div className="flex items-center gap-2 text-xs text-muted-text">
            <img src={founderAvatar({ seed_avatar: post.author?.seed_avatar, seed_name: post.author?.seed_name, profile: post.author?.profiles })} className="h-6 w-6 rounded-full border border-ink" alt="" />
            <span className="font-semibold text-foreground">{post.author?.profiles?.full_name ?? post.author?.seed_name}</span>
            <span>·</span>
            <span className="font-black capitalize">{String(post.category).replace(/_/g, " ")}</span>
            {post.seeking_feedback && (
              <span className="ml-auto rounded-md border-2 border-ink bg-orange px-1.5 py-0.5 text-[10px] font-black uppercase text-white">Seeking feedback</span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight">{post.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-stretch overflow-hidden rounded-lg border-2 border-ink bg-white shadow-brutal-sm">
              <button onClick={() => vote(1)} aria-label="Upvote"
                className={`grid w-9 place-items-center transition ${myVote === 1 ? "bg-sage" : "hover:bg-cream"}`}>
                <ArrowBigUp className={`h-4 w-4 ${myVote === 1 ? "fill-ink" : ""}`} />
              </button>
              <div className="grid min-w-[2.5rem] place-items-center border-x-2 border-ink px-2 text-sm font-black">{post.upvotes ?? 0}</div>
              <button onClick={() => vote(-1)} aria-label="Downvote"
                className={`grid w-9 place-items-center transition ${myVote === -1 ? "bg-red text-white" : "hover:bg-cream"}`}>
                <ArrowBigDown className={`h-4 w-4 ${myVote === -1 ? "fill-white" : ""}`} />
              </button>
            </div>
            <button onClick={toggleSave} className={`inline-flex items-center gap-1 rounded-md border-2 border-ink px-2 py-1 text-xs font-black box-hover ${saved ? "bg-orange text-white" : "bg-white"}`}>
              <Bookmark className="h-3 w-3" /> {saved ? "Saved" : "Save"}
            </button>
            {isLFC && me?.id !== post.author_id && (
              <button onClick={() => setConnectOpen(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-sage px-3 py-1.5 text-xs font-black text-ink shadow-brutal-sm box-hover">
                <MessageSquareText className="h-3 w-3" /> Interested in connecting?
              </button>
            )}
          </div>
        </article>

        {connectOpen && (
          <div className="mt-4 rounded-2xl border-2 border-ink bg-cream p-4 shadow-brutal-sm">
            <div className="text-sm font-black">Send a connection request</div>
            <textarea rows={3} maxLength={400} value={connectMsg} onChange={(e) => setConnectMsg(e.target.value)}
              placeholder="Why this specific post caught your attention…"
              className="mt-2 w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setConnectOpen(false)} className="rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold">Cancel</button>
              <button onClick={sendConnect} disabled={connectSending} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-orange px-3 py-1.5 text-xs font-black text-white shadow-brutal-sm disabled:opacity-50">
                {connectSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="text-sm font-black text-muted-text">Replies ({comments?.length ?? 0})</div>
          <div className="mt-3 space-y-3">
            {topLevel.map((c) => (
              <div key={c.id} className="rounded-xl border-2 border-ink bg-white p-4 shadow-brutal-sm">
                <div className="flex items-center gap-2 text-xs text-muted-text">
                  <img src={founderAvatar({ seed_avatar: c.author?.seed_avatar, seed_name: c.author?.seed_name, profile: c.author?.profiles })} className="h-5 w-5 rounded-full border border-ink" alt="" />
                  <span className="font-semibold text-foreground">{c.author?.profiles?.full_name ?? c.author?.seed_name}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
                <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="mt-2 text-[11px] font-black text-orange hover:underline">
                  {replyingTo === c.id ? "Cancel" : "Reply"}
                </button>
                {replyingTo === c.id && (
                  <div className="mt-2">
                    <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Your reply…" className="w-full rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm" />
                    <button onClick={() => submitReply(c.id, replyText)} disabled={saving} className="mt-1 rounded-md border-2 border-ink bg-orange px-3 py-1 text-xs font-black text-white shadow-brutal-sm disabled:opacity-50">Send reply</button>
                  </div>
                )}
                {repliesOf(c.id).length > 0 && (
                  <div className="mt-3 ml-4 space-y-2 border-l-2 border-ink pl-3">
                    {repliesOf(c.id).map((r) => (
                      <div key={r.id} className="rounded-lg border border-ink bg-cream p-3">
                        <div className="flex items-center gap-2 text-[11px] text-muted-text">
                          <img src={founderAvatar({ seed_avatar: r.author?.seed_avatar, seed_name: r.author?.seed_name, profile: r.author?.profiles })} className="h-4 w-4 rounded-full" alt="" />
                          <span className="font-semibold text-foreground">{r.author?.profiles?.full_name ?? r.author?.seed_name}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-xs">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-4 shadow-brutal-sm">
            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a top-level reply…" className="w-full rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm" />
            <button onClick={() => submitReply(null)} disabled={saving || !reply.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-orange px-4 py-2 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Reply
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
