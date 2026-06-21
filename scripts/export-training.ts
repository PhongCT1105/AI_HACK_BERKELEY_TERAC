// Standalone CSV export, equivalent to GET /api/export, for when you'd rather
// run a script than hit the deployed API. Requires the same env vars as the
// app (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
//
// Usage: cd frontend && npx tsx scripts/export-training.ts > export.csv

import { createClient } from "@supabase/supabase-js";

const CSV_COLUMNS = [
  "pair_id",
  "research_task",
  "source_a_id",
  "source_b_id",
  "source_a_url",
  "source_b_url",
  "source_a_title",
  "source_b_title",
  "source_a_capsule",
  "source_b_capsule",
  "source_a_features_json",
  "source_b_features_json",
  "machine_preferred_source",
  "machine_score_a",
  "machine_score_b",
  "human_preferred_source",
  "source_a_would_cite",
  "source_b_would_cite",
  "selected_risk_tags",
  "reason",
  "created_at",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const [{ data: pairs, error: pairsError }, { data: annotations, error: annotationsError }] =
    await Promise.all([
      supabase.from("source_pairs").select("*"),
      supabase.from("annotations").select("*"),
    ]);

  if (pairsError || annotationsError) {
    console.error(pairsError?.message ?? annotationsError?.message);
    process.exit(1);
  }

  const pairById = new Map((pairs ?? []).map((p) => [p.id, p]));

  const rows = (annotations ?? [])
    .map((annotation) => {
      const pair = pairById.get(annotation.pair_id);
      if (!pair) return null;

      const featuresA = {
        source_type: pair.source_a_source_type,
        author_transparency: pair.source_a_author_transparency,
        citation_quality: pair.source_a_citation_quality,
        evidence_quality: pair.source_a_evidence_quality,
        commercial_pressure: pair.source_a_commercial_pressure,
        risk_tags: pair.source_a_risk_tags ?? [],
      };
      const featuresB = {
        source_type: pair.source_b_source_type,
        author_transparency: pair.source_b_author_transparency,
        citation_quality: pair.source_b_citation_quality,
        evidence_quality: pair.source_b_evidence_quality,
        commercial_pressure: pair.source_b_commercial_pressure,
        risk_tags: pair.source_b_risk_tags ?? [],
      };

      const record: Record<(typeof CSV_COLUMNS)[number], unknown> = {
        pair_id: pair.id,
        research_task: pair.research_task,
        source_a_id: pair.source_a_id,
        source_b_id: pair.source_b_id,
        source_a_url: pair.source_a_url,
        source_b_url: pair.source_b_url,
        source_a_title: pair.source_a_title,
        source_b_title: pair.source_b_title,
        source_a_capsule: pair.source_a_capsule,
        source_b_capsule: pair.source_b_capsule,
        source_a_features_json: JSON.stringify(featuresA),
        source_b_features_json: JSON.stringify(featuresB),
        machine_preferred_source: pair.machine_preferred_source,
        machine_score_a: pair.source_a_machine_score,
        machine_score_b: pair.source_b_machine_score,
        human_preferred_source: annotation.human_preferred_source,
        source_a_would_cite: annotation.source_a_would_cite,
        source_b_would_cite: annotation.source_b_would_cite,
        selected_risk_tags: JSON.stringify(annotation.selected_risk_tags ?? []),
        reason: annotation.reason,
        created_at: annotation.created_at,
      };
      return record;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const lines = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((col) => csvEscape(row[col])).join(",")),
  ];

  console.log(lines.join("\n"));
}

main();
