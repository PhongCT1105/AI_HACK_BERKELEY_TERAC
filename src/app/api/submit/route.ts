import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const CAN_AI_CITE = new Set(["yes", "no"]);

// Simplified Terac flow: claim + evidence_text_clean -> can_ai_cite (yes/no), optional reason.
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.task_id || !CAN_AI_CITE.has(body.can_ai_cite) || !body.annotator_session_id) {
    return NextResponse.json({ error: "Missing or invalid annotation fields." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("simple_claim_annotations")
    .insert({
      task_id: body.task_id,
      can_ai_cite: body.can_ai_cite,
      reason: typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null,
      annotator_session_id: body.annotator_session_id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, annotation_id: data.id });
}
