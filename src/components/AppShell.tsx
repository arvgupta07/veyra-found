import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Compass, Inbox, MessagesSquare, User, LogOut, Heart, Moon, Sun, ShieldCheck, Landmark, Briefcase, GraduationCap } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyProfile, useMyFounder } from "@/hooks/useMyFounder";
import { useAccountType } from "@/hooks/useAccountType";
import { canSee, accountLabel } from "@/lib/account-types";
import { useSession } from "@/hooks/useSession";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLiveInbox, useUnreadConversations } from "@/hooks/useLiveInbox";
import { getSeenSnapshot, isStale, markSeen, subscribeSeen } from "@/lib/nav-activity";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VeyraMark } from "@/components/VeyraLogo";
import { ChatDock } from "@/components/ChatDock";
import { VerifyModalHost } from "@/components/VerifyModal";


type NavItem = { to?: string; label: string; icon: typeof Compass; onClick?: () => void };

const founderNav: NavItem[] = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/matches", label: "Matches", icon: Heart },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/investors", label: "Investors", icon: Landmark },
  { to: "/roles", label: "Roles", icon: Briefcase },
  { to: "/talent", label: "Talent", icon: GraduationCap },
  { to: "/forum", label: "Forum", icon: MessagesSquare },
  { to: "/profile/me", label: "Profile", icon: User },
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useMyProfile();
  const { user } = useSession();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-nav", user?.id], enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role")
        .eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });
  const { accountType } = useAccountType();
  const { dark, toggle } = useDarkMode();
  useLiveInbox();
  const unread = useUnreadConversations();
  const hasUnread = unread.length > 0;
  const { data: myFounder } = useMyFounder();
  const seen = useSyncExternalStore(subscribeSeen, getSeenSnapshot, () => ({}) as Record<string, number>);

  const profileIncomplete = !!myFounder && (
    !myFounder.profile_complete ||
    !myFounder.bio ||
    !myFounder.headline ||
    !myFounder.location ||
    (myFounder.skills ?? []).length === 0 ||
    !myFounder.linkedin_url
  );
  const forumStale = isStale("forum", seen);

  useEffect(() => {
    if (pathname.startsWith("/forum")) markSeen("forum");
    if (pathname.startsWith("/matches")) markSeen("matches");
  }, [pathname]);

  function dotFor(to?: string) {
    if (to === "/inbox") return hasUnread;
    if (to === "/forum") return forumStale;
    if (to === "/profile/me") return profileIncomplete;
    return false;
  }

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const baseNav = founderNav.filter((n) => !n.to || canSee(accountType, n.to));
  const nav = isAdmin ? [...baseNav, { to: "/admin", label: "Admin", icon: ShieldCheck }] : baseNav;


  async function signOut() {
    setConfirmSignOut(false);
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth/login" });
  }


  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[3px] border-nav-fg/25 bg-nav px-4 py-6 md:flex">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.14]" />
        <Link to="/" className="relative flex items-center gap-2.5 px-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center border-[3px] border-nav-fg bg-nav-fg shadow-[3px_3px_0_0_var(--orange)]">
            <VeyraMark size={28} />
          </div>
          <span className="text-2xl font-black tracking-tight text-nav-fg">Veyra Found</span>
        </Link>
        <nav className="relative mt-8 space-y-2">
          {nav.map((n) => {
            const active = !!n.to && (pathname === n.to || pathname.startsWith(n.to));
            const dot = dotFor(n.to);
            const count = n.to === "/inbox" ? unread.length : 0;
            return (
              <NavCell key={n.label} item={n} className={`flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-black uppercase tracking-wide transition ${active ? "bg-orange text-nav shadow-brutal-sm" : "text-nav-fg/75 hover:bg-nav-fg/10 hover:text-nav-fg"}`}>
                <span className="flex items-center gap-3">
                  <span className="relative">
                    <n.icon className="h-4 w-4" />
                    {dot && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border border-ink bg-red" />}
                  </span>
                  {n.label}
                </span>
                {count > 0 ? (
                  <span className="rounded-full bg-red px-2 py-0.5 text-[10px] font-black text-nav">{count}</span>
                ) : dot ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-red" />
                ) : null}
              </NavCell>
            );
          })}
        </nav>
        <div className="relative mt-auto space-y-2">
          <div className="rounded-lg bg-nav-fg/10 p-3">
            <div className="text-xs text-nav-fg/60">Signed in as</div>
            <div className="truncate text-sm font-medium text-nav-fg">{profile?.full_name ?? "…"}</div>
            <div className="mt-1 inline-block border-2 border-nav-fg/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-nav-fg/70">{accountLabel(accountType)}</div>
          </div>
          <button onClick={toggle} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-nav-fg/75 hover:bg-nav-fg/10 hover:text-nav-fg">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={() => setConfirmSignOut(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-nav-fg/75 hover:bg-nav-fg/10 hover:text-nav-fg">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Compact top bar + tab strip (shown whenever the sidebar is hidden) */}
      <div className="fixed inset-x-0 top-0 z-30 border-b-[3px] border-nav-fg/30 bg-nav md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-2 border-nav-fg bg-nav-fg shadow-[2px_2px_0_0_var(--orange)]">
              <VeyraMark size={22} />
            </div>
            <span className="text-lg font-black tracking-tight text-nav-fg">Veyra Found</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggle} aria-label="Toggle dark mode" className="grid h-8 w-8 place-items-center border-2 border-nav-fg bg-nav-fg text-nav">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => setConfirmSignOut(true)} className="border-2 border-nav-fg bg-orange px-2 py-1 text-[10px] font-black uppercase text-nav">Sign out</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t-2 border-nav-fg/25 px-2 py-1.5">
          {nav.map((n) => {
            const active = !!n.to && (pathname === n.to || pathname.startsWith(n.to));
            const dot = dotFor(n.to);
            const count = n.to === "/inbox" ? unread.length : 0;
            return (
              <NavCell key={n.label} item={n}
                className={`flex items-center justify-center gap-1 border-2 px-1 py-1.5 text-[10px] font-black uppercase tracking-wider ${active ? "border-nav-fg bg-orange text-nav" : "border-nav-fg/40 text-nav-fg/80"}`}>
                <span className="relative">
                  <n.icon className="h-3.5 w-3.5" />
                  {dot && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-red" />}
                </span>
                <span className="hidden sm:inline">{n.label}</span>
                {count > 0 ? (
                  <span className="ml-0.5 rounded-full bg-red px-1 text-[9px] font-black text-nav">{count}</span>
                ) : dot ? (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red" />
                ) : null}
              </NavCell>
            );
          })}
        </div>
      </div>



      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink bg-white md:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = !!n.to && (pathname === n.to || pathname.startsWith(n.to));
          const dot = dotFor(n.to);
            const count = n.to === "/inbox" ? unread.length : 0;
          return (
            <NavCell key={n.label} item={n} className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-indigo" : "text-muted-text"}`}>
              <span className="relative">
                <n.icon className="h-5 w-5" />
                {dot && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border border-ink bg-red" />}
              </span>
              {n.label}
            </NavCell>
          );
        })}
      </nav>

      {/* Sign-out confirmation */}
      {confirmSignOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-4" onClick={() => setConfirmSignOut(false)}>
          <div className="w-full max-w-sm animate-pop-in border-[3px] border-ink bg-white p-6 shadow-brutal soft-corners" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg">Do you actually want to log out?</h2>
            <p className="mt-2 text-sm text-muted-text">You'll need to sign in again to see your requests and DMs.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmSignOut(false)}
                className="flex-1 border-2 border-ink bg-white px-4 py-2 text-sm font-black uppercase tracking-wider shadow-brutal-sm box-hover soft-corners">
                Stay signed in
              </button>
              <button onClick={signOut}
                className="flex-1 border-2 border-ink bg-red px-4 py-2 text-sm font-black uppercase tracking-wider text-white shadow-brutal-sm box-hover soft-corners">
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatDock />
      <VerifyModalHost />

      <main className="page-paper w-full md:pl-60 pt-[6.5rem] pb-16 md:pt-0 md:pb-0">{children}</main>

    </div>
  );
}

function NavCell({ item, className, children }: { item: NavItem; className: string; children: React.ReactNode }) {
  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link to={item.to!} className={className}>
      {children}
    </Link>
  );
}
