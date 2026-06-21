import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLES = [
  "source_pairs",
  "annotations",
  "source_claim_tasks",
  "claim_annotations",
  "simple_claim_annotations",
] as const;

const LABEL_TABLES = ["annotations", "claim_annotations", "simple_claim_annotations"] as const;
const PAGE_SIZE = 1_000;

type TableName = (typeof TABLES)[number];
type Snapshot = {
  format: "agentshield-supabase-snapshot-v1";
  created_at: string;
  tables: Record<TableName, unknown[]>;
};

async function fetchAllRows(supabase: SupabaseClient, table: TableName): Promise<unknown[]> {
  const rows: unknown[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not snapshot ${table}: ${error.message}`);

    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function main() {
  const localEnvFile = resolve(process.cwd(), ".env.local");
  if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const tables = {} as Snapshot["tables"];
  for (const table of TABLES) tables[table] = await fetchAllRows(supabase, table);

  const createdAt = new Date().toISOString();
  const fileName = `supabase-before-demo-reset-${createdAt.replace(/[:.]/g, "-")}.json`;
  const outputDirectory = resolve(process.cwd(), "data", "demo-seeds");
  const outputPath = resolve(outputDirectory, fileName);
  const snapshot: Snapshot = {
    format: "agentshield-supabase-snapshot-v1",
    created_at: createdAt,
    tables,
  };

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  // Confirm the saved file is complete before mutating the remote database.
  const savedSnapshot = JSON.parse(await readFile(outputPath, "utf8")) as Snapshot;
  for (const table of TABLES) {
    if (savedSnapshot.tables[table]?.length !== tables[table].length) {
      throw new Error(`Snapshot verification failed for ${table}; no labels were deleted.`);
    }
  }

  for (const table of LABEL_TABLES) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`Could not reset ${table}: ${error.message}`);
  }

  const remainingLabelCounts: Record<string, number> = {};
  for (const table of LABEL_TABLES) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`Could not verify ${table}: ${error.message}`);
    remainingLabelCounts[table] = count ?? 0;
  }

  if (Object.values(remainingLabelCounts).some((count) => count !== 0)) {
    throw new Error(`Reset verification failed: ${JSON.stringify(remainingLabelCounts)}`);
  }

  console.log(`Saved database snapshot: ${outputPath}`);
  console.log(
    `Snapshot rows: ${TABLES.map((table) => `${table}=${tables[table].length}`).join(", ")}`
  );
  console.log("All label tables are now empty. Source and task records were retained.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
