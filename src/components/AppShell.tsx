import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Compass, Inbox, MessagesSquare, User, LogOut, Heart, Moon, Sun, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyProfile } from "@/hooks/useMyFounder";
import { useSession } from "@/hooks/useSession";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLiveInbox, useUnreadConversations } from "@/hooks/useLiveInbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VeyraMark } from "@/components/VeyraLogo";

const founderNav = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/matches", label: "Matches", icon: Heart },
  { to: "/inbox", label: "Inbox", icon: Inbox },
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
  const { dark, toggle } = useDarkMode();
  useLiveInbox();
  const unread = useUnreadConversations();
  const hasUnread = unread.length > 0;
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const baseNav = founderNav;
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
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r-[3px] border-ink bg-ink px-4 py-6 md:flex">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.14]" />
        <Link to="/" className="relative flex items-center gap-2.5 px-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center border-[3px] border-cream bg-cream shadow-[3px_3px_0_0_var(--orange)]">
            <VeyraMark size={28} />
          </div>
          <span className="text-2xl font-black tracking-tight text-cream">Veyra Found</span>
        </Link>
        <nav className="relative mt-8 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            const dot = n.to === "/inbox" && hasUnread;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-indigo text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <span className="relative">
                  <n.icon className="h-4 w-4" />
                  {dot && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border border-ink bg-red" />}
                </span>
                {n.label}
                {dot && (
                  <span className="ml-auto rounded-full bg-red px-1.5 py-0.5 text-[10px] font-black text-white">{unread.length}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="relative mt-auto space-y-2">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs text-white/50">Signed in as</div>
            <div className="truncate text-sm font-medium text-white">{profile?.full_name ?? "…"}</div>
          </div>
          <button onClick={toggle} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={() => setConfirmSignOut(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b-[3px] border-cream bg-ink px-4 py-2.5 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center border-2 border-cream bg-cream shadow-[2px_2px_0_0_var(--orange)]">
            <VeyraMark size={22} />
          </div>
          <span className="text-lg font-black tracking-tight text-cream">Veyra Found</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggle} aria-label="Toggle dark mode" className="grid h-8 w-8 place-items-center border-2 border-cream bg-cream text-ink">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setConfirmSignOut(true)} className="border-2 border-cream bg-orange px-2 py-1 text-[10px] font-black uppercase text-white">Sign out</button>
        </div>
      </div>


      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink bg-white md:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
          const dot = n.to === "/inbox" && hasUnread;
          return (
            <Link key={n.to} to={n.to} className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-indigo" : "text-muted-text"}`}>
              <span className="relative">
                <n.icon className="h-5 w-5" />
                {dot && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border border-ink bg-red" />}
              </span>
              {n.label}
            </Link>
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

      <main className="page-paper w-full md:pl-60 pt-14 pb-16 md:pt-0 md:pb-0">{children}</main>

    </div>
  );
}
