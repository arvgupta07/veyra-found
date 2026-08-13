import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark, Rocket, GraduationCap, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VeyraMark } from "@/components/VeyraLogo";
import { PICKER_TYPES, setPendingAccountType, clearPendingAccountType, accountLabel, type AccountType } from "@/lib/account-types";

export const Route = createFileRoute("/auth/role")({
  component: RolePicker,
  head: () => ({
    meta: [
      { title: "Join as a founder, investor or talent — Veyra Found" },
      { name: "description", content: "Tell us who you are before you sign in: founder building a startup, investor backing them, or talent looking to join an early Indian startup." },
      { property: "og:title", content: "Join as a founder, investor or talent — Veyra Found" },
      { property: "og:description", content: "Pick your account type on Veyra Found — founder, investor, or talent/intern — and get an onboarding built for it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const ICONS: Record<AccountType, typeof Rocket> = {
  founder: Rocket,
  investor: Landmark,
  intern: GraduationCap,
  talent: Briefcase,
};


function RolePicker() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // An account type is chosen once and then frozen — signed-in members who
  // already have one never see this picker again.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) setChecking(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("account_type, account_type_locked_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data?.account_type_locked_at) {
        clearPendingAccountType();
        toast.info(`You're signed in as ${accountLabel(data.account_type)} — account type can't be changed.`);
        router.navigate({ to: "/dashboard" });
        return;
      }
      setChecking(false);
    })();
    return () => { alive = false; };
  }, [router]);

  function pick(t: AccountType) {
    setPendingAccountType(t);
    router.navigate({ to: "/auth/signup" });
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid" />
        <div className="animate-drift absolute left-[6%] top-[14%] h-24 w-24 bg-orange rotate-12 shadow-brutal-sm" />
        <div className="animate-drift-reverse absolute right-[8%] top-[22%] h-28 w-28 rounded-full border-[3px] border-ink/40" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center border-2 border-ink bg-cream shadow-brutal-sm">
              <VeyraMark size={20} />
            </div>
            <span className="text-lg font-black">Veyra Found</span>
          </Link>
          <Link to="/auth/login" className="text-xs font-black uppercase underline">Sign in</Link>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10 animate-page-in">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Who are you here as?</h1>
          <p className="mt-2 max-w-xl text-sm font-bold text-muted-text">
            This shapes your onboarding and what you see. You can't switch later without asking us, so pick the one that fits.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PICKER_TYPES.map((a) => {
              const Icon = ICONS[a.value];
              return (
                <button
                  key={a.value}
                  onClick={() => pick(a.value)}
                  className="group flex flex-col items-start gap-3 border-[3px] border-ink bg-cream p-5 text-left shadow-brutal-sm transition hover:-translate-y-1 hover:shadow-brutal"
                >
                  <span className={`grid h-11 w-11 place-items-center border-[3px] border-ink shadow-brutal-sm ${a.badge}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-black uppercase">{a.label}</span>
                  <span className="text-sm font-bold text-ink/80">{a.blurb}</span>
                  <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-black uppercase">
                    Continue <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </div>


          <p className="mt-8 text-xs font-bold text-muted-text">
            Already have an account? <Link to="/auth/login" className="underline">Sign in instead</Link>.
          </p>
        </main>
      </div>
    </div>
  );
}
