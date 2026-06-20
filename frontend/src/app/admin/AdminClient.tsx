"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAdminPassword } from "@/lib/admin-context";

interface ResultsResponse {
  total_pairs: number;
  total_annotations: number;
  annotations_per_pair: { pair_id: string; research_task: string; count: number }[];
  human_preference_distribution: Record<string, number>;
  cite_a_distribution: Record<string, number>;
  cite_b_distribution: Record<string, number>;
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

export function AdminClient() {
  const password = useAdminPassword();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/results", {
        headers: { "x-admin-password": password },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load results.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, [load]);

  if (loading) return <p className="text-zinc-500">Loading dashboard…</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button render={<a href={`/api/export?password=${encodeURIComponent(password)}`} />}>
          Export CSV
        </Button>
        <Button variant="outline" render={<Link href={`/admin/seed?password=${encodeURIComponent(password)}`} />}>
          Seed sample data
        </Button>
        <Button variant="outline" render={<Link href={`/admin/eval?password=${encodeURIComponent(password)}`} />}>
          View base-vs-human eval
        </Button>
        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total source pairs" value={data.total_pairs} />
        <StatCard label="Total annotations" value={data.total_annotations} />
        <StatCard
          label="Machine ↔ human agreement"
          value={
            data.machine_human_agreement_pct === null
              ? "—"
              : `${data.machine_human_agreement_pct}%`
          }
          hint={`n=${data.machine_human_agreement_sample_size}`}
        />
      </div>

      <Section title="Human preferred source distribution">
        <DistributionRow distribution={data.human_preference_distribution} />
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Cite Source A decisions">
          <DistributionRow distribution={data.cite_a_distribution} />
        </Section>
        <Section title="Cite Source B decisions">
          <DistributionRow distribution={data.cite_b_distribution} />
        </Section>
      </div>

      <Section title="Annotations per pair">
        <Table
          columns={["Research task", "Annotations"]}
          rows={data.annotations_per_pair.map((row) => [row.research_task, String(row.count)])}
        />
      </Section>

      <Section title="Majority labels per pair">
        <Table
          columns={["Research task", "n", "Majority human", "Machine", "Agrees?"]}
          rows={data.majority_labels.map((row) => [
            row.research_task,
            String(row.annotation_count),
            row.majority_human_preference ?? "—",
            row.machine_preferred_source ?? "—",
            row.agrees_with_machine === null ? "—" : row.agrees_with_machine ? "✓" : "✗",
          ])}
        />
      </Section>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function DistributionRow({ distribution }: { distribution: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(distribution).map(([key, value]) => (
        <div
          key={key}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
        >
          <span className="text-zinc-500">{key.replace(/_/g, " ")}: </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
        </div>
      ))}
    </div>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium text-zinc-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
              {row.map((cell, j) => (
                <td key={j} className="max-w-xs truncate px-3 py-2 text-zinc-800 dark:text-zinc-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
