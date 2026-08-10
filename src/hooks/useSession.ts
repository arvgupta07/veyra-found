import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single shared session store.
 *
 * Every screen used to call supabase.auth.getSession() on mount, which meant
 * each tab switch blanked the page until that async call resolved. Now the
 * session is fetched once, cached in module scope, and shared instantly with
 * every component that needs it.
 */
type SessionState = { session: Session | null; loading: boolean };

let state: SessionState = { session: null, loading: true };
const listeners = new Set<() => void>();
let started = false;

const SERVER_STATE: SessionState = { session: null, loading: true };

function emit() {
  for (const l of listeners) l();
}

function setState(next: SessionState) {
  if (next.session === state.session && next.loading === state.loading) return;
  state = next;
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.getSession().then(({ data }) => {
    setState({ session: data.session ?? null, loading: false });
  });
  supabase.auth.onAuthStateChange((_e, s) => {
    setState({ session: s ?? null, loading: false });
  });
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSession() {
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
  return { session: snap.session, loading: snap.loading, user: snap.session?.user ?? null };
}
