import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cleanEvidenceText } from "@/lib/evidence";

// Main columns first so claim + evidence_text_clean -> can_ai_cite is trivial to
// load as a training CSV. Extra columns trail for debugging/audit only.
const CSV_COLUMNS = [
  "task_id",
  "claim",
  "evidence_text_clean",
  "can_ai_cite",
  "reason",
  "created_at",
  "evidence_url",
  "annotator_session_id",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const [{ data: tasks, error: tasksError }, { data: annotations, error: annotationsError }] =
    await Promise.all([
      supabase.from("source_claim_tasks").select("task_id, claim, evidence_text, evidence_text_clean, evidence_url"),
      supabase.from("simple_claim_annotations").select("*"),
    ]);

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });
  if (annotationsError) return NextResponse.json({ error: annotationsError.message }, { status: 500 });

  const taskById = new Map((tasks ?? []).map((task) => [task.task_id, task]));
  const rows = (annotations ?? []).flatMap((annotation) => {
    const task = taskById.get(annotation.task_id);
    if (!task) return [];
    return [{
      task_id: task.task_id,
      claim: task.claim,
      evidence_text_clean: task.evidence_text_clean || cleanEvidenceText(task.evidence_text),
      can_ai_cite: annotation.can_ai_cite,
      reason: annotation.reason,
      created_at: annotation.created_at,
      evidence_url: task.evidence_url,
      annotator_session_id: annotation.annotator_session_id,
    }];
  });

  const lines = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(",")),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="captain-america-claim-labels-${Date.now()}.csv"`,
    },
  });
}
