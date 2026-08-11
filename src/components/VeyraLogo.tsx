import { VEYRA_MARK_SRC } from "@/assets/veyra-mark";

// Veyra Found brand mark — inlined asset, paints on first frame (no network fetch, no flicker).
export function VeyraMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={VEYRA_MARK_SRC}
      alt="Veyra Found"
      width={size}
      height={size}
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      className={className}
      style={{ width: size, height: size, objectFit: "cover", display: "block" }}
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
