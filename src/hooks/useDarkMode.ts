import { useEffect, useSyncExternalStore } from "react";

const KEY = "veyra-theme";
const listeners = new Set<() => void>();
let dark = false;

function emit() {
  listeners.forEach((l) => l());
}

function applyTheme(next: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", next);
}

function armThemeTransition() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("theme-switching");
  window.setTimeout(() => root.classList.remove("theme-switching"), 400);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Shared dark-mode store: one source of truth for every toggle in the UI. */
export function useDarkMode() {
  const value = useSyncExternalStore(
    subscribe,
    () => dark,
    () => false,
  );

  // Hydrate once from localStorage on the client.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY);
    const isDark = stored === "dark";
    if (isDark !== dark) {
      dark = isDark;
      emit();
    }
    applyTheme(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    dark = next;
    armThemeTransition();
    applyTheme(next);
    try {
      window.localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    emit();
  }

  return { dark: value, toggle };
}
