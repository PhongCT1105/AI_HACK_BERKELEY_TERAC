// Deterministic machine baseline used to pre-score seeded source pairs.
// This is intentionally simple — it's the "base model" that human Terac
// labels get compared against in /admin/eval.

export interface ScoringInput {
  source_type: string;
  author_transparency: "clear" | "unclear" | "missing";
  citation_quality: "strong" | "weak" | "none";
  evidence_quality: "strong" | "weak" | "none";
  commercial_pressure: "none" | "promotional" | "affiliate";
  risk_tags: string[];
}

const TRUSTED_SOURCE_TYPES = new Set([
  "official_company",
  "sec_filing",
  "government",
  "reputable_financial_news",
]);

export function scoreSource(input: ScoringInput): number {
  let score = 50;

  if (TRUSTED_SOURCE_TYPES.has(input.source_type)) score += 25;
  if (input.author_transparency === "clear") score += 15;
  if (input.citation_quality === "strong") score += 15;
  if (input.evidence_quality === "strong") score += 15;

  if (input.commercial_pressure === "promotional") score -= 20;
  if (input.risk_tags.includes("unsupported_price_prediction")) score -= 25;
  if (input.commercial_pressure === "affiliate") score -= 15;
  if (input.author_transparency === "missing") score -= 15;
  if (input.citation_quality === "weak") score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function preferredSource(scoreA: number, scoreB: number): "source_a" | "source_b" {
  return scoreA >= scoreB ? "source_a" : "source_b";
}
