import { supabase } from "@/integrations/supabase/client";

/** Delete a post plus its dependent rows (comments, votes, saves). */
export async function deleteForumPost(postId: string) {
  // Replies first (self-referencing FK), then top-level comments.
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
