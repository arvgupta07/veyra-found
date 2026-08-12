import type { LucideIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";

/** Validates a real LinkedIn profile URL — required for every account type. */
export function isValidLinkedIn(url: string) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase() === "linkedin.com" && /\/in\/.+/.test(u.pathname);
  } catch {
    return false;
  }
}

/** Shared frame for the single-step investor / talent onboarding flows. */
export function OnboardShell({
  icon: Icon,
  kicker,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function cancel() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth/login" });
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b-[3px] border-ink bg-cream">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-white shadow-brutal-sm">
            <VeyraMark size={20} />
          </div>
          <span className="text-lg font-black">Veyra Found</span>
          <span className="ml-auto inline-flex items-center gap-1.5 border-2 border-ink bg-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-brutal-sm">
            <Icon className="h-3.5 w-3.5" /> {kicker}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 pb-28 animate-page-in">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 max-w-xl text-sm font-bold text-muted-text">{subtitle}</p>
        <div className="mt-6 border-[3px] border-ink bg-white p-5 shadow-brutal-sm sm:p-6">{children}</div>
      </main>

      <button
        onClick={cancel}
        className="fixed bottom-5 left-5 z-30 border-[3px] border-ink bg-white px-3 py-2 text-[11px] font-black uppercase shadow-brutal-sm box-hover"
      >
        Cancel sign-in
      </button>
    </div>
  );
}
