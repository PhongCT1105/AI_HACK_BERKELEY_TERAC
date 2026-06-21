"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { getAnnotatorSessionId } from "@/lib/session";
import { RISK_TAGS } from "@/lib/types";
import type { CiteDecision, HumanPreference, RiskTag, SourceFeatures } from "@/lib/types";
import { SourceCard } from "./SourceCard";

interface TaskPayload {
  pair_id: string;
  research_task: string;
  source_a: SourceFeatures;
  source_b: SourceFeatures;
}

const PREFERENCE_OPTIONS: { value: HumanPreference; label: string }[] = [
  { value: "source_a", label: "Source A" },
  { value: "source_b", label: "Source B" },
  { value: "both_similar", label: "Both similar" },
  { value: "neither", label: "Neither" },
];

const CITE_OPTIONS: { value: CiteDecision; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "caution", label: "With caution" },
];

function emptyFormState() {
  return {
    humanPreferred: null as HumanPreference | null,
    citeA: null as CiteDecision | null,
    citeB: null as CiteDecision | null,
    riskTags: [] as RiskTag[],
    reason: "",
  };
}

export function AnnotateClient() {
  const [task, setTask] = useState<TaskPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [form, setForm] = useState(emptyFormState());

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForm(emptyFormState());
    try {
      const res = await fetch("/api/pairs/task", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load a source pair.");
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load a source pair.");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadTask();
  }, [loadTask]);

  function toggleRiskTag(tag: RiskTag) {
    setForm((prev) => ({
      ...prev,
      riskTags: prev.riskTags.includes(tag)
        ? prev.riskTags.filter((t) => t !== tag)
        : [...prev.riskTags, tag],
    }));
  }

  function validate(): string | null {
    if (!form.humanPreferred) return "Choose which source an AI agent should trust more.";
    if (!form.citeA) return "Decide whether Source A would be safe to cite.";
    if (!form.citeB) return "Decide whether Source B would be safe to cite.";
    if (!form.reason.trim()) return "Add a one-sentence reason for your decision.";
    return null;
  }

  async function handleSubmit() {
    if (!task) return;
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/pairs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair_id: task.pair_id,
          human_preferred_source: form.humanPreferred,
          source_a_would_cite: form.citeA,
          source_b_would_cite: form.citeB,
          selected_risk_tags: form.riskTags,
          reason: form.reason.trim(),
          annotator_session_id: getAnnotatorSessionId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit annotation.");

      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 1500);
      await loadTask();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit annotation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Loading a source pair…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" className="mt-3" onClick={loadTask}>
          Try again
        </Button>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="flex flex-col gap-8">
      {justSubmitted && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          Annotation submitted — loading the next source pair.
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Research task</p>
        <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {task.research_task}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SourceCard label="Source A" source={task.source_a} />
        <SourceCard label="Source B" source={task.source_b} />
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <FormSection title="Which source should an AI agent trust more for this task?">
          <RadioGroup
            value={form.humanPreferred ?? undefined}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, humanPreferred: value as HumanPreference }))
            }
            className="grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {PREFERENCE_OPTIONS.map((opt) => (
              <RadioOption key={opt.value} id={`pref-${opt.value}`} value={opt.value} label={opt.label} />
            ))}
          </RadioGroup>
        </FormSection>

        <FormSection title="Would you allow an AI agent to cite Source A?">
          <RadioGroup
            value={form.citeA ?? undefined}
            onValueChange={(value) => setForm((prev) => ({ ...prev, citeA: value as CiteDecision }))}
            className="grid-cols-3 gap-3"
          >
            {CITE_OPTIONS.map((opt) => (
              <RadioOption key={opt.value} id={`citeA-${opt.value}`} value={opt.value} label={opt.label} />
            ))}
          </RadioGroup>
        </FormSection>

        <FormSection title="Would you allow an AI agent to cite Source B?">
          <RadioGroup
            value={form.citeB ?? undefined}
            onValueChange={(value) => setForm((prev) => ({ ...prev, citeB: value as CiteDecision }))}
            className="grid-cols-3 gap-3"
          >
            {CITE_OPTIONS.map((opt) => (
              <RadioOption key={opt.value} id={`citeB-${opt.value}`} value={opt.value} label={opt.label} />
            ))}
          </RadioGroup>
        </FormSection>

        <FormSection title="Select any risk tags observed">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RISK_TAGS.map((tag) => (
              <label
                key={tag.value}
                htmlFor={`risk-${tag.value}`}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <Checkbox
                  id={`risk-${tag.value}`}
                  checked={form.riskTags.includes(tag.value)}
                  onCheckedChange={() => toggleRiskTag(tag.value)}
                />
                {tag.label}
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection title="One-sentence reason">
          <Textarea
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Explain briefly why you made this call…"
            rows={2}
          />
        </FormSection>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button size="lg" onClick={handleSubmit} disabled={submitting} className="w-fit">
          {submitting ? "Submitting…" : "Submit annotation"}
        </Button>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</Label>
      {children}
    </div>
  );
}

function RadioOption({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="text-sm font-normal text-zinc-700 dark:text-zinc-300">
        {label}
      </Label>
    </div>
  );
}
