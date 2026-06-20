import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const verdicts = new Set(["supported", "questionable", "unsupported", "insufficient_info"]);
const citeDecisions = new Set(["yes", "no", "caution"]);

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.task_id || !verdicts.has(body.human_verdict) || !citeDecisions.has(body.would_ai_cite) || !body.reason?.trim() || !body.annotator_session_id) {
    return NextResponse.json({ error: "Missing or invalid annotation fields." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("claim_annotations").insert({
    task_id: body.task_id,
    human_verdict: body.human_verdict,
    would_ai_cite: body.would_ai_cite,
    risk_tags: Array.isArray(body.risk_tags) ? body.risk_tags : [],
    reason: body.reason.trim(),
    annotator_session_id: body.annotator_session_id,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, annotation_id: data.id });
}
