import { useSyncExternalStore } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import {
  closeDockedChat, getDockMinimized, getDockSnapshot, subscribeDock, toggleDockMinimized,
} from "@/lib/chat-dock";

/**
 * Facebook-style docked chat window, bottom-right on desktop only.
 * The rest of the app stays navigable while a DM is open.
 */
export function ChatDock() {
  const conversationId = useSyncExternalStore(subscribeDock, getDockSnapshot, () => null);
  const minimized = useSyncExternalStore(subscribeDock, getDockMinimized, () => false);

  if (!conversationId) return null;

  if (minimized) {
    return (
      <button
        onClick={toggleDockMinimized}
        className="fixed bottom-4 right-4 z-50 hidden items-center gap-2 border-[3px] border-ink bg-orange px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal box-hover soft-corners md:flex"
      >
        <MessageSquare className="h-4 w-4" /> Open chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden h-[26rem] w-[22rem] animate-pop-in flex-col overflow-hidden border-[3px] border-ink bg-white shadow-brutal soft-corners md:flex">
      <ChatPanel
        conversationId={conversationId}
        variant="dock"
        onClose={closeDockedChat}
        onMinimize={toggleDockMinimized}
      />
    </div>
  );
}
