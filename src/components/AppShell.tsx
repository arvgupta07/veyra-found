import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Compass, Inbox, MessagesSquare, User, LogOut, TrendingUp, Heart, Moon, Sun, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMyProfile } from "@/hooks/useMyFounder";
import { useSession } from "@/hooks/useSession";
import { useDarkMode } from "@/hooks/useDarkMode";
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
const investorNav = [
  { to: "/dashboard", label: "Dashboard", icon: TrendingUp },
  { to: "/investor-feed", label: "Deal Feed", icon: Compass },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useMyProfile();
  const { user } = useSession();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-nav", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role")
        .eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });
  const { dark, toggle } = useDarkMode();
  const baseNav = profile?.role === "investor" ? investorNav : founderNav;
  const nav = isAdmin ? [...baseNav, { to: "/admin", label: "Admin", icon: ShieldCheck }] : baseNav;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth/login" });
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r-[3px] border-ink bg-ink px-4 py-6 md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center border-[3px] border-cream bg-cream shadow-[3px_3px_0_0_var(--orange)]">
            <VeyraMark size={28} />
          </div>
          <span className="text-2xl font-black tracking-tight text-cream">Veyra Found</span>
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
          <button onClick={toggle} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
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
          <button onClick={signOut} className="border-2 border-cream bg-orange px-2 py-1 text-[10px] font-black uppercase text-white">Sign out</button>
        </div>
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
