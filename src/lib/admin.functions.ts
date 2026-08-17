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
    if (data.userId === context.userId) throw new Error("You cannot delete your own admin account here");
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
    await supabaseAdmin.from("forum_upvotes").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("forum_saves").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("forum_collaborators").delete().eq("post_id", data.postId);
    await supabaseAdmin.from("forum_poll_votes").delete().eq("post_id", data.postId);
    // Nested replies first, then top-level comments.
    await supabaseAdmin.from("forum_comments").delete().eq("post_id", data.postId).not("parent_comment_id", "is", null);
    await supabaseAdmin.from("forum_comments").delete().eq("post_id", data.postId);
    const { error } = await supabaseAdmin.from("forum_posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    // Verify the row is really gone so the UI never shows a false success.
    const { data: still } = await supabaseAdmin.from("forum_posts").select("id").eq("id", data.postId).maybeSingle();
    if (still) throw new Error("Post could not be deleted (still referenced). Try again.");
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
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, role, is_pro, account_type").in("id", ids);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids);
    const { data: founders } = await supabaseAdmin
      .from("founders")
      .select("id, user_id, profile_complete, shadow_banned, spam_strikes, trust_tier, active_status")
      .in("user_id", ids);
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const fmap = new Map((founders ?? []).map((f: any) => [f.user_id, f]));
    const admins = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    return users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      created_at: u.created_at,
      last_sign_in_at: (u as any).last_sign_in_at ?? null,
      confirmed: !!(u as any).email_confirmed_at || !!(u as any).phone_confirmed_at,
      full_name: pmap.get(u.id)?.full_name ?? null,
      role: pmap.get(u.id)?.role ?? null,
      account_type: pmap.get(u.id)?.account_type ?? null,
      is_pro: !!pmap.get(u.id)?.is_pro,
      is_admin: admins.has(u.id),
      founder_id: fmap.get(u.id)?.id ?? null,
      profile_complete: !!fmap.get(u.id)?.profile_complete,
      shadow_banned: !!fmap.get(u.id)?.shadow_banned,
      spam_strikes: fmap.get(u.id)?.spam_strikes ?? 0,
      trust_tier: fmap.get(u.id)?.trust_tier ?? null,
      active_status: fmap.get(u.id)?.active_status ?? null,
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
      .select("id, title, category, created_at, upvotes, is_pinned, author:founders!forum_posts_author_id_fkey(id, seed_name, shadow_banned, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ------------------------------- new powers ------------------------------- */

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const count = async (table: string, apply?: (q: any) => any) => {
      let q = supabaseAdmin.from(table as any).select("*", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c } = await q;
      return c ?? 0;
    };
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [
      founders, complete, banned, posts, comments, convos, messages,
      requests, pending, blocks, newFounders, newPosts, pro,
      investors, talent, openRoles, applications,
    ] = await Promise.all([
      count("founders"),
      count("founders", (q) => q.eq("profile_complete", true)),
      count("founders", (q) => q.eq("shadow_banned", true)),
      count("forum_posts"),
      count("forum_comments"),
      count("conversations"),
      count("messages"),
      count("connection_requests"),
      count("connection_requests", (q) => q.eq("status", "pending")),
      count("blocks"),
      count("founders", (q) => q.gte("created_at", since)),
      count("forum_posts", (q) => q.gte("created_at", since)),
      count("profiles", (q) => q.eq("is_pro", true)),
      count("investor_profiles"),
      count("talent_profiles"),
      count("open_roles", (q) => q.eq("status", "open")),
      count("role_applications"),
    ]);
    return {
      founders, complete, banned, posts, comments, convos, messages,
      requests, pending, blocks, newFounders, newPosts, pro,
      investors, talent, openRoles, applications,
    };
  });

export const adminSetShadowBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { founderId: string; banned: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("founders")
      .update(
        data.banned
          ? { shadow_banned: true }
          : { shadow_banned: false, spam_strikes: 0 },
      )
      .eq("id", data.founderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; grant: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.grant) throw new Error("You cannot revoke your own admin role");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles")
        .delete().eq("user_id", data.userId).eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSetPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; pro: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ is_pro: data.pro }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetPostPinned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postId: string; pinned: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("forum_posts").update({ is_pinned: data.pinned }).eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("forum_comments")
      .select("id, content, created_at, post_id, author:founders!forum_comments_author_id_fkey(id, seed_name, shadow_banned, profiles(full_name)), post:forum_posts!forum_comments_post_id_fkey(id, title)")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { commentId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("forum_comments").delete().eq("parent_comment_id", data.commentId);
    const { error } = await supabaseAdmin.from("forum_comments").delete().eq("id", data.commentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messageId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("messages")
      .update({ deleted_at: new Date().toISOString(), content: "" }).eq("id", data.messageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.conversationId;
    await supabaseAdmin.from("messages").delete().eq("conversation_id", id);
    await supabaseAdmin.from("conversation_labels").delete().eq("conversation_id", id);
    await supabaseAdmin.from("conversation_pins").delete().eq("conversation_id", id);
    await supabaseAdmin.from("compatibility_reports").delete().eq("conversation_id", id);
    await supabaseAdmin.from("investor_feed_listings").delete().eq("conversation_id", id);
    const { error } = await supabaseAdmin.from("conversations").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("blocks")
      .select("id, reason, created_at, blocker:founders!blocks_blocker_id_fkey(id, seed_name, profiles(full_name)), blocked:founders!blocks_blocked_id_fkey(id, seed_name, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDeleteBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { blockId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blocks").delete().eq("id", data.blockId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("connection_requests")
      .select("id, status, message, prompt_question, created_at, from:founders!connection_requests_from_founder_id_fkey(id, seed_name, profiles(full_name)), to:founders!connection_requests_to_founder_id_fkey(id, seed_name, profiles(full_name))")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });


/* ----------------------------- marketplace admin ---------------------------- */

export const adminListMarketplace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [investors, talent, roles, apps] = await Promise.all([
      supabaseAdmin.from("investor_profiles")
        .select("id, fund_name, firm_type, location, is_public, verified, is_demo, user_id, created_at, profiles(full_name)")
        .order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("talent_profiles")
        .select("id, full_name, headline, work_type, location, is_public, is_demo, user_id, created_at")
        .order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("open_roles")
        .select("id, title, company_name, role_type, status, is_demo, posted_by, created_at")
        .order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("role_applications").select("id, role_id, status"),
    ]);
    const appCount = new Map<string, number>();
    (apps.data ?? []).forEach((a: any) => appCount.set(a.role_id, (appCount.get(a.role_id) ?? 0) + 1));
    return {
      investors: investors.data ?? [],
      talent: talent.data ?? [],
      roles: (roles.data ?? []).map((r: any) => ({ ...r, applications: appCount.get(r.id) ?? 0 })),
    };
  });

const MARKET_TABLES = ["investor_profiles", "talent_profiles", "open_roles"] as const;
type MarketTable = (typeof MARKET_TABLES)[number];

export const adminDeleteMarketRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: MarketTable; id: string }) => {
    if (!MARKET_TABLES.includes(d.table)) throw new Error("Unsupported table");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.table === "open_roles") {
      await supabaseAdmin.from("role_applications").delete().eq("role_id", data.id);
    }
    if (data.table === "investor_profiles") {
      await supabaseAdmin.from("investor_pitches").delete().eq("investor_profile_id", data.id);
    }
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetInvestorVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; verified: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("investor_profiles")
      .update({ verified: data.verified }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRoleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "open" | "closed" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("open_roles").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
