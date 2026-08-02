import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
  head: () => ({
    meta: [
      { title: "Signing you in · Veyra" },
      { name: "description", content: "Completing your Veyra sign-in." },
      { property: "og:title", content: "Signing you in · Veyra" },
      { property: "og:description", content: "Completing your Veyra sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Callback() {
  const router = useRouter();

  useEffect(() => {
    let done = false;
    const go = (to: string) => {
      if (done) return;
      done = true;
      router.navigate({ to });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go("/discover");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go("/discover");
    });

    const t = setTimeout(() => go("/auth/login"), 6000);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <div className="flex items-center gap-3 border-[3px] border-ink bg-white px-6 py-4 font-black uppercase shadow-brutal-sm">
        <Loader2 className="h-5 w-5 animate-spin" /> Signing you in…
      </div>
    </div>
  );
}
