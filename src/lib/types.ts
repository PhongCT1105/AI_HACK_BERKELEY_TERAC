export type SourceLabel = "source_a" | "source_b";
export type HumanPreference = SourceLabel | "both_similar" | "neither";
export type CiteDecision = "yes" | "no" | "caution";

export type RiskTag =
  | "no_clear_author"
  | "weak_citations"
  | "no_primary_source"
  | "promotional_language"
  | "affiliate_pressure"
  | "unsupported_price_prediction"
  | "sensational_claim"
  | "outdated_information"
  | "conflict_of_interest"
  | "unclear_evidence"
  | "looks_reliable"
  | "other";

export const RISK_TAGS: { value: RiskTag; label: string }[] = [
  { value: "no_clear_author", label: "No clear author" },
  { value: "weak_citations", label: "Weak citations" },
  { value: "no_primary_source", label: "No primary source" },
  { value: "promotional_language", label: "Promotional language" },
  { value: "affiliate_pressure", label: "Affiliate pressure" },
  { value: "unsupported_price_prediction", label: "Unsupported price prediction" },
  { value: "sensational_claim", label: "Sensational claim" },
  { value: "outdated_information", label: "Outdated information" },
  { value: "conflict_of_interest", label: "Conflict of interest" },
  { value: "unclear_evidence", label: "Unclear evidence" },
  { value: "looks_reliable", label: "Looks reliable" },
  { value: "other", label: "Other" },
];

export interface SourceFeatures {
  id: string;
  url: string;
  title: string | null;
  capsule: string | null;
  source_type: string | null;
  author_transparency: string | null;
  citation_quality: string | null;
  evidence_quality: string | null;
  commercial_pressure: string | null;
  risk_tags: string[];
  machine_score: number | null;
}

export interface SourcePair {
  id: string;
  research_task: string;
  source_a: SourceFeatures;
  source_b: SourceFeatures;
  machine_preferred_source: SourceLabel | null;
  machine_reason: string | null;
  created_at: string;
}

export interface Annotation {
  id: string;
  pair_id: string;
  human_preferred_source: HumanPreference;
  source_a_would_cite: CiteDecision;
  source_b_would_cite: CiteDecision;
  selected_risk_tags: RiskTag[];
  reason: string | null;
  annotator_session_id: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SubmitAnnotationBody {
  pair_id: string;
  human_preferred_source: HumanPreference;
  source_a_would_cite: CiteDecision;
  source_b_would_cite: CiteDecision;
  selected_risk_tags: RiskTag[];
  reason: string;
  annotator_session_id: string;
}

// Raw row shape stored in the `source_pairs` table (flat columns, prefixed a/b).
export interface SourcePairRow {
  id: string;
  research_task: string;
  source_a_id: string;
  source_a_url: string;
  source_a_title: string | null;
  source_a_capsule: string | null;
  source_a_source_type: string | null;
  source_a_author_transparency: string | null;
  source_a_citation_quality: string | null;
  source_a_evidence_quality: string | null;
  source_a_commercial_pressure: string | null;
  source_a_risk_tags: string[] | null;
  source_a_machine_score: number | null;
  source_b_id: string;
  source_b_url: string;
  source_b_title: string | null;
  source_b_capsule: string | null;
  source_b_source_type: string | null;
  source_b_author_transparency: string | null;
  source_b_citation_quality: string | null;
  source_b_evidence_quality: string | null;
  source_b_commercial_pressure: string | null;
  source_b_risk_tags: string[] | null;
  source_b_machine_score: number | null;
  machine_preferred_source: string | null;
  machine_reason: string | null;
  created_at: string;
}

export function rowToSourcePair(row: SourcePairRow): SourcePair {
  return {
    id: row.id,
    research_task: row.research_task,
    machine_preferred_source: (row.machine_preferred_source as SourceLabel | null) ?? null,
    machine_reason: row.machine_reason,
    created_at: row.created_at,
    source_a: {
      id: row.source_a_id,
      url: row.source_a_url,
      title: row.source_a_title,
      capsule: row.source_a_capsule,
      source_type: row.source_a_source_type,
      author_transparency: row.source_a_author_transparency,
      citation_quality: row.source_a_citation_quality,
      evidence_quality: row.source_a_evidence_quality,
      commercial_pressure: row.source_a_commercial_pressure,
      risk_tags: row.source_a_risk_tags ?? [],
      machine_score: row.source_a_machine_score,
    },
    source_b: {
      id: row.source_b_id,
      url: row.source_b_url,
      title: row.source_b_title,
      capsule: row.source_b_capsule,
      source_type: row.source_b_source_type,
      author_transparency: row.source_b_author_transparency,
      citation_quality: row.source_b_citation_quality,
      evidence_quality: row.source_b_evidence_quality,
      commercial_pressure: row.source_b_commercial_pressure,
      risk_tags: row.source_b_risk_tags ?? [],
      machine_score: row.source_b_machine_score,
    },
  };
}
