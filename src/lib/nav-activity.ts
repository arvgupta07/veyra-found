// Tracks the last time the user opened certain sections, so nav items can
// show an activity dot when something is new / stale.
const KEY = "veyra-last-seen";
const STALE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type Seen = Record<string, number>;

let loaded = false;
let seen: Seen = {};
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    seen = raw ? (JSON.parse(raw) as Seen) : {};
  } catch {
    seen = {};
  }
}

export function markSeen(section: string) {
  load();
  seen = { ...seen, [section]: Date.now() };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(seen));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

export function getSeenSnapshot(): Seen {
  load();
  return seen;
}

export function subscribeSeen(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** True when the section was never opened, or not opened in the last 3 days. */
export function isStale(section: string, snapshot: Seen) {
  const at = snapshot[section];
  if (!at) return true;
  return Date.now() - at > STALE_MS;
}
