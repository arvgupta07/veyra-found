// Tiny external store for the desktop docked chat window (Facebook-style).
// Kept outside React so any route/component can open or close the dock.
let openId: string | null = null;
let minimized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeDock(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getDockSnapshot() {
  return openId;
}

export function getDockMinimized() {
  return minimized;
}

export function openDockedChat(id: string) {
  if (openId === id && !minimized) return;
  openId = id;
  minimized = false;
  emit();
}

export function closeDockedChat() {
  if (openId === null) return;
  openId = null;
  minimized = false;
  emit();
}

export function toggleDockMinimized() {
  minimized = !minimized;
  emit();
}

/** Desktop = docked chat window; mobile keeps the full-page conversation. */
export function isDockViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}
