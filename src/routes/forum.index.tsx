import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowUp, MessageCircle, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["General", "Hiring", "Fundraising", "Product", "Legal", "Growth"] as const;

export const Route = createFileRoute("/forum/")({
  component: Forum,
});

function Forum() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const [cat, setCat] = useState<string>("all");
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: posts, refetch } = useQuery({
    queryKey: ["forum", cat],
    queryFn: async () => {
      let q = supabase.from("forum_posts")
        .select("*, author:founders(*, profiles(full_name))")
        .order("created_at", { ascending: false }).limit(50);
      if (cat !== "all") q = q.eq("category", cat.toLowerCase() as never);
      const { data } = await q;
      return data ?? [];
    },
  });

  async function upvote(postId: string) {
    if (!me) return;
    const { error } = await supabase.from("forum_upvotes").insert({ post_id: postId, founder_id: me.id });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    refetch();
  }

  if (!ready) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Community</h1>
            <p className="text-sm text-muted-text">Where Indian founders share the messy middle.</p>
          </div>
          <button onClick={() => setComposeOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New post
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {["all", ...CATEGORIES.map((c) => c.toLowerCase())].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${cat === c ? "bg-navy text-white" : "bg-white text-muted-text hover:bg-surface-2"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {posts?.map((p) => (
            <article key={p.id} className="rounded-2xl border bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs text-muted-text">
                <img src={founderAvatar({ seed_avatar: p.author?.seed_avatar, seed_name: p.author?.seed_name, profile: p.author?.profiles })} className="h-6 w-6 rounded-full" alt="" />
                <span className="font-semibold text-foreground">{p.author?.profiles?.full_name ?? p.author?.seed_name}</span>
                <span>·</span>
                <span className="capitalize">{p.category}</span>
              </div>
              <Link to="/forum/$postId" params={{ postId: p.id }} className="mt-2 block">
                <h2 className="text-lg font-bold hover:text-indigo">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-text">{p.content}</p>
              </Link>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-text">
                <button onClick={() => upvote(p.id)} className="inline-flex items-center gap-1 hover:text-indigo">
                  <ArrowUp className="h-4 w-4" /> {p.upvotes ?? 0}
                </button>
                <Link to="/forum/$postId" params={{ postId: p.id }} className="inline-flex items-center gap-1 hover:text-indigo">
                  <MessageCircle className="h-4 w-4" /> Reply
                </Link>
              </div>
            </article>
          ))}
          {posts && posts.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed p-12 text-center text-sm text-muted-text">No posts yet.</div>
          )}
        </div>
      </div>

      {composeOpen && me && <ComposeModal onClose={() => { setComposeOpen(false); refetch(); }} founderId={me.id} />}
    </AppShell>
  );
}

function ComposeModal({ onClose, founderId }: { onClose: () => void; founderId: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    setSaving(true);
    const { error } = await supabase.from("forum_posts").insert({
      title: title.trim(), content: content.trim(), category: category as never, author_id: founderId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted!");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-navy/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-modal">
        <div className="flex items-start justify-between">
          <div className="text-xl font-bold">New post</div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts…" className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish
        </button>
      </div>
    </div>
  );
}
