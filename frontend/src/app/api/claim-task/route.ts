import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: tasks, error } = await supabase.from("source_claim_tasks").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks?.length) return NextResponse.json({ error: "No Fin-Fact tasks have been seeded yet." }, { status: 404 });

  const { data: labels, error: labelsError } = await supabase.from("claim_annotations").select("task_id");
  if (labelsError) return NextResponse.json({ error: labelsError.message }, { status: 500 });
  const counts = new Map<string, number>();
  for (const label of labels ?? []) counts.set(label.task_id, (counts.get(label.task_id) ?? 0) + 1);
  const min = Math.min(...tasks.map((task) => counts.get(task.task_id) ?? 0));
  const candidates = tasks.filter((task) => (counts.get(task.task_id) ?? 0) === min);
  return NextResponse.json(candidates[Math.floor(Math.random() * candidates.length)]);
}
