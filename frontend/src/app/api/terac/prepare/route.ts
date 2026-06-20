import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

const ANNOTATOR_INSTRUCTIONS =
  "You are helping train an AI agent to choose trustworthy financial sources. Given one claim and its visible source information, judge whether an AI agent should cite it. You are not giving financial advice or deciding whether an investment is good. Focus on source quality, evidence, transparency, promotional pressure, and citation suitability.";

// Terac MCP tools (terac_list_opportunities, terac_create_quote, etc.) are not
// installed in this environment, so this route returns a ready-to-use payload
// and manual launch instructions instead of calling Terac directly. See
// docs/TERAC_LAUNCH.md for the full manual flow.
export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const opportunityPayload = {
    task_title: "Captain America Finance Claim Credibility Labeling",
    audience: "general population",
    task_type: "financial claim credibility annotation",
    estimated_time_seconds: { min: 45, max: 90 },
    desired_labels_per_task: 3,
    annotation_url: `${appUrl}/annotate`,
    instructions: ANNOTATOR_INSTRUCTIONS,
  };

  return NextResponse.json({
    ok: true,
    mcp_available: false,
    message:
      "Terac MCP tools were not detected. Use the payload below to manually create the opportunity, or see docs/TERAC_LAUNCH.md.",
    opportunity_payload: opportunityPayload,
    manual_steps: [
      "Run: claude mcp add --transport http terac https://terac.com/api/mcp",
      "Run /mcp in Claude Code to authenticate.",
      "Ask Claude to call terac_create_quote with the opportunity_payload above and review the quote before launching.",
      "Call terac_launch_opportunity only after confirming the quote fits the hackathon budget.",
      "Poll terac_get_submissions periodically, or rely on this app's Supabase-stored annotations.",
    ],
  });
}
