import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { buildSeedPairs } from "@/lib/seed-data";

export async function POST(req: NextRequest) {
  let bodyPassword: string | undefined;
  try {
    const body = await req.json();
    bodyPassword = body?.password;
  } catch {
    // No JSON body provided — fall back to header/query auth.
  }

  if (!isAuthorizedAdmin(req, bodyPassword)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const seedRows = buildSeedPairs();

  const { data, error } = await supabase.from("source_pairs").insert(seedRows).select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: data.length });
}
