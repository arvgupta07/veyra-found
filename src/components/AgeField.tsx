import { Minus, Plus } from "lucide-react";

/**
 * Smooth age picker: draggable slider plus -/+ steppers.
 * Replaces the fiddly number spinner.
 */
export function AgeField({
  value,
  onChange,
  min = 16,
  max = 70,
  label = "Age",
  required,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  required?: boolean;
}) {
  const v = Math.min(max, Math.max(min, value || min));
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[11px] font-black uppercase tracking-wide text-muted-text">
          {label} {required && <span className="text-red">*</span>}
        </label>
        <span className="text-sm font-black tabular-nums">{v}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease age"
          onClick={() => set(v - 1)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white shadow-brutal-sm box-hover"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={v}
          aria-label={label}
          onChange={(e) => set(+e.target.value)}
          className="age-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full border-2 border-ink bg-cream"
        />
        <button
          type="button"
          aria-label="Increase age"
          onClick={() => set(v + 1)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white shadow-brutal-sm box-hover"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
