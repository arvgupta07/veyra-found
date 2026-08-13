import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";
import { getSeenSnapshot } from "@/lib/nav-activity";

function sinceIso(section: string) {
  const at = getSeenSnapshot()[section];
  return new Date(at ?? 0).toISOString();
}

/**
 * Opportunities activity: new applications to the roles I posted, plus status
 * changes (shortlisted / rejected) on the applications I sent.
 */
export function useRolesAlert() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["nav-alert-roles", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const since = sinceIso("roles");
      let total = 0;

      const { data: mine } = await supabase.from("open_roles").select("id").eq("posted_by", user!.id);
      const ids = (mine ?? []).map((r) => r.id);
      if (ids.length > 0) {
        const { count } = await supabase.from("role_applications")
          .select("id", { count: "exact", head: true })
          .in("role_id", ids).gt("created_at", since);
        total += count ?? 0;
      }

      const { count: replies } = await supabase.from("role_applications")
        .select("id", { count: "exact", head: true })
        .eq("applicant_id", user!.id).neq("status", "pending").gt("updated_at", since);
      total += replies ?? 0;

      return total;
    },
  });
}

/** New connections since the inbox was last opened — i.e. someone accepted you. */
export function useNewConnectionsAlert(founderId?: string | null) {
  return useQuery({
    queryKey: ["nav-alert-connections", founderId],
    enabled: !!founderId,
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const since = sinceIso("inbox");
      const { count } = await supabase.from("conversations")
        .select("id", { count: "exact", head: true })
        .or(`founder_a_id.eq.${founderId},founder_b_id.eq.${founderId}`)
        .gt("created_at", since);
      return count ?? 0;
    },
  });
}

/** Pending requests waiting on me. */
export function usePendingRequestsAlert(founderId?: string | null) {
  return useQuery({
    queryKey: ["nav-alert-requests", founderId],
    enabled: !!founderId,
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { count } = await supabase.from("connection_requests")
        .select("id", { count: "exact", head: true })
        .eq("to_founder_id", founderId!).eq("status", "pending");
      return count ?? 0;
    },
  });
}
