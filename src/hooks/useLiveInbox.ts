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

    /** Conversation ids that belong to me, read from the inbox cache.
     * Used to ignore realtime traffic from other people's chats instead of
     * refetching the whole inbox on every message sent anywhere on Veyra. */
    function myConversationIds(): Set<string> | null {
      const entries = qc.getQueriesData({ queryKey: ["inbox-convos"] });
      const ids = new Set<string>();
      let found = false;
      for (const [, data] of entries) {
        if (!Array.isArray(data)) continue;
        found = true;
        for (const c of data as { id?: string }[]) if (c?.id) ids.add(c.id);
      }
      return found ? ids : null;
    }

    function mine(row: Record<string, unknown>) {
      return row["founder_a_id"] === myFounderId || row["founder_b_id"] === myFounderId;
    }

    function onRequest(payload: { eventType: string; new?: unknown; old?: unknown }) {
      const row = (payload.new ?? payload.old ?? {}) as Record<string, unknown>;
      if (row["to_founder_id"] !== myFounderId && row["from_founder_id"] !== myFounderId) return;
      qc.invalidateQueries({ queryKey: ["inbox-requests"] });
      qc.invalidateQueries({ queryKey: ["inbox-sent"] });
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
    }

    const channel = supabase
      .channel(`live-inbox-${myFounderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connection_requests" },
        (payload) => onRequest(payload as never),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          const row = (payload.new ?? payload.old ?? {}) as Record<string, unknown>;
          if (!mine(row)) return;
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
          const known = myConversationIds();
          if (known && conversationId && !known.has(conversationId)) return;
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

