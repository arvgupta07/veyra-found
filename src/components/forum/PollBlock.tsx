import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Poll attached to a forum post. One vote per founder, changeable by clicking a
 * different option and removable by clicking the current one again.
 */
export function PollBlock({
  postId,
  question,
  options,
  founderId,
}: {
  postId: string;
  question?: string | null;
  options: string[];
  founderId?: string | null;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["poll", postId],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("forum_poll_votes")
        .select("founder_id, option_index").eq("post_id", postId);
      if (error) throw new Error(error.message);
      return rows ?? [];
    },
  });

  const votes = data ?? [];
  const total = votes.length;
  const mine = founderId ? votes.find((v) => v.founder_id === founderId)?.option_index ?? null : null;

  async function cast(index: number) {
    if (!founderId) return toast.error("Sign in to vote");
    if (mine === index) {
      const { error } = await supabase.from("forum_poll_votes").delete()
        .eq("post_id", postId).eq("founder_id", founderId);
      if (error) return toast.error(error.message);
    } else if (mine === null) {
      const { error } = await supabase.from("forum_poll_votes")
        .insert({ post_id: postId, founder_id: founderId, option_index: index } as never);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("forum_poll_votes")
        .update({ option_index: index } as never)
        .eq("post_id", postId).eq("founder_id", founderId);
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["poll", postId] });
  }

  return (
    <div className="rounded-xl border-2 border-ink bg-cream p-4 shadow-brutal-sm">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange">
        <BarChart3 className="h-3.5 w-3.5" /> Poll
      </div>
      {question && <div className="mt-1 text-sm font-black text-ink">{question}</div>}
      <div className="mt-3 space-y-2">
        {options.map((opt, i) => {
          const count = votes.filter((v) => v.option_index === i).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const picked = mine === i;
          return (
            <button key={i} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cast(i); }}
              className={`relative w-full overflow-hidden rounded-lg border-2 border-ink px-3 py-2 text-left text-sm font-bold shadow-brutal-sm box-hover ${picked ? "bg-sage text-ink" : "bg-white text-ink"}`}>
              <span className="absolute inset-y-0 left-0 bg-orange/25 transition-[width] duration-300"
                style={{ width: `${pct}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-3">
                <span className="truncate">{opt}</span>
                <span className="shrink-0 text-xs font-black tabular-nums">{pct}% · {count}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-muted-text">
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        {total} {total === 1 ? "vote" : "votes"}
        {mine !== null && <span>· tap your choice again to undo</span>}
      </div>
    </div>
  );
}
