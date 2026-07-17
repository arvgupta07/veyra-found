import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { ArrowUp, MessageCircle, Plus, Loader2, X, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { v: "idea_validation", label: "💡 Idea Validation" },
  { v: "looking_for_cofounder", label: "🤝 Looking for Co-Founder" },
  { v: "industry_talk", label: "🌏 Industry Talk" },
  { v: "resources", label: "📚 Resources" },
  { v: "success_stories", label: "🎉 Success Stories" },
] as const;

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
      if (cat !== "all") q = q.eq("category", cat as never);
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Forum</h1>
            <p className="text-sm text-muted-text">Share ideas, get feedback, find your people.</p>
          </div>
          <button onClick={() => setComposeOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-orange px-4 py-2 text-sm font-black text-white shadow-brutal-sm box-hover">
            <Plus className="h-4 w-4" /> New post
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setCat("all")} className={`rounded-md border-2 border-ink px-3 py-1 text-xs font-black ${cat === "all" ? "bg-ink text-white" : "bg-white"}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.v} onClick={() => setCat(c.v)}
              className={`rounded-md border-2 border-ink px-3 py-1 text-xs font-black transition ${cat === c.v ? "bg-ink text-white" : "bg-white hover:bg-cream"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {posts?.map((p) => {
            const catLabel = CATEGORIES.find((c) => c.v === p.category)?.label ?? p.category;
            return (
              <article key={p.id} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-brutal-sm box-hover">
                <div className="flex items-center gap-2 text-xs text-muted-text">
                  <img src={founderAvatar({ seed_avatar: p.author?.seed_avatar, seed_name: p.author?.seed_name, profile: p.author?.profiles })} className="h-6 w-6 rounded-full border border-ink" alt="" />
                  <span className="font-semibold text-foreground">{p.author?.profiles?.full_name ?? p.author?.seed_name}</span>
                  <span>·</span>
                  <span className="font-black">{catLabel}</span>
                  {p.seeking_feedback && (
                    <span className="ml-auto rounded-md border-2 border-ink bg-orange px-1.5 py-0.5 text-[10px] font-black uppercase text-white">Seeking feedback</span>
                  )}
                </div>
                <Link to="/forum/$postId" params={{ postId: p.id }} className="mt-2 block">
                  <h2 className="text-lg font-black hover:text-orange">{p.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-text">{p.content}</p>
                </Link>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-text">
                  <button onClick={() => upvote(p.id)} className="inline-flex items-center gap-1 hover:text-orange">
                    <ArrowUp className="h-4 w-4" /> {p.upvotes ?? 0}
                  </button>
                  <Link to="/forum/$postId" params={{ postId: p.id }} className="inline-flex items-center gap-1 hover:text-orange">
                    <MessageCircle className="h-4 w-4" /> Reply
                  </Link>
                  {p.category === "looking_for_cofounder" && (
                    <Link to="/forum/$postId" params={{ postId: p.id }} className="ml-auto inline-flex items-center gap-1 rounded-md border-2 border-ink bg-sage px-2 py-0.5 text-[11px] font-black text-ink">
                      <MessageSquareText className="h-3 w-3" /> Interested?
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          {posts && posts.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-ink p-12 text-center text-sm text-muted-text">No posts yet in this category.</div>
          )}
        </div>
      </div>

      {composeOpen && me && <ComposeModal onClose={(postedCategory) => { setComposeOpen(false); if (postedCategory) setCat(postedCategory); refetch(); }} founderId={me.id} />}
    </AppShell>
  );
}

function ComposeModal({ onClose, founderId }: { onClose: (postedCategory?: string) => void; founderId: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("idea_validation");
  const [seeking, setSeeking] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    setSaving(true);
    const { error } = await supabase.from("forum_posts").insert({
      title: title.trim(), content: content.trim(), category: category as never, author_id: founderId,
      seeking_feedback: seeking,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted!");
    onClose(category);
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div className="text-xl font-black">New post</div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-semibold">
            {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts…" className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={seeking} onChange={(e) => setSeeking(e.target.checked)} className="h-4 w-4" />
            Seeking feedback (vs. just sharing)
          </label>
        </div>
        <button onClick={submit} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish
        </button>
      </div>
    </div>
  );
}
