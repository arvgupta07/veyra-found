import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Founder ids the current founder is already connected with (accepted → conversation exists). */
export function useConnectedIds(myFounderId?: string) {
  const { data } = useQuery({
    queryKey: ["connected-ids", myFounderId],
    enabled: !!myFounderId,
    queryFn: async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("founder_a_id, founder_b_id")
        .or(`founder_a_id.eq.${myFounderId},founder_b_id.eq.${myFounderId}`);
      const ids = new Set<string>();
      for (const c of convos ?? []) {
        if (c.founder_a_id && c.founder_a_id !== myFounderId) ids.add(c.founder_a_id);
        if (c.founder_b_id && c.founder_b_id !== myFounderId) ids.add(c.founder_b_id);
      }
      return ids;
    },
  });
  return data ?? new Set<string>();
}
