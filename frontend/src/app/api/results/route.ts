import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type ClaimTask = { task_id: string; claim: string; research_task: string };
type ClaimAnnotation = {
  task_id: string;
  human_verdict: "supported" | "questionable" | "unsupported" | "insufficient_info";
  would_ai_cite: "yes" | "no" | "caution";
};

function mode<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].reduce((best, entry) =>
    entry[1] > best[1] ? entry : best
  )[0];
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const [{ data: tasks, error: tasksError }, { data: annotations, error: annotationsError }] =
    await Promise.all([
      supabase.from("source_claim_tasks").select("task_id, claim, research_task"),
      supabase.from("claim_annotations").select("task_id, human_verdict, would_ai_cite"),
    ]);

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });
  if (annotationsError) return NextResponse.json({ error: annotationsError.message }, { status: 500 });

  const taskRows = (tasks ?? []) as ClaimTask[];
  const annotationRows = (annotations ?? []) as ClaimAnnotation[];
  const byTask = new Map<string, ClaimAnnotation[]>();
  for (const annotation of annotationRows) {
    const rows = byTask.get(annotation.task_id) ?? [];
    rows.push(annotation);
    byTask.set(annotation.task_id, rows);
  }

  const verdictDistribution = { supported: 0, questionable: 0, unsupported: 0, insufficient_info: 0 };
  const citeDistribution = { yes: 0, no: 0, caution: 0 };
  for (const annotation of annotationRows) {
    verdictDistribution[annotation.human_verdict] += 1;
    citeDistribution[annotation.would_ai_cite] += 1;
  }

  const annotationsPerTask = taskRows.map((task) => ({
    task_id: task.task_id,
    claim: task.claim,
    count: byTask.get(task.task_id)?.length ?? 0,
  }));
  const majorityLabels = taskRows.map((task) => {
    const taskAnnotations = byTask.get(task.task_id) ?? [];
    return {
      task_id: task.task_id,
      claim: task.claim,
      annotation_count: taskAnnotations.length,
      majority_human_verdict: mode(taskAnnotations.map((annotation) => annotation.human_verdict)),
      majority_would_ai_cite: mode(taskAnnotations.map((annotation) => annotation.would_ai_cite)),
    };
  });

  return NextResponse.json({
    total_claim_tasks: taskRows.length,
    total_claim_annotations: annotationRows.length,
    annotations_per_task: annotationsPerTask,
    verdict_distribution: verdictDistribution,
    cite_distribution: citeDistribution,
    majority_labels: majorityLabels,
  });
}
