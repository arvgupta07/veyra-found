import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { suggestLocations } from "@/lib/india-locations";

/**
 * Location field with type-ahead suggestions (Indian cities first).
 * Click or press Enter on a suggestion to fill it in.
 */
export function LocationInput({
  value,
  onChange,
  placeholder = "Start typing a city…",
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => suggestLocations(value), [value]);
  const exact = options.length === 1 && options[0].toLowerCase() === value.trim().toLowerCase();
  const show = open && options.length > 0 && !exact;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setActive(0);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % options.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + options.length) % options.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(options[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={
            className ??
            "w-full rounded-lg border-2 border-ink bg-white py-2.5 pl-9 pr-3 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-orange"
          }
        />
      </div>

      {show && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border-2 border-ink bg-white shadow-brutal-sm"
        >
          {options.map((opt, i) => (
            <li key={opt}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(opt)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold ${
                  i === active ? "bg-orange text-white" : "text-ink hover:bg-cream"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
