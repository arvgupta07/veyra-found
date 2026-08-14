import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X, Search, RotateCcw } from "lucide-react";

/**
 * One shared filter surface for Discover / Talent / Opportunities / Investors.
 *
 * Instead of stacked chip rows fighting for space, everything lives behind a
 * single "Filters" button that slides a panel in from the right. What's active
 * stays visible as removable chips next to the button.
 */

export type FilterGroup = {
  key: string;
  label: string;
  /** "Any" is implied — do not include an all/any option. */
  options: { v: string; label: string }[];
};

export type FilterValues = Record<string, string>;

export function FilterBar({
  groups,
  values,
  onChange,
  resultCount,
  resultNoun = "results",
  search,
}: {
  groups: FilterGroup[];
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  resultCount: number;
  resultNoun?: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
}) {
  const [open, setOpen] = useState(false);

  const active = useMemo(
    () =>
      groups
        .map((g) => ({ g, v: values[g.key] }))
        .filter((x) => x.v && x.v !== "all")
        .map((x) => ({
          key: x.g.key,
          label: x.g.options.find((o) => o.v === x.v)?.label ?? x.v!,
          group: x.g.label,
        })),
    [groups, values],
  );

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  function set(key: string, v: string) {
    onChange({ ...values, [key]: v });
  }

  function clearAll() {
    const next: FilterValues = {};
    groups.forEach((g) => (next[g.key] = "all"));
    onChange(next);
    search?.onChange("");
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
            <input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="w-full border-2 border-ink bg-white py-2.5 pl-9 pr-3 text-sm font-medium outline-none soft-corners focus:shadow-brutal-sm"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 border-2 border-ink bg-ink px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cream shadow-brutal-sm box-hover soft-corners"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {active.length > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-orange text-[10px] text-ink">
              {active.length}
            </span>
          )}
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-muted-text">
          {resultCount} {resultNoun}
        </span>
      </div>

      {(active.length > 0 || (search?.value ?? "") !== "") && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {search?.value ? (
            <ActiveChip label={`“${search.value}”`} onRemove={() => search.onChange("")} />
          ) : null}
          {active.map((a) => (
            <ActiveChip key={a.key} label={a.label} onRemove={() => set(a.key, "all")} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-text underline"
          >
            <RotateCcw className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-sm animate-slide-in-right flex-col border-l-[3px] border-ink bg-surface shadow-brutal"
          >
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-cream px-5 py-3">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="border-2 border-ink bg-white p-1 soft-corners hover:bg-red hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {groups.map((g) => {
                const v = values[g.key] ?? "all";
                return (
                  <section key={g.key}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-text">{g.label}</h3>
                      {v !== "all" && (
                        <button
                          onClick={() => set(g.key, "all")}
                          className="text-[10px] font-black uppercase tracking-wider text-muted-text underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Opt active={v === "all"} onClick={() => set(g.key, "all")}>Any</Opt>
                      {g.options.map((o) => (
                        <Opt key={o.v} active={v === o.v} onClick={() => set(g.key, o.v)}>
                          {o.label}
                        </Opt>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t-[3px] border-ink bg-cream px-5 py-3">
              <button
                onClick={clearAll}
                className="border-2 border-ink bg-white px-3 py-2 text-xs font-black uppercase tracking-wider soft-corners box-hover"
              >
                Clear all
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border-2 border-ink bg-orange px-3 py-2 text-xs font-black uppercase tracking-wider text-white shadow-brutal-sm soft-corners box-hover"
              >
                Show {resultCount} {resultNoun}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 border-ink px-3 py-1.5 text-xs font-black uppercase tracking-wider transition soft-corners ${
        active ? "bg-ink text-cream shadow-brutal-sm" : "bg-white text-ink hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border-2 border-ink bg-cream px-2 py-1 text-[11px] font-black uppercase tracking-wider soft-corners">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="hover:text-red">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
