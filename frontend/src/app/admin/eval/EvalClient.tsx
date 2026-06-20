"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAdminPassword } from "@/lib/admin-context";

interface ResultsResponse {
  machine_human_agreement_pct: number | null;
  machine_human_agreement_sample_size: number;
  majority_labels: {
    pair_id: string;
    research_task: string;
    annotation_count: number;
    majority_human_preference: string | null;
    machine_preferred_source: string | null;
    agrees_with_machine: boolean | null;
  }[];
}

export function EvalClient() {
  const password = useAdminPassword();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/results", { headers: { "x-admin-password": password }, cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load eval data.");
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load eval data."));
  }, [password]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const disagreements = data.majority_labels.filter((m) => m.agrees_with_machine === false);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            base_human_agreement (machine baseline vs. human majority vote)
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-semibold text-zinc-950 dark:text-zinc-50">
            {data.machine_human_agreement_pct === null ? "—" : `${data.machine_human_agreement_pct}%`}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Computed over {data.machine_human_agreement_sample_size} pairs with at least one
            annotation and a clear majority preference of source_a or source_b.
          </p>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-zinc-200 p-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">Future trained-model comparison</p>
        <p className="mt-1">
          Once a trained model exists (see <code>ml/README.md</code>), compute its predictions on
          the same held-out pairs and report <code>trained_model_human_agreement</code> next to
          this number. The trained model should beat <code>base_human_agreement</code> to justify
          replacing the heuristic baseline.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Pairs where the machine disagreed with the human majority ({disagreements.length})
        </h2>
        {disagreements.length === 0 ? (
          <p className="text-sm text-zinc-500">No disagreements yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {disagreements.map((row) => (
              <li
                key={row.pair_id}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <p className="text-zinc-800 dark:text-zinc-200">{row.research_task}</p>
                <p className="text-xs text-zinc-500">
                  machine: {row.machine_preferred_source} · human majority:{" "}
                  {row.majority_human_preference} · n={row.annotation_count}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
