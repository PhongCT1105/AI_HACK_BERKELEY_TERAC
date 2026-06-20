import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { TARGET_LABELS_PER_TASK } from "../task/route";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: tasks, error: tasksError } = await supabase
    .from("source_claim_tasks")
    .select("task_id");
  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });

  const { data: annotations, error: annotationsError } = await supabase
    .from("simple_claim_annotations")
    .select("task_id");
  if (annotationsError) return NextResponse.json({ error: annotationsError.message }, { status: 500 });

  const countsByTask = new Map<string, number>();
  for (const annotation of annotations ?? []) {
    countsByTask.set(annotation.task_id, (countsByTask.get(annotation.task_id) ?? 0) + 1);
  }

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = (tasks ?? []).filter(
    (task) => (countsByTask.get(task.task_id) ?? 0) >= TARGET_LABELS_PER_TASK
  ).length;

  return NextResponse.json({
    total_tasks: totalTasks,
    total_labels_collected: annotations?.length ?? 0,
    target_labels_total: totalTasks * TARGET_LABELS_PER_TASK,
    completed_tasks: completedTasks,
    remaining_tasks: totalTasks - completedTasks,
  });
}
