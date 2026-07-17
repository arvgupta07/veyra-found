// Veyra brand mark: two people (dot heads + rounded pill bodies) forming a V.
// Sage-green figure on the left, orange figure on the right — matches the brand guide.
export function VeyraMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="veyra-sage" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFD1B6" />
          <stop offset="100%" stopColor="#8FA687" />
        </linearGradient>
        <linearGradient id="veyra-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9A2E" />
          <stop offset="100%" stopColor="#FF3D1F" />
        </linearGradient>
      </defs>
      {/* Left (sage) figure — head + body pill angled to form left half of V */}
      <circle cx="34" cy="18" r="10" fill="url(#veyra-sage)" />
      <rect x="24" y="30" width="20" height="70" rx="10"
        fill="url(#veyra-sage)" transform="rotate(-28 34 65)" />
      {/* Right (orange) figure — head + body pill forming right half of V, overlapping in the middle */}
      <circle cx="86" cy="18" r="10" fill="url(#veyra-orange)" />
      <rect x="76" y="30" width="20" height="70" rx="10"
        fill="url(#veyra-orange)" transform="rotate(28 86 65)" />
    </svg>
  );
}

export function VeyraWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <VeyraMark size={28} />
      <span className="text-xl font-black tracking-tight text-ink lowercase">veyra</span>
    </span>
  );
}
