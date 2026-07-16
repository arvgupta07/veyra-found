import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Compass, Inbox, MessagesSquare, User, Sparkles, LogOut, TrendingUp } from "lucide-react";
import { useMyProfile } from "@/hooks/useMyFounder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const founderNav = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/forum", label: "Forum", icon: MessagesSquare },
  { to: "/investor-feed", label: "Investors", icon: TrendingUp },
  { to: "/profile/me", label: "Profile", icon: User },
];
const investorNav = [
  { to: "/dashboard", label: "Dashboard", icon: TrendingUp },
  { to: "/investor-feed", label: "Deal Feed", icon: Compass },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useMyProfile();
  const nav = profile?.role === "investor" ? investorNav : founderNav;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth/login" });
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-white/5 bg-navy px-4 py-6 md:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">CoFound<span className="text-indigo-light">.ai</span></span>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-indigo text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs text-white/50">Signed in as</div>
            <div className="truncate text-sm font-medium text-white">{profile?.full_name ?? "…"}</div>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-black/5 bg-navy px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo text-white"><Sparkles className="h-3.5 w-3.5" /></div>
          <span className="text-base font-black text-white">CoFound<span className="text-indigo-light">.ai</span></span>
        </Link>
        <button onClick={signOut} className="text-xs text-white/70">Sign out</button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/10 bg-white md:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
          return (
            <Link key={n.to} to={n.to} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-indigo" : "text-muted-text"}`}>
              <n.icon className="h-5 w-5" />{n.label}
            </Link>
          );
        })}
      </nav>

      <main className="w-full md:pl-60 pt-14 pb-16 md:pt-0 md:pb-0">{children}</main>
    </div>
  );
}
