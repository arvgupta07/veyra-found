import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChatPanel } from "@/components/ChatPanel";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { isDockViewport, openDockedChat } from "@/lib/chat-dock";

export const Route = createFileRoute("/inbox/$conversationId")({
  component: ConversationView,
});

function ConversationView() {
  const { conversationId } = useParams({ from: "/inbox/$conversationId" });
  const { ready } = useRequireAuth({ requireOnboarded: true });
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(() => isDockViewport());

  // Desktop: open the chat as a docked window and hand the page back to the inbox
  // so the user can keep navigating. Mobile keeps the full-screen conversation.
  useEffect(() => {
    if (!isDockViewport()) {
      setRedirecting(false);
      return;
    }
    setRedirecting(true);
    openDockedChat(conversationId);
    router.navigate({ to: "/inbox", replace: true });
  }, [conversationId, router]);

  if (!ready || redirecting) return null;

  return (
    <AppShell>
      <ChatPanel conversationId={conversationId} variant="page" />
    </AppShell>
  );
}
