import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rowToSourcePair, SourcePairRow } from "@/lib/types";

// Optional future Browserbase-oriented source-pair API.
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: pairs, error: pairsError } = await supabase.from("source_pairs").select("*");
  if (pairsError) return NextResponse.json({ error: pairsError.message }, { status: 500 });
  if (!pairs?.length) {
    return NextResponse.json({ error: "No optional source pairs have been seeded." }, { status: 404 });
  }

  const { data: annotations, error: annotationsError } = await supabase.from("annotations").select("pair_id");
  if (annotationsError) return NextResponse.json({ error: annotationsError.message }, { status: 500 });

  const counts = new Map<string, number>();
  for (const annotation of annotations ?? []) {
    counts.set(annotation.pair_id, (counts.get(annotation.pair_id) ?? 0) + 1);
  }
  const leastCount = Math.min(...pairs.map((pair) => counts.get(pair.id) ?? 0));
  const candidates = (pairs as SourcePairRow[]).filter((pair) => (counts.get(pair.id) ?? 0) === leastCount);
  const pair = rowToSourcePair(candidates[Math.floor(Math.random() * candidates.length)]);

  return NextResponse.json({
    pair_id: pair.id,
    research_task: pair.research_task,
    source_a: { ...pair.source_a, machine_score: null },
    source_b: { ...pair.source_b, machine_score: null },
  });
}
