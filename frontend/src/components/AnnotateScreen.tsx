"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAnnotatorSessionId } from "@/lib/session";

type Task = {
  task_id: string;
  claim: string;
  evidence_text_clean: string;
  evidence_url: string | null;
  progress: { total_labels_collected: number; target_labels_total: number };
};

type Vote = "yes" | "no";

export function AnnotateScreen() {
  const [task, setTask] = useState<Task | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Loading a question...");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votedAs, setVotedAs] = useState<Vote | null>(null);
  const [sessionVotes, setSessionVotes] = useState(0);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  const loadTask = useCallback(async () => {
    setStatus("Loading a question...");
    setTask(null);
    setReason("");
    setVotedAs(null);
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTask();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTask]);

  async function vote(canAiCite: Vote) {
    if (!task || submitting || votedAs) return;
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
    setSubmitting(false);
    if (!response.ok) {
      setStatus(body.error ?? "Could not save your answer.");
      return;
    }
    setVotedAs(canAiCite);
    setSessionVotes((count) => count + 1);
    setStatus("Saved.");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (document.activeElement === reasonRef.current) return;
      if (!task || done) return;
      if (!votedAs) {
        if (event.key === "1") vote("no");
        if (event.key === "2") vote("yes");
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        void loadTask();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vote/loadTask are stable enough for this listener
  }, [task, done, votedAs]);

  if (done) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
        <p className="text-lg font-medium text-zinc-800">All questions are labeled. Thank you.</p>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 text-center text-zinc-500">
        {status}
      </main>
    );
  }

  const { total_labels_collected, target_labels_total } = task.progress;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          🛡️ Captain America Finance
        </span>
        <span className="text-xs text-zinc-400">Question ID: {task.task_id}</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        <p className="text-center text-sm text-zinc-500">
          {votedAs
            ? `${sessionVotes} labeled this session`
            : `Progress: ${total_labels_collected} / ${target_labels_total} labels collected`}
        </p>
        <h1 className="mx-auto mt-2 max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Can an AI financial research agent cite this claim?
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Claim</p>
            <p className="mt-3 text-lg leading-7 text-zinc-900">{task.claim}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Evidence</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {task.evidence_text_clean || "No evidence text was provided."}
            </p>
          </div>
        </div>

        <textarea
          ref={reasonRef}
          className="mx-auto mt-6 block w-full max-w-xl rounded-lg border border-zinc-300 bg-white p-3 text-sm focus:border-zinc-400 focus:outline-none disabled:opacity-60"
          rows={2}
          value={reason}
          disabled={Boolean(votedAs)}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional: one sentence reason"
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <VoteButton
            tone="red"
            label="No, do not cite it"
            arrow="left"
            shortcut="1"
            selected={votedAs === "no"}
            disabled={submitting || Boolean(votedAs)}
            onClick={() => vote("no")}
          />
          <VoteButton
            tone="green"
            label="Yes, cite it"
            arrow="right"
            shortcut="2"
            selected={votedAs === "yes"}
            disabled={submitting || Boolean(votedAs)}
            onClick={() => vote("yes")}
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {status && <p className="text-sm text-zinc-500">{status}</p>}
          {votedAs && (
            <button
              type="button"
              onClick={() => void loadTask()}
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700"
            >
              Next question
              <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-normal">Space</kbd>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function VoteButton({
  tone,
  label,
  arrow,
  shortcut,
  selected,
  disabled,
  onClick,
}: {
  tone: "red" | "green";
  label: string;
  arrow: "left" | "right";
  shortcut: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const toneClasses =
    tone === "red"
      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300"
      : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-300";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 ${toneClasses} ${
        selected ? "ring-4 ring-offset-2 ring-zinc-300" : ""
      }`}
    >
      {arrow === "left" && <span aria-hidden>←</span>}
      {label}
      {arrow === "right" && <span aria-hidden>→</span>}
      <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal">{shortcut}</kbd>
    </button>
  );
}
