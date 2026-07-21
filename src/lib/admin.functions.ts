import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "arv.gupta@bcomiaf.christuni.in";
const ADMIN_PASSWORD = "pass-2522409";

/** Idempotently ensure the hardcoded admin auth user exists and has the admin role. Public. */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Look for existing user
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Admin", role: "founder" },
    });
    if (error) throw new Error(error.message);
    user = data.user!;
  }
  // Ensure role row (trigger normally handles this but be defensive)
  await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  return { ok: true, userId: user.id };
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("forum_posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const users = list?.users ?? [];
    const ids = users.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, role").in("id", ids);
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      full_name: pmap.get(u.id)?.full_name ?? null,
      role: pmap.get(u.id)?.role ?? null,
    }));
  });

export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("conversations")
      .select("id, stage, created_at, a:founders!conversations_founder_a_id_fkey(id, seed_name, profiles(full_name)), b:founders!conversations_founder_b_id_fkey(id, seed_name, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msgs } = await supabaseAdmin
      .from("messages").select("*").eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    return msgs ?? [];
  });

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("forum_posts")
      .select("id, title, category, created_at, upvotes, author:founders(id, seed_name, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });
