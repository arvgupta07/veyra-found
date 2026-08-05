import logoAsset from "@/assets/veyra-logo.png.asset.json";

// Veyra Found brand mark — official logo asset.
export function VeyraMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/favicon.png"
      alt="Veyra Found"
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
