import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Clear rows that may block the auth user delete (no ON DELETE CASCADE).
    const cleanup = [
      supabaseAdmin.from("messages").delete().eq("sender_id", userId),
      supabaseAdmin.from("founders").delete().eq("user_id", userId),
      supabaseAdmin.from("talent_profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("investor_profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ];
    await Promise.allSettled(cleanup);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      const detail =
        error.message ||
        (error as { error_description?: string }).error_description ||
        JSON.stringify(error) ||
        "unknown error";
      console.error("[deleteMyAccount] failed", error);
      throw new Error(`Could not delete your account: ${detail}`);
    }
    return { ok: true };
  });
