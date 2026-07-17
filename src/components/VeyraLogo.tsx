// Veyra brand mark: two overlapping V's forming a person-to-person connection.
export function VeyraMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <path d="M4 6 L20 34 L23 28 L11 6 Z" fill="#ACBFA4" stroke="#262626" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 6 L20 34 L17 28 L29 6 Z" fill="#FF7F11" stroke="#262626" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function VeyraWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <VeyraMark size={28} />
      <span className="text-xl font-black tracking-tight text-ink">veyra</span>
    </span>
  );
}
