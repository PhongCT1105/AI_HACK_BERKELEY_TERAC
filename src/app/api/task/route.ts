import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cleanEvidenceText } from "@/lib/evidence";

export const TARGET_LABELS_PER_TASK = Number(process.env.TARGET_LABELS_PER_TASK) || 3;

type ClaimTask = {
  task_id: string;
  claim: string;
  evidence_text: string | null;
  evidence_text_clean: string | null;
  evidence_url: string | null;
  posted_date: string | null;
};

const UNDATED_GROUP = "undated";

function dateGroup(postedDate: string | null): string {
  const value = postedDate?.trim();
  if (!value) return UNDATED_GROUP;

  // Preserve the calendar day embedded in ISO-like values without applying the
  // server timezone. Other parseable date strings are normalized to UTC.
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return UNDATED_GROUP;

  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, "0"),
    String(parsed.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function compareDateGroups(left: string, right: string): number {
  if (left === UNDATED_GROUP) return right === UNDATED_GROUP ? 0 : 1;
  if (right === UNDATED_GROUP) return -1;
  return left.localeCompare(right);
}

// Simplified Terac flow: finish one posted-date group before selecting tasks
// from the next date. Within that group, pick the least-labeled unseen task
// deterministically so all questions receive balanced coverage.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  const supabase = getSupabaseAdmin();

  const { data: tasks, error } = await supabase
    .from("source_claim_tasks")
    .select("task_id, claim, evidence_text, evidence_text_clean, evidence_url, posted_date");
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

  const underTarget = (tasks as ClaimTask[]).filter(
    (task) => (countsByTask.get(task.task_id) ?? 0) < TARGET_LABELS_PER_TASK
  );
  if (underTarget.length === 0) {
    return NextResponse.json({ error: "All questions are labeled. Thank you." }, { status: 404 });
  }

  const activeDate = [...new Set(underTarget.map((task) => dateGroup(task.posted_date)))].sort(
    compareDateGroups
  )[0];
  const tasksForActiveDate = underTarget.filter(
    (task) => dateGroup(task.posted_date) === activeDate
  );
  const unseenTasks = tasksForActiveDate.filter(
    (task) => !taskIdsSeenBySession.has(task.task_id)
  );
  const candidates = unseenTasks.length > 0 ? unseenTasks : tasksForActiveDate;
  const task = [...candidates].sort((left, right) => {
    const countDifference =
      (countsByTask.get(left.task_id) ?? 0) - (countsByTask.get(right.task_id) ?? 0);
    return countDifference || left.task_id.localeCompare(right.task_id);
  })[0];

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
