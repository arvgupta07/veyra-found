import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/hooks/useSession";
import { useMyFounder, useMyProfile } from "@/hooks/useMyFounder";

/** Client-side gate: redirects unauthenticated users to /auth/login,
 * and non-onboarded founders to /onboarding. */
export function useRequireAuth(opts: { requireOnboarded?: boolean } = {}) {
  const router = useRouter();
  const { loading, session } = useSession();
  const { data: profile } = useMyProfile();
  const { data: founder, isPending: fPending, isFetched: fFetched } = useMyFounder();

  useEffect(() => {
    if (loading) return;
    if (!session) { router.navigate({ to: "/auth/login" }); return; }
    if (!fFetched) return;
    if (opts.requireOnboarded && (!founder || !founder.profile_complete)) {
      router.navigate({ to: "/onboarding" });
    }
  }, [loading, session, founder, fFetched, opts.requireOnboarded, router]);

  // Ready as soon as we know there's a session and the founder row is either
  // cached or fetched — cached data makes tab switches render instantly.
  const ready = !loading && !!session && (!fPending || fFetched);

  return { session, profile, founder, ready };
}
