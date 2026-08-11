// Remembers where the user was in the Discover feed so navigating away and
// back does not reset them to the first profile.
let index = 0;
let skipped = 0;

export function getDiscoverCursor() {
  return { index, skipped };
}

export function setDiscoverCursor(next: { index: number; skipped: number }) {
  index = next.index;
  skipped = next.skipped;
}
