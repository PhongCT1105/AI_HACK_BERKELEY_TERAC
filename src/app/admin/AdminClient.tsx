"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAdminPassword } from "@/lib/admin-context";

interface ResultsResponse {
  total_claim_tasks: number;
  total_claim_annotations: number;
  annotations_per_task: { task_id: string; claim: string; count: number }[];
  verdict_distribution: Record<string, number>;
  cite_distribution: Record<string, number>;
  majority_labels: {
    task_id: string;
    claim: string;
    annotation_count: number;
    majority_human_verdict: string | null;
    majority_would_ai_cite: string | null;
  }[];
}

export function AdminClient() {
  const password = useAdminPassword();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/results", {
        headers: { "x-admin-password": password },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to load results.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial dashboard load
    load();
  }, [load]);

  if (loading) return <p className="text-zinc-500">Loading dashboard…</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button render={<a href={`/api/export?password=${encodeURIComponent(password)}`} />}>
          Export Terac labels CSV
        </Button>
        <Button variant="outline" render={<Link href={`/admin/eval?password=${encodeURIComponent(password)}`} />}>
          Evaluation guidance
        </Button>
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Fin-Fact claim tasks" value={data.total_claim_tasks} />
        <StatCard label="Terac claim annotations" value={data.total_claim_annotations} />
      </div>

      <Section title="Human verdict distribution">
        <DistributionRow distribution={data.verdict_distribution} />
      </Section>
      <Section title="AI citation decision distribution">
        <DistributionRow distribution={data.cite_distribution} />
      </Section>
      <Section title="Annotations per Fin-Fact claim">
        <Table
          columns={["Task", "Claim", "Annotations"]}
          rows={data.annotations_per_task.map((row) => [row.task_id, row.claim, String(row.count)])}
        />
      </Section>
      <Section title="Current majority labels">
        <Table
          columns={["Task", "Claim", "n", "Verdict", "AI may cite"]}
          rows={data.majority_labels.map((row) => [
            row.task_id,
            row.claim,
            String(row.annotation_count),
            row.majority_human_verdict ?? "—",
            row.majority_would_ai_cite ?? "—",
          ])}
        />
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <Card><CardHeader><p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p></CardHeader><CardContent><p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p></CardContent></Card>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>{children}</div>;
}
function DistributionRow({ distribution }: { distribution: Record<string, number> }) {
  return <div className="flex flex-wrap gap-3">{Object.entries(distribution).map(([key, value]) => <div key={key} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"><span className="text-zinc-500">{key.replace(/_/g, " ")}: </span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</span></div>)}</div>;
}
function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-zinc-500">No data yet.</p>;
  return <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"><table className="w-full text-left text-sm"><thead className="bg-zinc-50 dark:bg-zinc-900"><tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium text-zinc-500">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-xs truncate px-3 py-2 text-zinc-800 dark:text-zinc-200">{cell}</td>)}</tr>)}</tbody></table></div>;
}
