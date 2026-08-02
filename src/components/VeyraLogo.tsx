import logoAsset from "@/assets/veyra-logo.png.asset.json";

// Veyra brand mark — official logo asset (two figures forming a V).
export function VeyraMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Veyra"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      draggable={false}
    />
  );
}

export function VeyraWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <VeyraMark size={28} />
      <span className="text-xl font-black tracking-tight text-ink">Veyra Found</span>
    </span>
  );
}
