import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import type { Annotation, SourcePairRow } from "@/lib/types";

function mode<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = -1;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
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

  const pairRows = (pairs ?? []) as SourcePairRow[];
  const annotationRows = (annotations ?? []) as Annotation[];

  const byPair = new Map<string, Annotation[]>();
  for (const annotation of annotationRows) {
    const list = byPair.get(annotation.pair_id) ?? [];
    list.push(annotation);
    byPair.set(annotation.pair_id, list);
  }

  const annotationsPerPair = pairRows.map((pair) => ({
    pair_id: pair.id,
    research_task: pair.research_task,
    count: byPair.get(pair.id)?.length ?? 0,
  }));

  const humanPreferenceDistribution = { source_a: 0, source_b: 0, both_similar: 0, neither: 0 };
  const citeADistribution = { yes: 0, no: 0, caution: 0 };
  const citeBDistribution = { yes: 0, no: 0, caution: 0 };

  for (const annotation of annotationRows) {
    humanPreferenceDistribution[annotation.human_preferred_source] += 1;
    citeADistribution[annotation.source_a_would_cite] += 1;
    citeBDistribution[annotation.source_b_would_cite] += 1;
  }

  const majorityLabels = pairRows.map((pair) => {
    const pairAnnotations = byPair.get(pair.id) ?? [];
    const majorityPreference = mode(pairAnnotations.map((a) => a.human_preferred_source));
    const machineAndHumanComparable =
      majorityPreference === "source_a" || majorityPreference === "source_b";
    const agreesWithMachine = machineAndHumanComparable
      ? majorityPreference === pair.machine_preferred_source
      : null;

    return {
      pair_id: pair.id,
      research_task: pair.research_task,
      annotation_count: pairAnnotations.length,
      majority_human_preference: majorityPreference,
      machine_preferred_source: pair.machine_preferred_source,
      machine_score_a: pair.source_a_machine_score,
      machine_score_b: pair.source_b_machine_score,
      agrees_with_machine: agreesWithMachine,
    };
  });

  const comparable = majorityLabels.filter((m) => m.agrees_with_machine !== null);
  const agreementCount = comparable.filter((m) => m.agrees_with_machine).length;
  const machineHumanAgreementPct =
    comparable.length > 0 ? Math.round((agreementCount / comparable.length) * 1000) / 10 : null;

  return NextResponse.json({
    total_pairs: pairRows.length,
    total_annotations: annotationRows.length,
    annotations_per_pair: annotationsPerPair,
    human_preference_distribution: humanPreferenceDistribution,
    cite_a_distribution: citeADistribution,
    cite_b_distribution: citeBDistribution,
    machine_human_agreement_pct: machineHumanAgreementPct,
    machine_human_agreement_sample_size: comparable.length,
    majority_labels: majorityLabels,
  });
}
