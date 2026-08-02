import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyFounder } from "@/hooks/useMyFounder";
import { getUnread, markUnread, subscribeUnread } from "@/lib/unread-store";

const EMPTY: string[] = [];

/** Reactive list of conversation ids with unseen messages. */
export function useUnreadConversations(): string[] {
  return useSyncExternalStore(
    subscribeUnread,
    getUnread,
    () => EMPTY,
  );
}

/**
 * One global realtime subscription for the signed-in founder:
 * keeps inbox requests / sent / conversations queries live, raises a
 * toast for incoming DMs, and tracks unread conversations.
 */
export function useLiveInbox() {
  const { data: me } = useMyFounder();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const myFounderId = me?.id;
  const myUserId = me?.user_id;

  useEffect(() => {
    if (!myFounderId) return;

    const channel = supabase
      .channel(`live-inbox-${myFounderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connection_requests" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["inbox-requests"] });
          qc.invalidateQueries({ queryKey: ["inbox-sent"] });
          const row = (payload.new ?? {}) as Record<string, unknown>;
          if (payload.eventType === "INSERT" && row["to_founder_id"] === myFounderId) {
            toast("New connection request", {
              description: "Someone just reached out — open your Inbox.",
            });
          }
          if (
            payload.eventType === "UPDATE" &&
            row["from_founder_id"] === myFounderId &&
            row["status"] === "accepted"
          ) {
            toast.success("Request accepted", { description: "Chat unlocked in Talking." });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          qc.invalidateQueries({ queryKey: ["inbox-convos"] });
          qc.invalidateQueries({ queryKey: ["connected-ids"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          const conversationId = String(row["conversation_id"] ?? "");
          const fromMe =
            (myUserId && row["sender_id"] === myUserId) ||
            row["seed_sender_founder_id"] === myFounderId;
          qc.invalidateQueries({ queryKey: ["inbox-convos"] });
          if (fromMe || !conversationId) return;
          const onThisChat = pathRef.current.includes(conversationId);
          if (!onThisChat) {
            markUnread(conversationId);
            toast("New message", {
              description: String(row["content"] ?? "").slice(0, 90) || "You have a new DM.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myFounderId, myUserId, qc]);
}
