import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { founderAvatar } from "@/lib/founder-types";
import {
  deleteForumPost, deleteForumComment, updateForumPost, updateForumComment,
  addForumCollaborator, removeForumCollaborator, visibleToViewer,
} from "@/lib/forum-actions";
import { ArrowBigUp, ArrowBigDown, ArrowLeft, Loader2, Bookmark, MessageSquareText, Send, Trash2, Pencil, Users, X, Save } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  ["idea_validation", "💡 Idea Validation"],
  ["looking_for_cofounder", "🤝 Looking for Co-Founder"],
  ["industry_talk", "🌏 Industry Talk"],
  ["resources", "📚 Resources"],
  ["success_stories", "🎉 Success Stories"],
] as const;

export const Route = createFileRoute("/forum/$postId")({
  component: PostView,
});

function PostView() {
  const { postId } = useParams({ from: "/forum/$postId" });
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectMsg, setConnectMsg] = useState("");
  const [connectSending, setConnectSending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_posts")
        .select("*, author:founders!forum_posts_author_id_fkey(*, profiles(full_name))").eq("id", postId).maybeSingle();
      return data;
    },
  });

  const { data: collaborators } = useQuery({
    queryKey: ["collaborators", postId],
    queryFn: async () => {
      const { data } = await supabase.from("forum_collaborators")
        .select("founder_id, founder:founders!forum_collaborators_founder_id_fkey(id, seed_name, seed_avatar, profiles(full_name))")
        .eq("post_id", postId);
      return (data ?? []) as { founder_id: string; founder: { id: string; seed_name: string | null; seed_avatar: string | null; profiles: { full_name: string | null } | null } | null }[];
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

  async function removeComment(commentId: string, hasReplies: boolean) {
    if (!confirm(hasReplies ? "Delete this comment and its replies?" : "Delete this comment?")) return;
    try {
      await deleteForumComment(commentId);
      toast.success("Comment deleted");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
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

  async function saveComment(commentId: string) {
    const text = commentDraft.trim();
    if (!text) return;
    try {
      await updateForumComment(commentId, text);
      setEditingComment(null);
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (!ready || !post) return null;

  const collabIds = (collaborators ?? []).map((c) => c.founder_id);
  const canEdit = !!me && (me.id === post.author_id || collabIds.includes(me.id));
  const isAuthor = me?.id === post.author_id;

  // Shadow-banned posts stay visible to their own author only.
  const postHidden = !!post.author?.shadow_banned && post.author_id !== me?.id;
  if (postHidden) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-2xl border-2 border-dashed border-ink p-10 text-sm font-bold text-muted-text">
            This post isn't available.
          </div>
          <Link to="/forum" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-orange">
            <ArrowLeft className="h-3 w-3" /> Back to forum
          </Link>
        </div>
      </AppShell>
    );
  }

  // group into top-level + replies (shadow-banned authors filtered out)
  const visible = visibleToViewer(comments ?? [], me?.id);
  const topLevel = visible.filter((c) => !c.parent_comment_id);
  const repliesOf = (id: string) => visible.filter((c) => c.parent_comment_id === id);
  const isLFC = post.category === "looking_for_cofounder";
  const crossCats: string[] = (post as { cross_categories?: string[] | null }).cross_categories ?? [];

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
            {(collaborators ?? []).length > 0 && (
              <span className="font-semibold text-foreground">
                + {(collaborators ?? []).map((c) => c.founder?.profiles?.full_name ?? c.founder?.seed_name ?? "founder").join(", ")}
              </span>
            )}
            <span>·</span>
            <span className="font-black capitalize">{String(post.category).replace(/_/g, " ")}</span>
            {crossCats.map((c) => (
              <span key={c} className="rounded-md border-2 border-ink bg-cream px-1.5 py-0.5 text-[10px] font-black capitalize">
                {c.replace(/_/g, " ")}
              </span>
            ))}
            {post.seeking_feedback && (
              <span className="ml-auto rounded-md border-2 border-ink bg-orange px-1.5 py-0.5 text-[10px] font-black uppercase text-white">Seeking feedback</span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight">{post.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
          {(post as { edited_at?: string | null }).edited_at && (
            <div className="mt-2 text-[10px] font-black uppercase text-muted-text">Edited</div>
          )}
          {post.image_url && (
            <img src={post.image_url} alt="" className="mt-4 w-full rounded-xl border-2 border-ink object-cover" />
          )}
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
            {canEdit && (
              <button onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-black shadow-brutal-sm box-hover">
                <Pencil className="h-3 w-3" /> Edit post
              </button>
            )}
            {isAuthor && (
              <button onClick={() => setCollabOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-sage px-2 py-1 text-xs font-black text-ink shadow-brutal-sm box-hover">
                <Users className="h-3 w-3" /> Collaborators
              </button>
            )}
            {me?.id === post.author_id && (

              <button
                onClick={async () => {
                  if (!confirm("Delete this post? This also removes its replies and votes.")) return;
                  try {
                    await deleteForumPost(postId);
                    toast.success("Post deleted");
                    navigate({ to: "/forum" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Delete failed");
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-red px-2 py-1 text-xs font-black text-white shadow-brutal-sm box-hover">
                <Trash2 className="h-3 w-3" /> Delete post
              </button>
            )}
            {isLFC && me?.id !== post.author_id && (
              <button onClick={() => setConnectOpen(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-sage px-3 py-1.5 text-xs font-black text-ink shadow-brutal-sm box-hover">
                <MessageSquareText className="h-3 w-3" /> Interested in connecting?
              </button>
            )}
          </div>
        </article>

        {editOpen && (
          <EditPostPanel
            post={post as never}
            onClose={() => setEditOpen(false)}
            onSaved={() => { setEditOpen(false); qc.invalidateQueries({ queryKey: ["post", postId] }); qc.invalidateQueries({ queryKey: ["forum"] }); }}
          />
        )}

        {collabOpen && me && (
          <CollabPanel
            postId={postId}
            myFounderId={me.id}
            current={(collaborators ?? []).map((c) => ({ id: c.founder_id, name: c.founder?.profiles?.full_name ?? c.founder?.seed_name ?? "Founder" }))}
            onClose={() => setCollabOpen(false)}
            onChanged={() => qc.invalidateQueries({ queryKey: ["collaborators", postId] })}
          />
        )}



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
                {editingComment === c.id ? (
                  <div className="mt-2">
                    <textarea rows={3} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                      className="w-full rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm" />
                    <div className="mt-1 flex gap-2">
                      <button onClick={() => saveComment(c.id)} className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-orange px-3 py-1 text-xs font-black text-white shadow-brutal-sm">
                        <Save className="h-3 w-3" /> Save
                      </button>
                      <button onClick={() => setEditingComment(null)} className="rounded-md border-2 border-ink bg-white px-3 py-1 text-xs font-black">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {c.content}
                    {(c as { edited_at?: string | null }).edited_at && (
                      <span className="ml-2 text-[10px] font-black uppercase text-muted-text">edited</span>
                    )}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-[11px] font-black text-orange hover:underline">
                    {replyingTo === c.id ? "Cancel" : "Reply"}
                  </button>
                  {me?.id === c.author_id && (
                    <>
                      <button onClick={() => { setEditingComment(c.id); setCommentDraft(c.content); }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-ink hover:underline">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => removeComment(c.id, true)} className="inline-flex items-center gap-1 text-[11px] font-black text-red hover:underline">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  )}
                </div>

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
                        {editingComment === r.id ? (
                          <div className="mt-1">
                            <textarea rows={2} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                              className="w-full rounded-lg border-2 border-ink bg-white px-2 py-1 text-xs" />
                            <div className="mt-1 flex gap-2">
                              <button onClick={() => saveComment(r.id)} className="rounded-md border-2 border-ink bg-orange px-2 py-0.5 text-[10px] font-black text-white">Save</button>
                              <button onClick={() => setEditingComment(null)} className="rounded-md border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-black">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap text-xs">
                            {r.content}
                            {(r as { edited_at?: string | null }).edited_at && (
                              <span className="ml-1.5 text-[9px] font-black uppercase text-muted-text">edited</span>
                            )}
                          </p>
                        )}
                        {me?.id === r.author_id && (
                          <div className="mt-1 flex items-center gap-3">
                            <button onClick={() => { setEditingComment(r.id); setCommentDraft(r.content); }}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-ink hover:underline">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={() => removeComment(r.id, false)} className="inline-flex items-center gap-1 text-[10px] font-black text-red hover:underline">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}

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

type PostLike = {
  id: string; title: string; content: string; category: string;
  cross_categories?: string[] | null; seeking_feedback: boolean; image_url: string | null;
};

function EditPostPanel({ post, onClose, onSaved }: { post: PostLike; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<string>(post.category);
  const [cross, setCross] = useState<string[]>(post.cross_categories ?? []);
  const [seeking, setSeeking] = useState(!!post.seeking_feedback);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    setBusy(true);
    try {
      await updateForumPost(post.id, {
        title: title.trim(), content: content.trim(), category,
        cross_categories: cross.filter((c) => c !== category),
        seeking_feedback: seeking,
      });
      toast.success("Post updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div className="text-xl font-black">Edit post</div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-semibold">
            {CATEGORY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div>
            <div className="text-[10px] font-black uppercase text-muted-text">Also show in (reach more domains)</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.filter(([v]) => v !== category).map(([v, l]) => {
                const on = cross.includes(v);
                return (
                  <button key={v} type="button"
                    onClick={() => setCross((c) => (on ? c.filter((x) => x !== v) : [...c, v]))}
                    className={`rounded-md border-2 border-ink px-2 py-1 text-[11px] font-black ${on ? "bg-sage text-ink" : "bg-white"}`}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          <textarea rows={7} value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={seeking} onChange={(e) => setSeeking(e.target.checked)} className="h-4 w-4" />
            Seeking feedback
          </label>
        </div>
        <button onClick={save} disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-orange py-2.5 text-sm font-black text-white shadow-brutal-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );
}

function CollabPanel({ postId, myFounderId, current, onClose, onChanged }: {
  postId: string;
  myFounderId: string;
  current: { id: string; name: string }[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Collaborators are picked from founders you're already connected with.
  const { data: candidates } = useQuery({
    queryKey: ["collab-candidates", myFounderId],
    queryFn: async () => {
      const { data: reqs } = await supabase.from("connection_requests")
        .select("from_founder_id, to_founder_id")
        .eq("status", "accepted")
        .or(`from_founder_id.eq.${myFounderId},to_founder_id.eq.${myFounderId}`);
      const ids = [...new Set((reqs ?? []).map((r) =>
        r.from_founder_id === myFounderId ? r.to_founder_id : r.from_founder_id))];
      if (!ids.length) return [];
      const { data } = await supabase.from("founders")
        .select("id, seed_name, profiles(full_name)").in("id", ids);
      return (data ?? []).map((f) => ({ id: f.id, name: f.profiles?.full_name ?? f.seed_name ?? "Founder" }));
    },
  });

  async function add(founderId: string) {
    setBusy(true);
    try { await addForumCollaborator(postId, founderId); toast.success("Collaborator added"); onChanged(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function remove(founderId: string) {
    setBusy(true);
    try { await removeForumCollaborator(postId, founderId); toast.success("Removed"); onChanged(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  const currentIds = current.map((c) => c.id);
  const available = (candidates ?? []).filter((c) => !currentIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-ink bg-cream p-6 shadow-brutal">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-black">Collaborators</div>
            <div className="text-[11px] font-bold text-muted-text">Co-authors can edit this post too.</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 space-y-2">
          {current.length === 0 && <div className="text-sm font-bold text-muted-text">No collaborators yet.</div>}
          {current.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border-2 border-ink bg-white px-3 py-2">
              <span className="text-sm font-black">{c.name}</span>
              <button onClick={() => remove(c.id)} disabled={busy} className="text-[11px] font-black text-red">Remove</button>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-[10px] font-black uppercase text-muted-text">Add from your connections</div>
          <div className="mt-2 space-y-2">
            {available.length === 0 && <div className="text-xs font-bold text-muted-text">No connections available to add.</div>}
            {available.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border-2 border-ink bg-white px-3 py-2">
                <span className="text-sm font-semibold">{c.name}</span>
                <button onClick={() => add(c.id)} disabled={busy}
                  className="rounded-md border-2 border-ink bg-orange px-2 py-0.5 text-[11px] font-black text-white shadow-brutal-sm">Add</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
