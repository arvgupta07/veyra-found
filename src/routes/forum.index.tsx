import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import { uploadImage, uploadVideo } from "@/lib/uploads";
import { deleteForumPost, visibleToViewer } from "@/lib/forum-actions";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Plus, Loader2, X, MessageSquareText, ImagePlus, Trash2, Video, BarChart3, Type, Link2 } from "lucide-react";
import { PostMedia } from "@/components/forum/PostMedia";
import { PollBlock } from "@/components/forum/PollBlock";
import { toast } from "sonner";
import { FOUNDER_COLS } from "@/lib/founder-types";

const CATEGORIES = [
  { v: "idea_validation", label: "💡 Idea Validation" },
  { v: "looking_for_cofounder", label: "🤝 Looking for Co-Founder" },
  { v: "industry_talk", label: "🌏 Industry Talk" },
  { v: "resources", label: "📚 Resources" },
  { v: "success_stories", label: "🎉 Success Stories" },
] as const;

export const Route = createFileRoute("/forum/")({
  component: Forum,
  head: () => ({
    meta: [
      { title: "Founder Forum — Veyra Found" },
      { name: "description", content: "Validate ideas, find co-founders and swap resources with Indian founders in the Veyra Found community forum." },
      { property: "og:title", content: "Founder Forum — Veyra Found" },
      { property: "og:description", content: "Idea validation, co-founder calls and resources, discussed by Indian founders." },
      { property: "og:url", content: "https://veyrafound.in/forum" },
    ],
    links: [{ rel: "canonical", href: "https://veyrafound.in/forum" }],
  }),
});

function Forum() {
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>("all");
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: posts } = useQuery({
    queryKey: ["forum", cat, me?.id ?? "anon"],
    queryFn: async () => {
      let q = supabase.from("forum_posts")
        .select(`*, author:founders!forum_posts_author_id_fkey(${FOUNDER_COLS}, profiles(full_name)), my_vote:forum_upvotes(value, founder_id)`)
        .order("created_at", { ascending: false }).limit(50);
      // Only my own vote row is needed per post — pulling every voter made the
      // feed slower with each new upvote in the whole forum.
      if (me?.id) q = q.eq("my_vote.founder_id", me.id);
      // Cross-posted categories widen a post's reach across domains.
      if (cat !== "all") q = q.or(`category.eq.${cat},cross_categories.cs.{${cat}}`);
      const { data } = await q;
      const rows = (data ?? []).map((p: any) => ({
        ...p,
        my_value: (p.my_vote ?? []).find((v: any) => v.founder_id === me?.id)?.value ?? 0,
      }));
      // Hide shadow-banned spammers from everyone but themselves.
      return visibleToViewer(rows, me?.id);
    },

  });


  async function vote(postId: string, next: 1 | -1, current: number) {
    if (!me) return;
    // Toggle off if user clicks their existing vote.
    if (current === next) {
      const { error } = await supabase.from("forum_upvotes").delete()
        .eq("post_id", postId).eq("founder_id", me.id);
      if (error) toast.error(error.message);
    } else if (current === 0) {
      const { error } = await supabase.from("forum_upvotes")
        .insert({ post_id: postId, founder_id: me.id, value: next });
      if (error) toast.error(error.message);
    } else {
      // Switching direction: update existing row.
      const { error } = await supabase.from("forum_upvotes")
        .update({ value: next }).eq("post_id", postId).eq("founder_id", me.id);
      if (error) toast.error(error.message);
    }
    await qc.invalidateQueries({ queryKey: ["forum"] });
    await qc.invalidateQueries({ queryKey: ["post", postId] });
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
          {posts?.map((p: any) => {
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
                  <PostMedia imageUrl={p.image_url} videoUrl={p.video_url} className="mt-3" />
                </Link>
                {(p.poll_options ?? []).length >= 2 && (
                  <div className="mt-3">
                    <PollBlock postId={p.id} question={p.poll_question} options={p.poll_options} founderId={me?.id} />
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-text">
                  <div className="inline-flex items-stretch overflow-hidden rounded-lg border-2 border-ink bg-white shadow-brutal-sm">
                    <button
                      onClick={() => vote(p.id, 1, p.my_value)}
                      aria-label="Upvote"
                      className={`grid w-8 place-items-center transition ${p.my_value === 1 ? "bg-sage text-ink" : "hover:bg-cream"}`}>
                      <ArrowBigUp className={`h-4 w-4 ${p.my_value === 1 ? "fill-ink" : ""}`} />
                    </button>
                    <div className="grid min-w-[2.25rem] place-items-center border-x-2 border-ink px-1 text-[13px] font-black text-ink">
                      {p.upvotes ?? 0}
                    </div>
                    <button
                      onClick={() => vote(p.id, -1, p.my_value)}
                      aria-label="Downvote"
                      className={`grid w-8 place-items-center transition ${p.my_value === -1 ? "bg-red text-white" : "hover:bg-cream"}`}>
                      <ArrowBigDown className={`h-4 w-4 ${p.my_value === -1 ? "fill-white" : ""}`} />
                    </button>
                  </div>
                  <Link to="/forum/$postId" params={{ postId: p.id }} className="inline-flex items-center gap-1 hover:text-orange">
                    <MessageCircle className="h-4 w-4" /> Reply
                  </Link>
                  {p.category === "looking_for_cofounder" && (
                    <Link to="/forum/$postId" params={{ postId: p.id }} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-sage px-2 py-0.5 text-[11px] font-black text-ink">
                      <MessageSquareText className="h-3 w-3" /> Interested?
                    </Link>
                  )}
                  {me?.id === p.author_id && (
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this post? This also removes its replies and votes.")) return;
                        try { await deleteForumPost(p.id); toast.success("Post deleted"); await qc.invalidateQueries({ queryKey: ["forum"] }); }
                        catch (err) { toast.error(err instanceof Error ? err.message : "Delete failed"); }
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border-2 border-ink bg-red px-2 py-0.5 text-[11px] font-black text-white shadow-brutal-sm">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
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

      {composeOpen && me && <ComposeModal onClose={(postedCategory) => { setComposeOpen(false); if (postedCategory) setCat(postedCategory); void qc.invalidateQueries({ queryKey: ["forum"] }); }} founderId={me.id} />}
    </AppShell>
  );
}

type Kind = "text" | "photo" | "video" | "poll";

const KINDS: { v: Kind; label: string; icon: typeof Type }[] = [
  { v: "text", label: "Text", icon: Type },
  { v: "photo", label: "Photo", icon: ImagePlus },
  { v: "video", label: "Video", icon: Video },
  { v: "poll", label: "Poll", icon: BarChart3 },
];

function ComposeModal({ onClose, founderId }: { onClose: (postedCategory?: string) => void; founderId: string }) {
  const [kind, setKind] = useState<Kind>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("idea_validation");
  const [seeking, setSeeking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [uploading, setUploading] = useState(false);

  async function pick(file: File, type: "image" | "video") {
    setUploading(true);
    try {
      const url = type === "image" ? await uploadImage(file, "forum") : await uploadVideo(file, "forum");
      if (type === "image") setImageUrl(url); else { setVideoUrl(url); setVideoLink(""); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    if (kind === "photo" && !imageUrl) return toast.error("Add a photo or switch to a text post");

    const link = videoLink.trim();
    if (kind === "video") {
      if (!videoUrl && !link) return toast.error("Upload a video or paste a YouTube / Vimeo link");
      if (link && !/^https?:\/\/\S+$/i.test(link)) return toast.error("Paste a full video link starting with https://");
    }

    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean).slice(0, 4);
    if (kind === "poll") {
      if (!pollQuestion.trim()) return toast.error("Add a poll question");
      if (cleanOptions.length < 2) return toast.error("A poll needs at least 2 options");
    }

    setSaving(true);
    const { error } = await supabase.from("forum_posts").insert({
      title: title.trim(), content: content.trim(), category: category as never, author_id: founderId,
      seeking_feedback: seeking,
      image_url: kind === "photo" ? imageUrl : null,
      video_url: kind === "video" ? (videoUrl ?? link) : null,
      poll_question: kind === "poll" ? pollQuestion.trim() : null,
      poll_options: kind === "poll" ? cleanOptions : [],
    } as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Posted!");
    onClose(category);
  }

  const inputCls = "w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={() => onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div className="text-xl font-black">New post</div>
          <button onClick={() => onClose()} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        {/* Post type switcher */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const on = kind === k.v;
            return (
              <button key={k.v} type="button" onClick={() => setKind(k.v)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 border-ink px-2 py-2 text-[11px] font-black uppercase tracking-wide shadow-brutal-sm box-hover ${on ? "bg-orange text-white" : "bg-white text-ink"}`}>
                <Icon className="h-4 w-4" /> {k.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-semibold">
            {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Title" className={inputCls} />
          <textarea rows={kind === "text" ? 6 : 4} value={content} onChange={(e) => setContent(e.target.value)} maxLength={4000}
            placeholder={kind === "poll" ? "Give people context for your poll…" : "Share your thoughts…"} className={inputCls} />

          {kind === "photo" && (imageUrl ? (
            <div className="relative">
              <img src={imageUrl} alt="" className="max-h-60 w-full rounded-xl border-2 border-ink object-cover" />
              <button type="button" aria-label="Remove image" onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 rounded-md border-2 border-ink bg-white p-1 shadow-brutal-sm">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-brutal-sm box-hover ${uploading ? "opacity-50" : ""}`}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Add photo
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f, "image"); }} />
            </label>
          ))}

          {kind === "video" && (
            <div className="space-y-2">
              {videoUrl ? (
                <div className="relative">
                  <video src={videoUrl} controls className="max-h-60 w-full rounded-xl border-2 border-ink bg-ink" />
                  <button type="button" aria-label="Remove video" onClick={() => setVideoUrl(null)}
                    className="absolute right-2 top-2 rounded-md border-2 border-ink bg-white p-1 shadow-brutal-sm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-2 text-xs font-black shadow-brutal-sm box-hover ${uploading ? "opacity-50" : ""}`}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
                    Upload video (max 40 MB)
                    <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f, "video"); }} />
                  </label>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <input value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
                      placeholder="…or paste a YouTube / Vimeo link" className={inputCls} />
                  </div>
                </>
              )}
            </div>
          )}

          {kind === "poll" && (
            <div className="space-y-2 rounded-xl border-2 border-ink bg-white p-3">
              <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} maxLength={140}
                placeholder="Poll question" className={inputCls} />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={opt} maxLength={80}
                    onChange={(e) => setPollOptions(pollOptions.map((o, j) => (j === i ? e.target.value : o)))}
                    placeholder={`Option ${i + 1}`} className={inputCls} />
                  {pollOptions.length > 2 && (
                    <button type="button" aria-label="Remove option"
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="rounded-md border-2 border-ink bg-white p-1.5 shadow-brutal-sm">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button type="button" onClick={() => setPollOptions([...pollOptions, ""])}
                  className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-cream px-3 py-1.5 text-xs font-black shadow-brutal-sm box-hover">
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={seeking} onChange={(e) => setSeeking(e.target.checked)} className="h-4 w-4" />
            Seeking feedback (vs. just sharing)
          </label>
        </div>
        <button onClick={submit} disabled={saving || uploading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Publish
        </button>
      </div>
    </div>
  );
}
