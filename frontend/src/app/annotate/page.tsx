"use client";

import { useEffect, useState } from "react";
import { getAnnotatorSessionId } from "@/lib/session";

type Task = {
  task_id: string; research_task: string; claim: string; author: string | null;
  posted_date: string | null; source: string | null; evidence_text: string | null;
  evidence_url: string | null; image_url: string | null; capsule: string | null;
};
const risks = [
  ["unsupported_financial_claim", "Unsupported financial claim"],
  ["weak_or_missing_evidence", "Weak or missing evidence"],
  ["no_clear_author", "No clear author"],
  ["promotional_language", "Promotional language"],
  ["price_prediction", "Price prediction"],
  ["conflict_of_interest", "Conflict of interest"],
  ["outdated_information", "Outdated information"],
  ["unclear_source", "Unclear source"],
  ["looks_reliable", "Looks reliable"],
  ["other", "Other"],
] as const;

export default function AnnotatePage() {
  const [task, setTask] = useState<Task | null>(null);
  const [verdict, setVerdict] = useState("");
  const [cite, setCite] = useState("");
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Loading a claim...");
  const [submitting, setSubmitting] = useState(false);

  async function loadTask() {
    setStatus("Loading a claim...");
    setTask(null); setVerdict(""); setCite(""); setSelectedRisks([]); setReason("");
    const response = await fetch("/api/claim-task", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) { setStatus(body.error ?? "Could not load a task."); return; }
    setTask(body); setStatus("");
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTask(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleRisk(value: string) {
    setSelectedRisks((current) => current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!task || !verdict || !cite || !reason.trim()) { setStatus("Complete the verdict, citation decision, and one-sentence reason."); return; }
    setSubmitting(true); setStatus("");
    const response = await fetch("/api/claim-submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.task_id, human_verdict: verdict, would_ai_cite: cite, risk_tags: selectedRisks, reason, annotator_session_id: getAnnotatorSessionId() }),
    });
    const body = await response.json();
    setSubmitting(false);
    if (!response.ok) { setStatus(body.error ?? "Could not save annotation."); return; }
    setStatus("Saved. Loading the next claim...");
    await loadTask();
  }

  if (!task) return <main className="mx-auto max-w-3xl px-6 py-20 text-zinc-700">{status}</main>;
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 pb-20">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <p className="text-sm font-semibold text-indigo-700">SourceGuard Finance · Terac annotation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Can an AI agent cite this claim?</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{task.research_task}</p>
      </header>
      <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Financial claim</p><p className="mt-2 text-xl leading-8 text-zinc-900">{task.claim}</p></div>
        <dl className="grid gap-3 border-y border-zinc-100 py-4 text-sm sm:grid-cols-3">
          <Meta label="Author" value={task.author} /><Meta label="Posted date" value={task.posted_date} /><Meta label="Source/platform" value={task.source} />
        </dl>
        {task.evidence_text && <div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Visible evidence</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{task.evidence_text}</p></div>}
        {task.evidence_url && <a className="text-sm font-medium text-indigo-700 underline" href={task.evidence_url} target="_blank" rel="noreferrer">Open evidence link</a>}
        {/* eslint-disable-next-line @next/next/no-img-element -- External dataset image hosts are unknown at build time. */}
        {task.image_url && <img className="max-h-80 rounded-lg border border-zinc-200" src={task.image_url} alt="Claim source material" />}
        {task.capsule && <aside className="rounded-lg bg-indigo-50 p-4 text-sm leading-6 text-indigo-950"><strong>Neutral capsule:</strong> {task.capsule}</aside>}
      </section>
      <form onSubmit={submit} className="mt-8 space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <Choice label="1. What is your judgment of this financial claim/source?" value={verdict} onChange={setVerdict} options={[["supported", "Supported"], ["questionable", "Questionable"], ["unsupported", "Unsupported"], ["insufficient_info", "Insufficient information"]]} />
        <Choice label="2. Would you allow an AI agent to cite this?" value={cite} onChange={setCite} options={[["yes", "Yes"], ["caution", "Yes, with caution"], ["no", "No"]]} />
        <fieldset><legend className="font-medium text-zinc-900">3. What risks do you notice?</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{risks.map(([value, label]) => <label key={value} className="flex gap-2 text-sm text-zinc-700"><input type="checkbox" checked={selectedRisks.includes(value)} onChange={() => toggleRisk(value)} />{label}</label>)}</div></fieldset>
        <label className="block font-medium text-zinc-900">4. One-sentence reason<textarea className="mt-2 block w-full rounded-md border border-zinc-300 p-3 text-sm" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the evidence or source-quality signal behind your decision." /></label>
        {status && <p className="text-sm text-amber-700">{status}</p>}
        <button disabled={submitting} className="rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Saving..." : "Submit and continue"}</button>
      </form>
    </main>
  );
}
function Meta({ label, value }: { label: string; value: string | null }) { return <div><dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt><dd className="mt-1 text-zinc-800">{value || "Not provided"}</dd></div>; }
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <fieldset><legend className="font-medium text-zinc-900">{label}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{options.map(([key, text]) => <label key={key} className="flex gap-2 text-sm text-zinc-700"><input type="radio" name={label} value={key} checked={value === key} onChange={(e) => onChange(e.target.value)} />{text}</label>)}</div></fieldset>; }
