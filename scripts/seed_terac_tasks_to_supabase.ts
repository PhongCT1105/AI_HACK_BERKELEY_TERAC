import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const localEnvFile = resolve(process.cwd(), ".env.local");
  if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

  const file = resolve(process.cwd(), "data/captain_america_terac_tasks.jsonl");
  const tasks = (await readFile(file, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  if (!tasks.length) throw new Error("No public tasks found. Run prepare_finfact_for_terac.py first.");

  const rows = tasks.map(({ annotation_questions, ...task }) => task);
  const result = await fetch(url + "/rest/v1/source_claim_tasks?on_conflict=task_id", {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!result.ok) {
    const responseText = await result.text();
    if (result.status === 404 && responseText.includes("source_claim_tasks")) {
      throw new Error(
        "Supabase is reachable, but public.source_claim_tasks is missing. Run supabase/schema.sql " +
          "in this project's Supabase SQL Editor, then retry. Also confirm .env.local " +
          "points to that same Supabase project."
      );
    }
    throw new Error("Supabase seed failed (" + result.status + "): " + responseText);
  }

  console.log("Upserted " + (await result.json()).length + " Captain America public tasks.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
