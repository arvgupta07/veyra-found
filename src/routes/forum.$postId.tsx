import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowUp, ArrowLeft, Loader2 } from "lucide-react";
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

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_posts")
        .select("*, author:founders(*, profiles(full_name))").eq("id", postId).maybeSingle();
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_comments")
        .select("*, author:founders(*, profiles(full_name))")
        .eq("post_id", postId).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  async function submitReply() {
    if (!reply.trim() || !me) return;
    setSaving(true);
    const { error } = await supabase.from("forum_comments").insert({
      post_id: postId, author_id: me.id, content: reply.trim(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setReply("");
    qc.invalidateQueries({ queryKey: ["comments", postId] });
  }

  if (!ready || !post) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link to="/forum" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-text hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to community
        </Link>
        <article className="rounded-2xl border bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-xs text-muted-text">
            <img src={founderAvatar({ seed_avatar: post.author?.seed_avatar, seed_name: post.author?.seed_name, profile: post.author?.profiles })} className="h-6 w-6 rounded-full" alt="" />
            <span className="font-semibold text-foreground">{post.author?.profiles?.full_name ?? post.author?.seed_name}</span>
            <span>·</span>
            <span className="capitalize">{post.category}</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight">{post.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-text">
            <ArrowUp className="h-4 w-4" /> {post.upvotes ?? 0} upvotes
          </div>
        </article>

        <div className="mt-8">
          <div className="text-sm font-semibold text-muted-text">Replies ({comments?.length ?? 0})</div>
          <div className="mt-3 space-y-3">
            {comments?.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white p-4 shadow-card">
                <div className="flex items-center gap-2 text-xs text-muted-text">
                  <img src={founderAvatar({ seed_avatar: c.author?.seed_avatar, seed_name: c.author?.seed_name, profile: c.author?.profiles })} className="h-5 w-5 rounded-full" alt="" />
                  <span className="font-semibold text-foreground">{c.author?.profiles?.full_name ?? c.author?.seed_name}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-card">
            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add your reply…" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <button onClick={submitReply} disabled={saving || !reply.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Reply
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
