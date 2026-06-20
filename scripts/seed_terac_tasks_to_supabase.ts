import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
const file = resolve(process.cwd(), "data/sourceguard_terac_tasks.jsonl");
const tasks = (await readFile(file, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line));
if (!tasks.length) throw new Error("No public tasks found. Run prepare_finfact_for_terac.py first.");
const rows = tasks.map(({ annotation_questions, ...task }) => task);
const result = await fetch(url + "/rest/v1/source_claim_tasks?on_conflict=task_id", {
  method: "POST",
  headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(rows),
});
if (!result.ok) throw new Error("Supabase seed failed (" + result.status + "): " + await result.text());
console.log("Upserted " + (await result.json()).length + " SourceGuard public tasks.");
