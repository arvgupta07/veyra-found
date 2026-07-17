import { useEffect, useState } from "react";

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
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("veyra-theme", next ? "dark" : "light");
      return next;
    });
  }
  return { dark, toggle };
}
