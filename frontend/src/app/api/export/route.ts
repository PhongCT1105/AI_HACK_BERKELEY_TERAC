import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import type { Annotation, SourcePairRow } from "@/lib/types";

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
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [{ data: pairs, error: pairsError }, { data: annotations, error: annotationsError }] =
    await Promise.all([
      supabase.from("source_pairs").select("*"),
      supabase.from("annotations").select("*"),
    ]);

  if (pairsError) return NextResponse.json({ error: pairsError.message }, { status: 500 });
  if (annotationsError)
    return NextResponse.json({ error: annotationsError.message }, { status: 500 });

  const pairById = new Map((pairs as SourcePairRow[]).map((p) => [p.id, p]));

  const rows = (annotations as Annotation[]).map((annotation) => {
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
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const lines = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((col) => csvEscape(row[col])).join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sourceguard-export-${Date.now()}.csv"`,
    },
  });
}
