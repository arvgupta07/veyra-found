import { X } from "lucide-react";

/** Neo-brutalist building blocks shared by the Investors / Roles / Talent tabs. */

export function PageHeader({
  title, subtitle, action,
}: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-text">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Chip({
  active, onClick, children,
}: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
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

export function Pill({ tone = "bg-cream", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 border-2 border-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider soft-corners ${tone}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={`border-[3px] border-ink bg-white p-4 shadow-brutal box-hover soft-corners md:p-5 ${className}`}>
      {children}
    </article>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 border-[3px] border-dashed border-ink/50 p-10 text-center text-sm font-bold text-muted-text soft-corners">
      {children}
    </div>
  );
}

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-muted-text">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-text">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "mt-1 w-full border-2 border-ink bg-white px-3 py-2.5 text-sm font-medium outline-none soft-corners focus:shadow-brutal-sm";

export function Modal({
  title, onClose, children, footer, wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-3" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col animate-pop-in border-[3px] border-ink bg-surface shadow-brutal soft-corners ${wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-cream px-5 py-3">
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="border-2 border-ink bg-white p-1 soft-corners hover:bg-red hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t-[3px] border-ink bg-cream px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function TabBar<T extends string>({
  tabs, value, onChange,
}: { tabs: { v: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Chip key={t.v} active={value === t.v} onClick={() => onChange(t.v)}>
          {t.label}
          {t.count ? <span className="ml-1 opacity-70">({t.count})</span> : null}
        </Chip>
      ))}
    </div>
  );
}
