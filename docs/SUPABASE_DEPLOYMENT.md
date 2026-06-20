# SourceGuard Finance: Supabase and deployment handoff

## Dataset status

The intended seed dataset is Fin-Fact-derived, blind single-claim tasks. It is not populated in this checkout because no Fin-Fact export is present and the dataset host could not resolve from this environment.

Public task fields: task_id, task_type, research_task, claim, author, posted_date, source, evidence_text, evidence_url, image_url, capsule.

Do not add original Fin-Fact labels, verdicts, justifications, explanations, classifications, visual-bias labels, or issue fields to source_claim_tasks.

## One-time database setup

1. Create a Supabase project.
2. Run supabase/schema.sql in the SQL editor.
3. Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL, and ADMIN_PASSWORD in the deployment host.

The service-role key is server-only. Never use a NEXT_PUBLIC_ prefix for it.

## Generate the seed dataset

From the repository root, run:

    python3 scripts/prepare_finfact_for_terac.py --limit 200

If Hugging Face is unavailable, download an official Fin-Fact export and run:

    python3 scripts/prepare_finfact_for_terac.py --input /path/to/finfact.jsonl --limit 200

This generates sourceguard_terac_tasks.jsonl and .csv for public annotation plus hidden_original_labels.csv for admin-only sanity checks. Never upload, display, or train on the hidden-label file.

## Seed Supabase

With the Supabase secrets exported, run:

    npx tsx scripts/seed_terac_tasks_to_supabase.ts

The seed script upserts only public task fields into source_claim_tasks using task_id as the conflict key. It never reads hidden_original_labels.csv.

## Deploy and verify

1. Deploy the frontend directory as the Next.js app and configure the same environment variables.
2. Visit /annotate and confirm one task loads.
3. Submit an annotation and confirm a row appears in claim_annotations.
4. Use POST /api/terac/prepare with admin authentication to obtain the Terac opportunity payload.

Target Terac setup: SourceGuard Finance Claim Credibility Labeling; general population; 45-90 seconds per item; three labels per task. Only Terac labels in claim_annotations belong in the Terac-track training story.
