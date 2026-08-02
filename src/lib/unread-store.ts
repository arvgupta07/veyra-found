// Tiny cross-component store for unread DM conversation ids.
const KEY = "veyra-unread";

let loaded = false;
let ids: string[] = [];
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    ids = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    ids = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function markUnread(conversationId: string) {
  load();
  if (ids.includes(conversationId)) return;
  ids = [...ids, conversationId];
  persist();
}

export function clearUnread(conversationId: string) {
  load();
  if (!ids.includes(conversationId)) return;
  ids = ids.filter((i) => i !== conversationId);
  persist();
}

export function getUnread(): string[] {
  load();
  return ids;
}

export function subscribeUnread(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
