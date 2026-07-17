// Client-side compatibility scoring — compares two founders' assessment rows.
// Higher score means more compatible on the 9 personality dimensions.

const DIMS = [
  "openness_score",
  "conscientiousness_score",
  "extraversion_score",
  "agreeableness_score",
  "neuroticism_score",
  "risk_score",
  "decision_velocity_score",
  "equity_philosophy_score",
  "vision_score",
] as const;

// For most dimensions similarity is best; for risk/velocity/vision alignment matters too.
// Simple model: 100 - mean absolute difference across dimensions (0..100).
export function scoreCompatibility(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): number {
  if (!a || !b) return 50;
  let sum = 0;
  let n = 0;
  for (const d of DIMS) {
    const av = Number((a as Record<string, unknown>)[d]);
    const bv = Number((b as Record<string, unknown>)[d]);
    if (Number.isFinite(av) && Number.isFinite(bv)) {
      sum += Math.abs(av - bv);
      n++;
    }
  }
  if (n === 0) return 50;
  const mad = sum / n; // 0..100
  return Math.round(Math.max(0, Math.min(100, 100 - mad)));
}

export function bandLabel(score: number): { label: string; cls: string } {
  if (score >= 85) return { label: "Exceptional", cls: "bg-orange text-white" };
  if (score >= 70) return { label: "Strong", cls: "bg-sage text-ink" };
  if (score >= 55) return { label: "Worth exploring", cls: "bg-cream text-ink" };
  return { label: "Low match", cls: "bg-white text-ink" };
}
