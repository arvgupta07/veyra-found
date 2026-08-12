import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import {
  closeDockedChat, getDockMinimized, getDockSnapshot, subscribeDock, toggleDockMinimized,
} from "@/lib/chat-dock";

const MIN_W = 280;
const MIN_H = 260;
const MAX_W = 720;
const MAX_H = 900;
const STORAGE_KEY = "veyra-dock-size";

function loadSize() {
  if (typeof window === "undefined") return { w: 352, h: 416 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { w: number; h: number };
      if (typeof p.w === "number" && typeof p.h === "number") return p;
    }
  } catch { /* ignore */ }
  return { w: 352, h: 416 };
}

/**
 * Facebook-style docked chat window, bottom-right on desktop only.
 * Resizable from its top-left corner (and top / left edges); size persists.
 */
export function ChatDock() {
  const conversationId = useSyncExternalStore(subscribeDock, getDockSnapshot, () => null);
  const minimized = useSyncExternalStore(subscribeDock, getDockMinimized, () => false);
  const [size, setSize] = useState({ w: 352, h: 416 });
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ x: number; y: number; w: number; h: number; axis: "both" | "x" | "y" } | null>(null);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => { setSize(loadSize()); }, []);

  useEffect(() => {
    if (!resizing) return;
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;
      // Dock is anchored bottom-right, so dragging up/left grows it.
      const nextW = d.axis === "y" ? d.w : Math.min(MAX_W, Math.max(MIN_W, d.w + (d.x - e.clientX)));
      const nextH = d.axis === "x" ? d.h : Math.min(MAX_H, Math.max(MIN_H, d.h + (d.y - e.clientY)));
      setSize({ w: nextW, h: nextH });
    }
    function onUp() {
      setResizing(false);
      dragRef.current = null;
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sizeRef.current)); } catch { /* ignore */ }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // Listeners are attached once per drag; the live size is read from a ref so
    // the handlers aren't torn down and re-added on every mouse move.
  }, [resizing]);

  function startResize(axis: "both" | "x" | "y") {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, axis };
      setResizing(true);
    };
  }


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
    <div
      style={{ width: size.w, height: size.h }}
      className={`fixed bottom-4 right-4 z-50 hidden flex-col overflow-hidden border-[3px] border-ink bg-white shadow-brutal soft-corners md:flex ${resizing ? "select-none" : "animate-pop-in"}`}
    >
      {/* Resize handles: top-left corner + top and left edges */}
      <div onMouseDown={startResize("both")} title="Drag to resize"
        className="absolute left-0 top-0 z-20 h-4 w-4 cursor-nwse-resize bg-orange/70" />
      <div onMouseDown={startResize("y")} className="absolute left-4 right-0 top-0 z-10 h-1.5 cursor-ns-resize" />
      <div onMouseDown={startResize("x")} className="absolute bottom-0 left-0 top-4 z-10 w-1.5 cursor-ew-resize" />

      <ChatPanel
        conversationId={conversationId}
        variant="dock"
        onClose={closeDockedChat}
        onMinimize={toggleDockMinimized}
      />
    </div>
  );
}
