import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Trash2, MessageSquare, Users, FileText, ArrowLeft, ShieldCheck, BarChart3,
  Ban, Pin, PinOff, Search, Shield, ShieldOff, Link2, MessageCircle,
  RefreshCw, Sparkles, UserX, BadgeCheck, Store, Briefcase, Landmark, GraduationCap, Power,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListUsers, adminListConversations, adminListMessages, adminListPosts,
  adminDeleteUser, adminDeletePost, adminStats, adminSetShadowBan, adminSetAdminRole,
  adminSetPostPinned, adminListComments, adminDeleteComment,
  adminDeleteMessage, adminDeleteConversation, adminListBlocks, adminDeleteBlock,
  adminListRequests, adminListMarketplace, adminDeleteMarketRow,
  adminSetInvestorVerified, adminSetRoleStatus,
} from "@/lib/admin.functions";
import { RoleBadge } from "@/components/RoleBadge";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Control Center · Veyra Found" },
      { name: "description", content: "Moderate founders, forum posts, conversations and connection requests on Veyra Found." },
      { property: "og:title", content: "Admin Control Center · Veyra Found" },
      { property: "og:description", content: "Internal moderation dashboard for the Veyra Found co-founder network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Tab = "overview" | "users" | "verify" | "market" | "posts" | "comments" | "dms" | "requests" | "blocks";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "verify", label: "Verification", icon: BadgeCheck },
  { id: "market", label: "Marketplace", icon: Store },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageCircle },
  { id: "dms", label: "Conversations", icon: MessageSquare },
  { id: "requests", label: "Requests", icon: Link2 },
  { id: "blocks", label: "Blocks", icon: Ban },
];

function AdminPage() {
  const { ready, session } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("overview");

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
            <h1 className="text-3xl font-black tracking-tight">Admin Control Center</h1>
            <p className="text-sm text-muted-text">Moderate people, content and conversations across Veyra.</p>
          </div>
        </div>

        <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {TABS.map((t) => (
            <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />
          ))}
        </div>

        {tab === "overview" && <OverviewPanel onJump={setTab} />}
        {tab === "users" && <UsersPanel meId={session!.user.id} />}
        {tab === "verify" && <VerificationPanel />}
        {tab === "market" && <MarketPanel />}
        {tab === "posts" && <PostsPanel />}
        {tab === "comments" && <CommentsPanel />}
        {tab === "dms" && <DmsPanel />}
        {tab === "requests" && <RequestsPanel />}
        {tab === "blocks" && <BlocksPanel />}
      </div>
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 border-[3px] border-ink px-3 py-2 text-sm font-black shadow-brutal-sm transition hover:-translate-y-0.5 ${
        active ? "bg-ink text-cream" : "bg-white text-ink hover:bg-cream"
      }`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function IconBtn({ onClick, icon: Icon, label, tone = "white", disabled }: any) {
  const tones: Record<string, string> = {
    white: "bg-white text-ink",
    red: "bg-red text-white",
    orange: "bg-orange text-white",
    ink: "bg-ink text-cream",
    sage: "bg-sage text-ink",
  };
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className={`inline-flex items-center gap-1 border-2 border-ink px-2 py-1 text-xs font-black shadow-brutal-sm transition hover:-translate-y-0.5 disabled:opacity-40 ${tones[tone]}`}>
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-[3px] border-dashed border-ink p-8 text-center text-sm font-black text-muted-text">{children}</div>;
}

function Card({ children, className = "" }: any) {
  return <div className={`border-[3px] border-ink bg-white p-3 shadow-brutal-sm ${className}`}>{children}</div>;
}

function useRefresher(keys: string[]) {
  const qc = useQueryClient();
  return () => { keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); };
}

/* -------------------------------- overview -------------------------------- */

function OverviewPanel({ onJump }: { onJump: (t: Tab) => void }) {
  const stats = useServerFn(adminStats);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin-stats"], queryFn: () => stats() });

  if (isLoading) return <div className="text-sm text-muted-text">Crunching numbers…</div>;
  const s = data!;
  const tiles: { label: string; value: number; tone: string; tab?: Tab }[] = [
    { label: "Founders", value: s.founders, tone: "bg-sage", tab: "users" },
    { label: "Completed profiles", value: s.complete, tone: "bg-cream" },
    { label: "New this week", value: s.newFounders, tone: "bg-cream" },
    { label: "Shadow-banned", value: s.banned, tone: "bg-red text-white", tab: "users" },
    { label: "Forum posts", value: s.posts, tone: "bg-cream", tab: "posts" },
    { label: "Posts this week", value: s.newPosts, tone: "bg-cream" },
    { label: "Comments", value: s.comments, tone: "bg-cream", tab: "comments" },
    { label: "Conversations", value: s.convos, tone: "bg-sage", tab: "dms" },
    { label: "Messages", value: s.messages, tone: "bg-cream" },
    { label: "Requests", value: s.requests, tone: "bg-cream", tab: "requests" },
    { label: "Pending requests", value: s.pending, tone: "bg-orange text-white", tab: "requests" },
    { label: "Blocks", value: s.blocks, tone: "bg-cream", tab: "blocks" },
    { label: "Investor profiles", value: s.investors, tone: "bg-sage", tab: "market" },
    { label: "Talent profiles", value: s.talent, tone: "bg-sage", tab: "market" },
    { label: "Open roles", value: s.openRoles, tone: "bg-cream", tab: "market" },
    { label: "Applications", value: s.applications, tone: "bg-cream", tab: "market" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-text">
          <Sparkles className="h-3.5 w-3.5" /> Platform pulse
        </div>
        <IconBtn onClick={() => refetch()} icon={RefreshCw} label={isFetching ? "Refreshing…" : "Refresh"} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <button key={t.label} onClick={() => t.tab && onJump(t.tab)}
            className={`border-[3px] border-ink p-3 text-left shadow-brutal-sm transition ${t.tone} ${t.tab ? "hover:-translate-y-0.5" : "cursor-default"}`}>
            <div className="text-3xl font-black leading-none">{t.value}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-wider opacity-80">{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- users --------------------------------- */

function UsersPanel({ meId }: { meId: string }) {
  const refresh = useRefresher(["admin-users", "admin-stats"]);
  const list = useServerFn(adminListUsers);
  const del = useServerFn(adminDeleteUser);
  const ban = useServerFn(adminSetShadowBan);
  const role = useServerFn(adminSetAdminRole);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "incomplete" | "admins" | "founder" | "investor" | "talent">("all");

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const mDel = useMutation({ mutationFn: (userId: string) => del({ data: { userId } }), onSuccess: () => { toast.success("Account deleted"); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const mBan = useMutation({ mutationFn: (v: { founderId: string; banned: boolean }) => ban({ data: v }), onSuccess: () => { toast.success("Updated"); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const mRole = useMutation({ mutationFn: (v: { userId: string; grant: boolean }) => role({ data: v }), onSuccess: () => { toast.success("Role updated"); refresh(); }, onError: (e: any) => toast.error(e.message) });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((u: any) => {
      if (filter === "banned" && !u.shadow_banned) return false;
      if (filter === "incomplete" && u.profile_complete) return false;
      if (filter === "admins" && !u.is_admin) return false;
      if (filter === "founder" && u.account_type !== "founder") return false;
      if (filter === "investor" && u.account_type !== "investor") return false;
      if (filter === "talent" && u.account_type !== "talent" && u.account_type !== "intern") return false;
      if (!needle) return true;
      return [u.email, u.phone, u.full_name, u.id].some((v: any) => (v ?? "").toString().toLowerCase().includes(needle));
    });
  }, [data, q, filter]);

  if (isLoading) return <div className="text-sm text-muted-text">Loading users…</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 border-[3px] border-ink bg-white px-2 py-1.5 shadow-brutal-sm">
          <Search className="h-4 w-4 shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, phone, name or id"
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-text" />
        </div>
        {(["all", "founder", "investor", "talent", "banned", "incomplete", "admins"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`border-2 border-ink px-2 py-1.5 text-xs font-black uppercase shadow-brutal-sm ${filter === f ? "bg-ink text-cream" : "bg-white"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="text-xs font-black uppercase tracking-wider text-muted-text">{rows.length} user(s)</div>

      {rows.length === 0 && <Empty>No users match.</Empty>}
      <div className="space-y-2">
        {rows.map((u: any) => (
          <Card key={u.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-black">{u.full_name ?? "Unnamed"}</span>
                  <RoleBadge type={u.account_type} size="xs" />
                  {u.is_admin && <Badge tone="bg-ink text-cream">admin</Badge>}
                  {u.shadow_banned && <Badge tone="bg-red text-white">shadow-banned</Badge>}
                  {!u.profile_complete && <Badge tone="bg-cream">incomplete</Badge>}
                  {u.trust_tier && <Badge tone="bg-sage">{u.trust_tier}</Badge>}
                  {u.spam_strikes > 0 && <Badge tone="bg-red text-white">{u.spam_strikes} strike(s)</Badge>}
                </div>
                <div className="mt-1 truncate text-xs text-muted-text">
                  {u.email ?? u.phone ?? "no contact"} · joined {new Date(u.created_at).toLocaleDateString()}
                  {u.last_sign_in_at && ` · last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {u.founder_id && (
                  <IconBtn
                    onClick={() => mBan.mutate({ founderId: u.founder_id, banned: !u.shadow_banned })}
                    icon={u.shadow_banned ? ShieldOff : Ban}
                    tone={u.shadow_banned ? "sage" : "orange"}
                    label={u.shadow_banned ? "Unban" : "Shadow ban"} />
                )}
                <IconBtn
                  onClick={() => {
                    if (u.id === meId && u.is_admin) { toast.error("You can't revoke your own admin role"); return; }
                    mRole.mutate({ userId: u.id, grant: !u.is_admin });
                  }}
                  icon={Shield} tone={u.is_admin ? "ink" : "white"}
                  label={u.is_admin ? "Revoke admin" : "Make admin"} />
                <IconBtn
                  onClick={() => { if (u.id === meId) { toast.error("You can't delete yourself"); return; } if (confirm(`Delete ${u.email ?? u.full_name ?? u.id}? This cannot be undone.`)) mDel.mutate(u.id); }}
                  icon={UserX} tone="red" label="Delete" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, tone = "bg-cream" }: any) {
  return <span className={`border-2 border-ink px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${tone}`}>{children}</span>;
}

/* ---------------------------------- posts --------------------------------- */

function PostsPanel() {
  const refresh = useRefresher(["admin-posts", "admin-stats"]);
  const list = useServerFn(adminListPosts);
  const del = useServerFn(adminDeletePost);
  const pin = useServerFn(adminSetPostPinned);
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-posts"], queryFn: () => list() });
  const mDel = useMutation({ mutationFn: (postId: string) => del({ data: { postId } }), onSuccess: () => { toast.success("Post deleted"); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const mPin = useMutation({ mutationFn: (v: { postId: string; pinned: boolean }) => pin({ data: v }), onSuccess: () => { toast.success("Updated"); refresh(); }, onError: (e: any) => toast.error(e.message) });

  if (isLoading) return <div className="text-sm text-muted-text">Loading posts…</div>;
  if (error) return <div className="border-[3px] border-ink bg-red p-3 text-sm font-black text-white">Couldn't load posts: {(error as any).message}</div>;

  const rows = (data ?? []).filter((p: any) => !q.trim() || p.title?.toLowerCase().includes(q.trim().toLowerCase()));
  if (rows.length === 0) return <Empty>No forum posts{q ? " match" : " yet"}.</Empty>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-[3px] border-ink bg-white px-2 py-1.5 shadow-brutal-sm">
        <Search className="h-4 w-4" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search post titles"
          className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-text" />
      </div>
      <div className="space-y-2">
        {rows.map((p: any) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-black">{p.title}</span>
                  {p.is_pinned && <Badge tone="bg-orange text-white">pinned</Badge>}
                  {p.author?.shadow_banned && <Badge tone="bg-red text-white">banned author</Badge>}
                </div>
                <div className="text-xs text-muted-text">
                  {p.category} · {p.upvotes ?? 0} upvotes · by {p.author?.profiles?.full_name ?? p.author?.seed_name ?? "unknown"} · {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a href={`/forum/${p.id}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 border-2 border-ink bg-white px-2 py-1 text-xs font-black shadow-brutal-sm">
                  <Link2 className="h-3 w-3" /> Open
                </a>
                <IconBtn onClick={() => mPin.mutate({ postId: p.id, pinned: !p.is_pinned })}
                  icon={p.is_pinned ? PinOff : Pin} tone={p.is_pinned ? "ink" : "white"}
                  label={p.is_pinned ? "Unpin" : "Pin"} />
                <IconBtn onClick={() => { if (confirm("Delete this post and all its replies?")) mDel.mutate(p.id); }} icon={Trash2} tone="red" label="Delete" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- comments -------------------------------- */

function CommentsPanel() {
  const refresh = useRefresher(["admin-comments", "admin-stats"]);
  const list = useServerFn(adminListComments);
  const del = useServerFn(adminDeleteComment);
  const { data, isLoading } = useQuery({ queryKey: ["admin-comments"], queryFn: () => list() });
  const mDel = useMutation({ mutationFn: (commentId: string) => del({ data: { commentId } }), onSuccess: () => { toast.success("Comment deleted"); refresh(); }, onError: (e: any) => toast.error(e.message) });

  if (isLoading) return <div className="text-sm text-muted-text">Loading comments…</div>;
  if ((data ?? []).length === 0) return <Empty>No comments yet.</Empty>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((c: any) => (
        <Card key={c.id}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-text">
                on <span className="font-black text-ink">{c.post?.title ?? "deleted post"}</span> · by {c.author?.profiles?.full_name ?? c.author?.seed_name ?? "unknown"} · {new Date(c.created_at).toLocaleString()}
                {c.author?.shadow_banned && " · banned author"}
              </div>
              <div className="mt-1 text-sm">{c.content}</div>
            </div>
            <IconBtn onClick={() => { if (confirm("Delete this comment and its replies?")) mDel.mutate(c.id); }} icon={Trash2} tone="red" label="Delete" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ----------------------------------- dms ---------------------------------- */

function DmsPanel() {
  const refresh = useRefresher(["admin-convos", "admin-msgs", "admin-stats"]);
  const listConvos = useServerFn(adminListConversations);
  const listMsgs = useServerFn(adminListMessages);
  const delMsg = useServerFn(adminDeleteMessage);
  const delConvo = useServerFn(adminDeleteConversation);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: convos, isLoading } = useQuery({ queryKey: ["admin-convos"], queryFn: () => listConvos() });
  const { data: msgs } = useQuery({
    queryKey: ["admin-msgs", openId], enabled: !!openId,
    queryFn: () => listMsgs({ data: { conversationId: openId! } }),
  });
  const mDelMsg = useMutation({ mutationFn: (messageId: string) => delMsg({ data: { messageId } }), onSuccess: () => { toast.success("Message removed"); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const mDelConvo = useMutation({
    mutationFn: (conversationId: string) => delConvo({ data: { conversationId } }),
    onSuccess: () => { toast.success("Conversation deleted"); setOpenId(null); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  const name = (f: any) => f?.profiles?.full_name ?? f?.seed_name ?? "unknown";

  if (openId) {
    const c = (convos ?? []).find((x: any) => x.id === openId);
    return (
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button onClick={() => setOpenId(null)} className="inline-flex items-center gap-1 border-2 border-ink bg-white px-2 py-1 text-xs font-black shadow-brutal-sm">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <IconBtn onClick={() => { if (confirm("Delete this whole conversation and every message in it?")) mDelConvo.mutate(openId); }} icon={Trash2} tone="red" label="Delete conversation" />
        </div>
        <div className="mb-3 border-[3px] border-ink bg-cream p-3 text-sm font-black">
          {name(c?.a)} ↔ {name(c?.b)} · {(msgs ?? []).length} message(s)
        </div>
        <div className="space-y-2">
          {(msgs ?? []).map((m: any) => (
            <div key={m.id} className="flex items-start gap-2 border-2 border-ink bg-white p-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase text-muted-text">
                  {m.sender_id ?? m.seed_sender_founder_id} · {new Date(m.created_at).toLocaleString()}
                  {m.edited_at && " · edited"}{m.deleted_at && " · deleted"}
                </div>
                <div className={m.deleted_at ? "italic text-muted-text" : ""}>{m.content || "(empty)"}</div>
              </div>
              {!m.deleted_at && (
                <IconBtn onClick={() => { if (confirm("Remove this message?")) mDelMsg.mutate(m.id); }} icon={Trash2} tone="red" label="Remove" />
              )}
            </div>
          ))}
          {(msgs ?? []).length === 0 && <Empty>No messages.</Empty>}
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-text">Loading conversations…</div>;
  if ((convos ?? []).length === 0) return <Empty>No conversations yet.</Empty>;
  return (
    <div className="space-y-2">
      {(convos ?? []).map((c: any) => (
        <button key={c.id} onClick={() => setOpenId(c.id)}
          className="flex w-full items-center justify-between border-[3px] border-ink bg-white p-3 text-left shadow-brutal-sm transition hover:-translate-y-0.5 hover:bg-cream">
          <div className="min-w-0">
            <div className="truncate font-black">{name(c.a)} ↔ {name(c.b)}</div>
            <div className="text-xs text-muted-text">{c.stage} · {new Date(c.created_at).toLocaleString()}</div>
          </div>
          <span className="text-xs font-black text-orange">View →</span>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- requests -------------------------------- */

function RequestsPanel() {
  const list = useServerFn(adminListRequests);
  const { data, isLoading } = useQuery({ queryKey: ["admin-requests"], queryFn: () => list() });
  const [status, setStatus] = useState<"all" | "pending" | "accepted" | "declined" | "withdrawn">("all");
  if (isLoading) return <div className="text-sm text-muted-text">Loading requests…</div>;
  const rows = (data ?? []).filter((r: any) => status === "all" || r.status === status);
  const name = (f: any) => f?.profiles?.full_name ?? f?.seed_name ?? "unknown";
  const tone: Record<string, string> = { pending: "bg-orange text-white", accepted: "bg-sage", declined: "bg-red text-white", withdrawn: "bg-cream" };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "accepted", "declined", "withdrawn"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`border-2 border-ink px-2 py-1.5 text-xs font-black uppercase shadow-brutal-sm ${status === s ? "bg-ink text-cream" : "bg-white"}`}>{s}</button>
        ))}
      </div>
      {rows.length === 0 && <Empty>No connection requests here.</Empty>}
      {rows.map((r: any) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-black">{name(r.from)} → {name(r.to)}</div>
              {r.prompt_question && <div className="text-xs font-black text-muted-text">{r.prompt_question}</div>}
              {r.message && <div className="mt-1 text-sm">{r.message}</div>}
              <div className="mt-1 text-xs text-muted-text">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <Badge tone={tone[r.status] ?? "bg-cream"}>{r.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* --------------------------------- blocks --------------------------------- */

function BlocksPanel() {
  const refresh = useRefresher(["admin-blocks", "admin-stats"]);
  const list = useServerFn(adminListBlocks);
  const del = useServerFn(adminDeleteBlock);
  const { data, isLoading } = useQuery({ queryKey: ["admin-blocks"], queryFn: () => list() });
  const mDel = useMutation({ mutationFn: (blockId: string) => del({ data: { blockId } }), onSuccess: () => { toast.success("Block lifted"); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const name = (f: any) => f?.profiles?.full_name ?? f?.seed_name ?? "unknown";
  if (isLoading) return <div className="text-sm text-muted-text">Loading blocks…</div>;
  if ((data ?? []).length === 0) return <Empty>Nobody has blocked anybody. Nice.</Empty>;
  return (
    <div className="space-y-2">
      {(data ?? []).map((b: any) => (
        <Card key={b.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-black">{name(b.blocker)} ⛔ {name(b.blocked)}</div>
              <div className="text-xs text-muted-text">{b.reason ?? "no reason given"} · {new Date(b.created_at).toLocaleString()}</div>
            </div>
            <IconBtn onClick={() => { if (confirm("Lift this block?")) mDel.mutate(b.id); }} icon={ShieldOff} tone="orange" label="Lift block" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ----------------------------- verification ------------------------------ */

function VerificationPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications", filter],
    queryFn: async () => {
      let q = supabase
        .from("verification_requests")
        .select("*, founder:founders!verification_requests_founder_id_fkey(id, headline, location, seed_name, verified, profiles(full_name))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const mReview = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: "approved" | "rejected"; reviewNote?: string }) => {
      const { error } = await supabase
        .from("verification_requests")
        .update({ status, review_note: reviewNote ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review saved");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-text">Loading verification queue…</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`border-2 border-ink px-3 py-1 text-[11px] font-black uppercase tracking-wider ${filter === f ? "bg-ink text-cream" : "bg-white text-ink"}`}>
            {f}
          </button>
        ))}
      </div>

      {(data ?? []).length === 0 ? (
        <Empty>Queue is clear. No founders waiting on verification.</Empty>
      ) : (
        (data ?? []).map((r: any) => {
          const name = r.founder?.profiles?.full_name ?? r.founder?.seed_name ?? "unknown founder";
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black">{name}</span>
                    <Badge tone={r.status === "approved" ? "bg-sage" : r.status === "rejected" ? "bg-red text-white" : "bg-cream"}>{r.status}</Badge>
                    {r.founder?.verified && <Badge tone="bg-sage">verified</Badge>}
                  </div>
                  <div className="text-xs text-muted-text">
                    {r.founder?.headline ?? "—"} · {r.founder?.location ?? "—"} · {new Date(r.created_at).toLocaleString()}
                  </div>
                  <a href={r.linkedin_url} target="_blank" rel="noreferrer noopener"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-black text-orange underline">
                    <Link2 className="h-3 w-3" /> {r.linkedin_url}
                  </a>
                  {r.affiliation && <div className="mt-1 text-xs font-semibold">Affiliation: {r.affiliation}</div>}
                  <p className="mt-2 whitespace-pre-wrap text-sm">{r.note}</p>
                  {r.review_note && <p className="mt-1 text-xs font-bold text-red">Review note: {r.review_note}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button onClick={() => mReview.mutate({ id: r.id, status: "approved" })}
                      className="border-[3px] border-ink bg-sage px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-ink shadow-brutal-sm">
                      Approve
                    </button>
                    <button onClick={() => {
                        const reason = prompt("Reason for declining (shown to the founder):") ?? "";
                        if (!reason.trim()) return;
                        mReview.mutate({ id: r.id, status: "rejected", reviewNote: reason.trim() });
                      }}
                      className="border-[3px] border-ink bg-red px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-brutal-sm">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------- marketplace ------------------------------ */

function MarketPanel() {
  const refresh = useRefresher(["admin-market", "admin-stats"]);
  const list = useServerFn(adminListMarketplace);
  const del = useServerFn(adminDeleteMarketRow);
  const verify = useServerFn(adminSetInvestorVerified);
  const setStatus = useServerFn(adminSetRoleStatus);
  const [sub, setSub] = useState<"investors" | "talent" | "roles">("investors");

  const { data, isLoading } = useQuery({ queryKey: ["admin-market"], queryFn: () => list() });

  const mDel = useMutation({
    mutationFn: (v: { table: "investor_profiles" | "talent_profiles" | "open_roles"; id: string }) => del({ data: v }),
    onSuccess: () => { toast.success("Deleted"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mVerify = useMutation({
    mutationFn: (v: { id: string; verified: boolean }) => verify({ data: v }),
    onSuccess: () => { toast.success("Updated"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mStatus = useMutation({
    mutationFn: (v: { id: string; status: "open" | "closed" }) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Updated"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-text">Loading marketplace…</div>;
  const d = data!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {([
          { v: "investors", label: `Investors (${d.investors.length})`, icon: Landmark },
          { v: "talent", label: `Talent (${d.talent.length})`, icon: GraduationCap },
          { v: "roles", label: `Roles (${d.roles.length})`, icon: Briefcase },
        ] as const).map((t) => (
          <TabBtn key={t.v} active={sub === t.v} onClick={() => setSub(t.v)} icon={t.icon} label={t.label} />
        ))}
      </div>

      {sub === "investors" && (
        <div className="space-y-2">
          {d.investors.length === 0 && <Empty>No investor profiles yet.</Empty>}
          {d.investors.map((i: any) => (
            <Card key={i.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-black">{i.fund_name ?? i.profiles?.full_name ?? "Unnamed fund"}</span>
                    {i.is_demo && <Badge tone="bg-orange text-white">demo</Badge>}
                    {i.verified && <Badge tone="bg-sage">verified</Badge>}
                    {!i.is_public && <Badge tone="bg-cream">hidden</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-text">
                    {i.firm_type ?? "—"} · {i.location ?? "no location"} · added {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <IconBtn onClick={() => mVerify.mutate({ id: i.id, verified: !i.verified })}
                    icon={BadgeCheck} tone={i.verified ? "ink" : "white"} label={i.verified ? "Unverify" : "Verify"} />
                  <IconBtn onClick={() => { if (confirm("Delete this investor profile?")) mDel.mutate({ table: "investor_profiles", id: i.id }); }}
                    icon={Trash2} tone="red" label="Delete" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {sub === "talent" && (
        <div className="space-y-2">
          {d.talent.length === 0 && <Empty>No talent profiles yet.</Empty>}
          {d.talent.map((t: any) => (
            <Card key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-black">{t.full_name ?? "Unnamed"}</span>
                    {t.is_demo && <Badge tone="bg-orange text-white">demo</Badge>}
                    <Badge tone="bg-cream">{t.work_type}</Badge>
                    {!t.is_public && <Badge tone="bg-cream">hidden</Badge>}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-text">
                    {t.headline ?? "no headline"} · {t.location ?? "no location"}
                  </div>
                </div>
                <IconBtn onClick={() => { if (confirm("Delete this talent profile?")) mDel.mutate({ table: "talent_profiles", id: t.id }); }}
                  icon={Trash2} tone="red" label="Delete" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {sub === "roles" && (
        <div className="space-y-2">
          {d.roles.length === 0 && <Empty>No roles posted yet.</Empty>}
          {d.roles.map((r: any) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-black">{r.title}</span>
                    {r.is_demo && <Badge tone="bg-orange text-white">demo</Badge>}
                    <Badge tone="bg-cream">{r.role_type}</Badge>
                    <Badge tone={r.status === "open" ? "bg-sage" : "bg-red text-white"}>{r.status}</Badge>
                    <Badge tone="bg-cream">{r.applications} applicant(s)</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-text">
                    {r.company_name ?? "no company"} · posted {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <IconBtn onClick={() => mStatus.mutate({ id: r.id, status: r.status === "open" ? "closed" : "open" })}
                    icon={Power} tone={r.status === "open" ? "orange" : "sage"} label={r.status === "open" ? "Close" : "Reopen"} />
                  <IconBtn onClick={() => { if (confirm("Delete this role and its applications?")) mDel.mutate({ table: "open_roles", id: r.id }); }}
                    icon={Trash2} tone="red" label="Delete" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
