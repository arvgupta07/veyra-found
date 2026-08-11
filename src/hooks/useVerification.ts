import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "./useMyFounder";

export type VerificationRequest = {
  id: string;
  founder_id: string;
  linkedin_url: string;
  affiliation: string | null;
  note: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

/** Founder verification state: whether the founder is verified, and their
 * latest verification request (if any). Verified founders can send connection
 * requests and messages; everyone can still browse and use the forum. */
export function useMyVerification() {
  const { data: me, isFetched } = useMyFounder();
  const founderId = me?.id ?? null;

  const req = useQuery({
    queryKey: ["my-verification", founderId],
    enabled: !!founderId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("founder_id", founderId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as VerificationRequest | null) ?? null;
    },
  });

  const verified = !!(me as { verified?: boolean } | null)?.verified;
  const request = req.data ?? null;

  return {
    founderId,
    verified,
    request,
    status: verified ? ("approved" as const) : request?.status ?? null,
    /** true once we know enough to render a gate without flicker */
    ready: isFetched && (!founderId || req.isFetched),
    refetch: req.refetch,
  };
}
