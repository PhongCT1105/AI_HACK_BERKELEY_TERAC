"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAdminPassword } from "@/lib/admin-context";

interface ResultsResponse {
  total_claim_tasks: number;
  total_claim_annotations: number;
  majority_labels: { annotation_count: number }[];
}

export function EvalClient() {
  const password = useAdminPassword();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/results", { headers: { "x-admin-password": password }, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Failed to load evaluation data.");
        setData(result);
      })
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : "Failed to load evaluation data."));
  }, [password]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const tasksWithThreeLabels = data.majority_labels.filter((row) => row.annotation_count >= 3).length;
  return (
    <div className="flex flex-col gap-6">
      <Card><CardHeader><p className="text-xs uppercase tracking-wide text-zinc-400">Terac label readiness</p></CardHeader><CardContent><p className="text-4xl font-semibold text-zinc-950 dark:text-zinc-50">{tasksWithThreeLabels} / {data.total_claim_tasks}</p><p className="mt-1 text-sm text-zinc-500">tasks with at least three independent claim annotations ({data.total_claim_annotations} total).</p></CardContent></Card>
      <div className="rounded-lg border border-zinc-200 p-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"><p className="font-medium text-zinc-900 dark:text-zinc-100">Held-out claim-citation evaluation</p><p className="mt-1">Export the Terac labels, group annotations by <code>task_id</code>, take majority verdict and citation labels, then split tasks before training. Compare the deterministic base model and the Terac-trained model on that same held-out task split. Report metrics only after both predictions have been computed.</p></div>
    </div>
  );
}
