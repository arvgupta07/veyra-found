import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_FOUNDER_IDS = new Set([
  "11111111-1111-1111-1111-111111111111",
  "44444444-4444-4444-4444-444444444444",
]);

const Input = z.object({ founderId: z.string().uuid() });

/** Claims a seeded demo founder profile for the authenticated caller.
 * The privileged RPC is no longer callable from the browser; it runs here
 * behind an auth check with a strict allow-list of demo profile ids. */
export const claimDemoFounder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data, context }) => {
    if (!DEMO_FOUNDER_IDS.has(data.founderId)) throw new Error("Not a demo profile");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Detach any founder rows currently owned by this user (except the target).
    await supabaseAdmin
      .from("founders")
      .update({ user_id: null })
      .eq("user_id", context.userId)
      .neq("id", data.founderId);

    const { error } = await supabaseAdmin
      .from("founders")
      .update({ user_id: context.userId })
      .eq("id", data.founderId);
    if (error) throw new Error("Could not set up the demo profile");

    return { ok: true };
  });
