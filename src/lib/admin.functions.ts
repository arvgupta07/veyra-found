import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Admin bootstrap removed. Admin role is granted via a one-time secure
// database operation, not through a public/unauthenticated endpoint.

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
    // Explicitly wipe app-side rows first so nothing survives if the account
    // ensures no orphan app rows survive the auth deletion.
    await supabaseAdmin.from("founders").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    // Hard-delete auth user (cascades to any remaining refs).
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId, false);
    if (error && !/not.*found/i.test(error.message)) throw new Error(error.message);
    // Sweep orphan founder rows with no owner and no seed persona.
    await supabaseAdmin.from("founders").delete().is("user_id", null).is("seed_name", null);
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
    const { data, error } = await supabaseAdmin
      .from("forum_posts")
      .select("id, title, category, created_at, upvotes, author:founders!forum_posts_author_id_fkey(id, seed_name, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
