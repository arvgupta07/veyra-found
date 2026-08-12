import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";
import { useMyProfile } from "./useMyFounder";
import { getPendingAccountType, isAccountType, type AccountType } from "@/lib/account-types";

/** The signed-in member's account type (founder / investor / intern / talent). */
export function useAccountType(): { accountType: AccountType; loaded: boolean } {
  const { data: profile, isFetched } = useMyProfile();
  const fromProfile = (profile as { account_type?: string } | null | undefined)?.account_type;
  const t = isAccountType(fromProfile) ? fromProfile : null;
  return { accountType: t ?? getPendingAccountType() ?? "founder", loaded: isFetched };
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
