import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
  head: () => ({
    meta: [
      { title: "Signing you in · Veyra Found" },
      { name: "description", content: "Completing your Veyra Found sign-in." },
      { property: "og:title", content: "Signing you in · Veyra Found" },
      { property: "og:description", content: "Completing your Veyra Found sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const go = async () => {
      if (done) return;
      done = true;
      // Send onboarded users to the feed, new users to onboarding.
      const { data: u } = await supabase.auth.getUser();
      let to = "/onboarding";
      if (u.user) {
        const { data: founder } = await supabase
          .from("founders")
          .select("profile_complete")
          .eq("user_id", u.user.id)
          .maybeSingle();
        if (founder?.profile_complete) to = "/discover";
      }
      router.navigate({ to });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) void go();
    });

    (async () => {
      // 1) Already have a session (popup flow set it, or storage was warm).
      const { data } = await supabase.auth.getSession();
      if (data.session) return void go();

      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      // 2) Implicit flow: tokens in the URL hash.
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) return setError(error.message);
        return void go();
      }

      // 3) PKCE flow: ?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setError(error.message);
        return void go();
      }

      const providerError =
        hash.get("error_description") || url.searchParams.get("error_description");
      if (providerError) setError(providerError);
    })();

    const t = setTimeout(() => {
      if (!done) setError("Sign-in took too long. Please try again.");
    }, 10000);

    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6">
        <div className="max-w-sm border-[3px] border-ink bg-white p-6 shadow-brutal-sm">
          <h1 className="text-lg font-black uppercase">Sign-in failed</h1>
          <p className="mt-2 text-sm font-bold text-muted-text">{error}</p>
          <button
            onClick={() => router.navigate({ to: "/auth/login" })}
            className="mt-4 w-full border-[3px] border-ink bg-orange py-3 text-sm font-black uppercase shadow-brutal-sm box-hover"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <div className="flex items-center gap-3 border-[3px] border-ink bg-white px-6 py-4 font-black uppercase shadow-brutal-sm">
        <Loader2 className="h-5 w-5 animate-spin" /> Signing you in…
      </div>
    </div>
  );
}
