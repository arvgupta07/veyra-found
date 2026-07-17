import { useEffect, useState } from "react";

function armThemeTransition() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("theme-switching");
  window.setTimeout(() => root.classList.remove("theme-switching"), 400);
}

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(false);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("veyra-theme") : null;
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggle() {
    setDark((prev) => {
      const next = !prev;
      armThemeTransition();
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("veyra-theme", next ? "dark" : "light");
      return next;
    });
  }
  return { dark, toggle };
}
