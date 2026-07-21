import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, MessageSquare, Users, FileText, ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListUsers, adminListConversations, adminListMessages, adminListPosts,
  adminDeleteUser, adminDeletePost,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { ready, session } = useRequireAuth();
  const [tab, setTab] = useState<"users" | "posts" | "dms">("users");

  const { data: isAdmin, isLoading: checking } = useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles")
        .select("role").eq("user_id", session!.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  if (!ready || checking) return null;
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center border-[3px] border-ink bg-red text-white shadow-brutal-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Admins only</h1>
          <p className="mt-2 text-sm text-muted-text">You need the admin role to view this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center border-[3px] border-ink bg-orange text-white shadow-brutal-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-text">Full control · delete accounts, posts, view any DM.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={Users} label="Users" />
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={FileText} label="Forum posts" />
          <TabBtn active={tab === "dms"} onClick={() => setTab("dms")} icon={MessageSquare} label="Conversations" />
        </div>

        {tab === "users" && <UsersPanel />}
        {tab === "posts" && <PostsPanel />}
        {tab === "dms" && <DmsPanel />}
      </div>
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 border-[3px] border-ink px-3 py-2 text-sm font-black shadow-brutal-sm transition ${
        active ? "bg-ink text-cream" : "bg-white text-ink hover:bg-cream"
      }`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const del = useServerFn(adminDeleteUser);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => { toast.success("Account deleted"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-text">Loading users…</div>;
  return (
    <div className="border-[3px] border-ink bg-white shadow-brutal-sm">
      <div className="grid grid-cols-12 gap-2 border-b-[3px] border-ink bg-cream px-3 py-2 text-[11px] font-black uppercase tracking-wider">
        <div className="col-span-4">Email</div>
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2 text-right">Action</div>
      </div>
      {(data ?? []).map((u: any) => (
        <div key={u.id} className="grid grid-cols-12 items-center gap-2 border-b-2 border-ink/10 px-3 py-2 text-sm last:border-0">
          <div className="col-span-4 truncate">{u.email}</div>
          <div className="col-span-4 truncate">{u.full_name ?? "—"}</div>
          <div className="col-span-2 truncate text-xs">{u.role ?? "—"}</div>
          <div className="col-span-2 text-right">
            <button
              onClick={() => { if (confirm(`Delete ${u.email}? This cannot be undone.`)) mut.mutate(u.id); }}
              className="inline-flex items-center gap-1 border-2 border-ink bg-red px-2 py-1 text-xs font-black text-white shadow-brutal-sm hover:-translate-y-0.5">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostsPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPosts);
  const del = useServerFn(adminDeletePost);
  const { data, isLoading } = useQuery({ queryKey: ["admin-posts"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (postId: string) => del({ data: { postId } }),
    onSuccess: () => { toast.success("Post deleted"); qc.invalidateQueries({ queryKey: ["admin-posts"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (isLoading) return <div className="text-sm text-muted-text">Loading posts…</div>;
  return (
    <div className="space-y-2">
      {(data ?? []).map((p: any) => (
        <div key={p.id} className="flex items-center gap-3 border-[3px] border-ink bg-white p-3 shadow-brutal-sm">
          <div className="min-w-0 flex-1">
            <div className="truncate font-black">{p.title}</div>
            <div className="text-xs text-muted-text">
              {p.category} · by {p.author?.profiles?.full_name ?? p.author?.seed_name ?? "unknown"} · {new Date(p.created_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => { if (confirm("Delete this post?")) mut.mutate(p.id); }}
            className="inline-flex items-center gap-1 border-2 border-ink bg-red px-2 py-1 text-xs font-black text-white shadow-brutal-sm">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function DmsPanel() {
  const listConvos = useServerFn(adminListConversations);
  const listMsgs = useServerFn(adminListMessages);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: convos, isLoading } = useQuery({ queryKey: ["admin-convos"], queryFn: () => listConvos() });
  const { data: msgs } = useQuery({
    queryKey: ["admin-msgs", openId], enabled: !!openId,
    queryFn: () => listMsgs({ data: { conversationId: openId! } }),
  });

  if (openId) {
    const c = (convos ?? []).find((x: any) => x.id === openId);
    return (
      <div>
        <button onClick={() => setOpenId(null)} className="mb-3 inline-flex items-center gap-1 border-2 border-ink bg-white px-2 py-1 text-xs font-black">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="mb-3 border-[3px] border-ink bg-cream p-3 text-sm font-black">
          {c?.a?.profiles?.full_name ?? c?.a?.seed_name} ↔ {c?.b?.profiles?.full_name ?? c?.b?.seed_name}
        </div>
        <div className="space-y-2">
          {(msgs ?? []).map((m: any) => (
            <div key={m.id} className="border-2 border-ink bg-white p-2 text-sm">
              <div className="text-[10px] font-black uppercase text-muted-text">
                {m.sender_id ?? m.seed_sender_founder_id} · {new Date(m.created_at).toLocaleString()}
                {m.deleted_at && " · deleted"}
              </div>
              <div className={m.deleted_at ? "italic text-muted-text" : ""}>{m.content || "(empty)"}</div>
            </div>
          ))}
          {(msgs ?? []).length === 0 && <div className="text-sm text-muted-text">No messages.</div>}
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-text">Loading conversations…</div>;
  return (
    <div className="space-y-2">
      {(convos ?? []).map((c: any) => (
        <button key={c.id} onClick={() => setOpenId(c.id)}
          className="flex w-full items-center justify-between border-[3px] border-ink bg-white p-3 text-left shadow-brutal-sm hover:bg-cream">
          <div className="min-w-0">
            <div className="truncate font-black">
              {c.a?.profiles?.full_name ?? c.a?.seed_name} ↔ {c.b?.profiles?.full_name ?? c.b?.seed_name}
            </div>
            <div className="text-xs text-muted-text">{c.stage} · {new Date(c.created_at).toLocaleString()}</div>
          </div>
          <span className="text-xs font-black text-orange">View →</span>
        </button>
      ))}
    </div>
  );
}
