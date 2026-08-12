import { supabase } from "@/integrations/supabase/client";

/** Delete a post plus its dependent rows (comments, votes, saves). */
export async function deleteForumPost(postId: string) {
  // Replies first (self-referencing FK), then top-level comments.
  await supabase.from("forum_poll_votes").delete().eq("post_id", postId);
  const { data: kids } = await supabase.from("forum_comments")
    .select("id, parent_comment_id").eq("post_id", postId);
  const replyIds = (kids ?? []).filter((c) => c.parent_comment_id).map((c) => c.id);
  if (replyIds.length) await supabase.from("forum_comments").delete().in("id", replyIds);
  await supabase.from("forum_comments").delete().eq("post_id", postId);
  await supabase.from("forum_upvotes").delete().eq("post_id", postId);
  await supabase.from("forum_saves").delete().eq("post_id", postId);
  const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
}

/** Delete a comment and any direct replies to it. */
export async function deleteForumComment(commentId: string) {
  await supabase.from("forum_comments").delete().eq("parent_comment_id", commentId);
  const { error } = await supabase.from("forum_comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
}

/** Edit a post. Allowed for the author and any collaborator (enforced by RLS). */
export async function updateForumPost(postId: string, patch: {
  title?: string;
  content?: string;
  category?: string;
  cross_categories?: string[];
  seeking_feedback?: boolean;
  image_url?: string | null;
}) {
  const now = new Date().toISOString();
  const payload = { ...patch, edited_at: now, updated_at: now } as Record<string, unknown>;
  const { error } = await supabase.from("forum_posts")
    .update(payload as never)
    .eq("id", postId);
  if (error) throw new Error(error.message);
}

/** Edit your own comment or reply. */
export async function updateForumComment(commentId: string, content: string) {
  const { error } = await supabase.from("forum_comments")
    .update({ content, edited_at: new Date().toISOString() } as never)
    .eq("id", commentId);
  if (error) throw new Error(error.message);
}

/** Invite a founder to collaborate on (co-author + co-edit) a post. */
export async function addForumCollaborator(postId: string, founderId: string) {
  const { error } = await supabase.from("forum_collaborators")
    .insert({ post_id: postId, founder_id: founderId } as never);
  if (error) throw new Error(error.message);
}

export async function removeForumCollaborator(postId: string, founderId: string) {
  const { error } = await supabase.from("forum_collaborators")
    .delete().eq("post_id", postId).eq("founder_id", founderId);
  if (error) throw new Error(error.message);
}

/**
 * Shadow-ban filter. A shadow-banned author still sees their own content
 * (so spammers don't realise), but nobody else does. Admins see everything.
 */
export function visibleToViewer<T extends { author_id?: string | null; author?: { shadow_banned?: boolean | null } | null }>(
  rows: T[],
  viewerFounderId?: string | null,
  isAdmin = false,
) {
  if (isAdmin) return rows;
  return rows.filter((r) => !r.author?.shadow_banned || (!!viewerFounderId && r.author_id === viewerFounderId));
}
