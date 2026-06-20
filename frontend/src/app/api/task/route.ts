import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cleanEvidenceText } from "@/lib/evidence";

export const TARGET_LABELS_PER_TASK = Number(process.env.TARGET_LABELS_PER_TASK) || 3;

// Simplified Terac flow: serve one random claim/evidence task, preferring tasks
// under the per-task label target and tasks this annotator session hasn't seen yet.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  const supabase = getSupabaseAdmin();

  const { data: tasks, error } = await supabase
    .from("source_claim_tasks")
    .select("task_id, claim, evidence_text, evidence_text_clean, evidence_url");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks?.length) {
    return NextResponse.json({ error: "No claim tasks have been seeded yet." }, { status: 404 });
  }

  const { data: annotations, error: annotationsError } = await supabase
    .from("simple_claim_annotations")
    .select("task_id, annotator_session_id");
  if (annotationsError) {
    return NextResponse.json({ error: annotationsError.message }, { status: 500 });
  }

  const countsByTask = new Map<string, number>();
  const taskIdsSeenBySession = new Set<string>();
  for (const annotation of annotations ?? []) {
    countsByTask.set(annotation.task_id, (countsByTask.get(annotation.task_id) ?? 0) + 1);
    if (sessionId && annotation.annotator_session_id === sessionId) {
      taskIdsSeenBySession.add(annotation.task_id);
    }
  }

  const totalLabelsCollected = annotations?.length ?? 0;
  const targetLabelsTotal = tasks.length * TARGET_LABELS_PER_TASK;

  const underTarget = tasks.filter(
    (task) => (countsByTask.get(task.task_id) ?? 0) < TARGET_LABELS_PER_TASK
  );
  if (underTarget.length === 0) {
    return NextResponse.json({ error: "All questions are labeled. Thank you." }, { status: 404 });
  }

  const notSeenByMe = underTarget.filter((task) => !taskIdsSeenBySession.has(task.task_id));
  const candidates = notSeenByMe.length > 0 ? notSeenByMe : underTarget;
  const task = candidates[Math.floor(Math.random() * candidates.length)];

  return NextResponse.json({
    task_id: task.task_id,
    claim: task.claim,
    evidence_text_clean: task.evidence_text_clean || cleanEvidenceText(task.evidence_text),
    evidence_url: task.evidence_url,
    progress: {
      total_labels_collected: totalLabelsCollected,
      target_labels_total: targetLabelsTotal,
    },
  });
}
