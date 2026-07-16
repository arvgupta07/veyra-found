import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/useSession";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";

/** Client-side gate: redirects unauthenticated users to /auth/login,
 * and non-onboarded founders to /onboarding. */
export function useRequireAuth(opts: { requireOnboarded?: boolean } = {}) {
  const router = useRouter();
  const { loading, session } = useSession();
  const { data: profile, isLoading: pLoading } = useMyProfile();
  const { data: founder, isLoading: fLoading } = useMyFounder();

  useEffect(() => {
    if (loading) return;
    if (!session) { router.navigate({ to: "/auth/login" }); return; }
    if (pLoading || fLoading) return;
    if (profile?.role === "investor") {
      if (!window.location.pathname.startsWith("/dashboard") && !window.location.pathname.startsWith("/investor-feed")) {
        router.navigate({ to: "/investor-feed" });
      }
      return;
    }
    if (opts.requireOnboarded && (!founder || !founder.profile_complete)) {
      router.navigate({ to: "/onboarding" });
    }
  }, [loading, session, profile, founder, pLoading, fLoading, opts.requireOnboarded, router]);

  return { session, profile, founder, ready: !loading && !pLoading && !fLoading && !!session };
}
