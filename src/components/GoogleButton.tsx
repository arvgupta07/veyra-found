import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });

    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return; // browser is redirecting to Google

    // Popup flow: session is set — confirm it, then route by onboarding state.
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      toast.error("Signed in but no session was created. Please try again.");
      return;
    }
    const { data: founder } = await supabase
      .from("founders")
      .select("profile_complete")
      .eq("user_id", u.user.id)
      .maybeSingle();
    router.navigate({ to: founder?.profile_complete ? "/discover" : "/onboarding" });
  }



  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 border-[3px] border-ink bg-white py-3 text-sm font-black uppercase text-ink shadow-brutal-sm box-hover disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.2 30.2 0 24 0 14.6 0 6.4 5.4 2.4 13.3l7.8 6c1.9-5.7 7.3-9.8 13.8-9.8z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-9.9 7.1-17.3z"/><path fill="#FBBC05" d="M10.2 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.5 0 20.2 0 24s.9 7.5 2.4 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.2 15.9-5.9l-7.5-5.8c-2.1 1.4-4.7 2.2-8.4 2.2-6.5 0-12-4.1-13.8-9.8l-7.8 6C6.4 42.6 14.6 48 24 48z"/></svg>
      )}
      {label}
    </button>
  );
}
