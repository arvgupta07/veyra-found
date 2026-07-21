import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "arv.gupta@bcomiaf.christuni.in";
const ADMIN_PASSWORD = "pass-2522409";

// One-shot idempotent admin bootstrap. Safe to hit multiple times.
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) return Response.json({ ok: false, error: listErr.message }, { status: 500 });
        let user = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
        if (!user) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: "Admin", role: "founder" },
          });
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          user = data.user!;
        }
        const { error: roleErr } = await supabaseAdmin
          .from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
        if (roleErr) return Response.json({ ok: false, error: roleErr.message }, { status: 500 });
        return Response.json({ ok: true, userId: user.id });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to bootstrap admin" }),
    },
  },
});
