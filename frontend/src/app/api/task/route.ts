import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rowToSourcePair, SourcePairRow } from "@/lib/types";

// Returns one source pair for annotation, preferring pairs with fewer
// existing annotations so coverage stays balanced across the dataset.
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: pairs, error: pairsError } = await supabase
    .from("source_pairs")
    .select("*");

  if (pairsError) {
    return NextResponse.json({ error: pairsError.message }, { status: 500 });
  }
  if (!pairs || pairs.length === 0) {
    return NextResponse.json(
      { error: "No source pairs available. Seed the database from /admin/seed." },
      { status: 404 }
    );
  }

  const { data: annotations, error: annotationsError } = await supabase
    .from("annotations")
    .select("pair_id");

  if (annotationsError) {
    return NextResponse.json({ error: annotationsError.message }, { status: 500 });
  }

  const countByPair = new Map<string, number>();
  for (const row of annotations ?? []) {
    countByPair.set(row.pair_id, (countByPair.get(row.pair_id) ?? 0) + 1);
  }

  const sorted = [...(pairs as SourcePairRow[])].sort(
    (a, b) => (countByPair.get(a.id) ?? 0) - (countByPair.get(b.id) ?? 0)
  );

  const leastAnnotated = countByPair.get(sorted[0].id) ?? 0;
  const candidates = sorted.filter(
    (row) => (countByPair.get(row.id) ?? 0) === leastAnnotated
  );
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  const pair = rowToSourcePair(chosen);

  // Annotators must not see the machine's preference or score — keep them blind.
  const { machine_preferred_source, machine_reason, ...blindPair } = pair;
  void machine_preferred_source;
  void machine_reason;
  const blindSourceA = { ...blindPair.source_a, machine_score: null };
  const blindSourceB = { ...blindPair.source_b, machine_score: null };

  return NextResponse.json({
    pair_id: blindPair.id,
    research_task: blindPair.research_task,
    source_a: blindSourceA,
    source_b: blindSourceB,
  });
}
