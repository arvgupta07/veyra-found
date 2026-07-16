import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";
import type { Founder } from "@/lib/founder-types";

export function useMyProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
}

export function useMyFounder() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["me-founder", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("founders").select("*").eq("user_id", user!.id).maybeSingle();
      return data as Founder | null;
    },
  });
}
