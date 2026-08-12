import { supabase } from "@/integrations/supabase/client";

/**
 * Send (or re-send) a connection request.
 * Uses an upsert so a previously declined / withdrawn / stale request between the
 * same two founders is revived as pending instead of failing on the unique key.
 */
export async function sendConnectionRequest(input: {
  fromFounderId: string;
  toFounderId: string;
  promptQuestion: string;
  message: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("connection_requests")
    .upsert(
      {
        from_founder_id: input.fromFounderId,
        to_founder_id: input.toFounderId,
        prompt_question: input.promptQuestion,
        message: input.message,
        status: "pending" as const,
        created_at: new Date().toISOString(),
        responded_at: null,
      },
      { onConflict: "from_founder_id,to_founder_id" },
    );

  if (!error) return { error: null };

  // Reverse-direction request already exists: they reached out to you first.
  if (error.code === "23505" || /unique/i.test(error.message)) {
    return { error: "There's already a request between you two — check your Inbox." };
  }
  return { error: error.message };
}
