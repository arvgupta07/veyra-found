import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";
import { useMyProfile } from "./useMyFounder";
import { getPendingAccountType, isAccountType, type AccountType } from "@/lib/account-types";

/**
 * The signed-in member's account type (founder / investor / intern / talent).
 *
 * Once the type has been locked (stamped the first time it was saved at sign-up)
 * it is authoritative and can never be overridden by a locally picked role.
 */
export function useAccountType(): { accountType: AccountType; loaded: boolean; locked: boolean } {
  const { data: profile, isFetched } = useMyProfile();
  const p = profile as { account_type?: string; account_type_locked_at?: string | null } | null | undefined;
  const t = isAccountType(p?.account_type) ? (p!.account_type as AccountType) : null;
  const locked = !!p?.account_type_locked_at;
  const accountType = locked ? (t ?? "founder") : (getPendingAccountType() ?? t ?? "founder");
  return { accountType, loaded: isFetched, locked };
}


/** Investor firm profile for the signed-in user, if any. */
export function useMyInvestor() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["me-investor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("investor_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });
}

/** Talent profile for the signed-in user, if any. */
export function useMyTalent() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["me-talent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });
}
