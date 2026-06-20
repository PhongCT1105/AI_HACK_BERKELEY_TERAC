# Training from Fin-Fact claim-verification labels

`/api/export` produces one row per fresh Terac annotation joined to its blind
Fin-Fact-derived claim task. It contains task context plus:

```text
task_id, claim, author, posted_date, source, evidence_text, evidence_url,
capsule, human_verdict, would_ai_cite, risk_tags, reason
```

Original Fin-Fact labels and justifications are intentionally absent. Do not
use `data/hidden_original_labels.csv` for this model or evaluation.

## Held-out workflow

1. Group exported rows by `task_id` and create majority labels for
   `human_verdict` and `would_ai_cite`. Keep the task entirely in one split.
2. Split tasks into train and held-out sets before selecting model features or
   hyperparameters.
3. Run the deterministic base claim-citation model on the held-out tasks.
4. Train a claim-citation classifier from the training tasks using public claim
   context, evidence text, source metadata, capsule, and optionally risk tags.
5. Run the trained model on the identical held-out tasks. Report verdict and
   cite/avoid metrics side by side with the base model.

Useful metrics include held-out verdict accuracy or macro-F1, cite/avoid
precision and recall, and citation-decision agreement. Report an improvement
only when both models use the same held-out Terac-label split.

## Optional future: source-pair model

The repository retains a source-pair experiment for later Browserbase work.
That experiment is separate from the current Fin-Fact claim-verification MVP
and must not be mixed into its training or evaluation results.
