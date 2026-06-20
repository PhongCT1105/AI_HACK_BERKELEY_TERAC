"use client";

import { useEffect, useState } from "react";
import { getAnnotatorSessionId } from "@/lib/session";

type Task = {
  task_id: string;
  claim: string;
  evidence_text_clean: string;
  evidence_url: string | null;
  progress: { total_labels_collected: number; target_labels_total: number };
};

export default function AnnotatePage() {
  const [task, setTask] = useState<Task | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Loading a question...");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadTask() {
    setStatus("Loading a question...");
    setTask(null);
    setReason("");
    const sessionId = getAnnotatorSessionId();
    const response = await fetch(`/api/task?session_id=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) {
      if (response.status === 404) {
        setDone(true);
        setStatus("");
        return;
      }
      setStatus(body.error ?? "Could not load a question.");
      return;
    }
    setDone(false);
    setTask(body);
    setStatus("");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTask();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(canAiCite: "yes" | "no") {
    if (!task || submitting) return;
    setSubmitting(true);
    setStatus("");
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: task.task_id,
        can_ai_cite: canAiCite,
        reason: reason.trim() || undefined,
        annotator_session_id: getAnnotatorSessionId(),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setSubmitting(false);
      setStatus(body.error ?? "Could not save your answer.");
      return;
    }
    setStatus("Saved. Loading next question...");
    await loadTask();
    setSubmitting(false);
  }

  if (done) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <p className="text-lg font-medium text-zinc-800">All questions are labeled. Thank you.</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center text-zinc-600">{status}</main>
    );
  }

  const { total_labels_collected, target_labels_total } = task.progress;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 sm:py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Captain America Finance</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Progress: {total_labels_collected} / {target_labels_total} labels collected
        </p>
        <p className="text-xs text-zinc-400">Question ID: {task.task_id}</p>
      </header>

      <h2 className="mt-8 text-center text-xl font-semibold text-zinc-900">
        Can an AI financial research agent cite this claim?
      </h2>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Claim</p>
        <p className="mt-2 text-lg leading-7 text-zinc-900">{task.claim}</p>
      </section>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Evidence</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
          {task.evidence_text_clean || "No evidence text was provided."}
        </p>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit("yes")}
          className="rounded-xl bg-green-600 px-4 py-5 text-lg font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        >
          Yes, cite it
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit("no")}
          className="rounded-xl bg-red-600 px-4 py-5 text-lg font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
        >
          No, do not cite it
        </button>
      </div>

      <textarea
        className="mt-4 block w-full rounded-md border border-zinc-300 p-3 text-sm"
        rows={2}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Optional: one sentence reason"
      />

      {status && <p className="mt-3 text-center text-sm text-amber-700">{status}</p>}
    </main>
  );
}
