# Using the exported Terac labels

`/api/export` (or `frontend/scripts/export-training.ts`) produces a CSV with
one row per annotation, joined against its source pair's features and the
deterministic machine baseline score. Columns:

```
pair_id, research_task, source_a_id, source_b_id, source_a_url, source_b_url,
source_a_title, source_b_title, source_a_capsule, source_b_capsule,
source_a_features_json, source_b_features_json, machine_preferred_source,
machine_score_a, machine_score_b, human_preferred_source,
source_a_would_cite, source_b_would_cite, selected_risk_tags, reason, created_at
```

`*_features_json` contains the structured fields the baseline scorer used:
`source_type`, `author_transparency`, `citation_quality`, `evidence_quality`,
`commercial_pressure`, `risk_tags`.

## Recommended workflow

1. **Split by `pair_id`, not by row.** Each pair has multiple annotations
   (target: 3 per pair from Terac). Group rows by `pair_id` before splitting
   train/test so the same pair never appears in both sets.

2. **Take the majority vote as the human label.** For each `pair_id`, compute
   the mode of `human_preferred_source` across its annotations. Drop pairs
   without a clear majority among `source_a` / `source_b` (i.e. exclude
   `both_similar` / `neither` from this binary comparison, or model them as a
   separate class if you have enough data).

3. **Compute the baseline accuracy first.**
   ```
   base_human_agreement = mean(majority_human_label == machine_preferred_source)
   ```
   This number is also surfaced live at `/admin/eval` — it's the bar a trained
   model has to beat.

4. **Train a small classifier.**
   - Features: `source_a_features_json` / `source_b_features_json` structured
     fields (one-hot or ordinal encode `source_type`, `author_transparency`,
     `citation_quality`, `evidence_quality`, `commercial_pressure`; multi-hot
     encode `risk_tags`), plus optionally a text embedding of
     `source_a_capsule` / `source_b_capsule`.
   - Label: majority `human_preferred_source` (binary: source_a vs source_b).
   - Model: logistic regression as a baseline; XGBoost if you have enough rows
     to justify it.
   - A natural framing is **pairwise**: feed `features(A) - features(B)` (and
     the reverse pair with flipped label) so the model learns a relative
     preference rather than an absolute score.

5. **Evaluate on the held-out test split.**
   ```
   trained_model_human_agreement = mean(model_prediction == majority_human_label)
   ```
   Compare directly against `base_human_agreement` from step 3. Report both
   numbers together — improvement is only meaningful relative to the baseline,
   on the same held-out pairs.

## Caveats

- The seeded dataset is intentionally lopsided (clear official/SEC sources vs.
  clear promotional/hype sources) so the baseline scorer and early annotators
  have unambiguous signal. Expect the trained model's real advantage to show
  up once more ambiguous, real-world source pairs are added.
- Don't claim an improvement without this held-out comparison — see
  `AGENTS.md`.
