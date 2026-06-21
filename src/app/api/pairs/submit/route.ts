import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SubmitAnnotationBody } from "@/lib/types";

const PREFERENCES = new Set(["source_a", "source_b", "both_similar", "neither"]);
const CITE_DECISIONS = new Set(["yes", "no", "caution"]);

// Optional future Browserbase-oriented source-pair API.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<SubmitAnnotationBody>;
  if (
    !body.pair_id || !body.human_preferred_source || !PREFERENCES.has(body.human_preferred_source) ||
    !body.source_a_would_cite || !CITE_DECISIONS.has(body.source_a_would_cite) ||
    !body.source_b_would_cite || !CITE_DECISIONS.has(body.source_b_would_cite) ||
    !body.reason?.trim() || !body.annotator_session_id
  ) return NextResponse.json({ error: "Missing or invalid pair annotation fields." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("annotations").insert({
    pair_id: body.pair_id,
    human_preferred_source: body.human_preferred_source,
    source_a_would_cite: body.source_a_would_cite,
    source_b_would_cite: body.source_b_would_cite,
    selected_risk_tags: body.selected_risk_tags ?? [],
    reason: body.reason.trim(),
    annotator_session_id: body.annotator_session_id,
    user_agent: req.headers.get("user-agent") ?? null,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, annotation_id: data.id });
}
