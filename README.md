# Captain America Finance: Fin-Fact Claim Verification

Captain America is a Terac annotation MVP for financial claim credibility. The
primary flow is a blind, single-claim verification task:

1. Start with Fin-Fact financial misinformation examples.
2. Keep the original labels and justifications in the local, admin-only
   `data/hidden_original_labels.csv` file.
3. Publish only unlabeled claim tasks to `source_claim_tasks`.
4. Send annotators to `/annotate` through the Terac opportunity.
5. Store fresh labels in `claim_annotations`: verdict, AI citation decision,
   risk tags, and a reason.
6. Export the joined task-and-label CSV and evaluate a base and Terac-trained
   claim-citation model on the same held-out task split.

Do not seed, show, export, or train on the original Fin-Fact labels.

## Primary routes

- `/annotate` loads one least-labeled `source_claim_tasks` record through
  `GET /api/task` and writes to `claim_annotations` through `POST /api/submit`.
- `/admin` shows Fin-Fact task coverage, fresh Terac label counts, verdict and
  citation distributions, and current majority labels.
- `/api/export?password=<ADMIN_PASSWORD>` exports each claim task joined to
  every Terac annotation.
- `POST /api/terac/prepare` returns the claim-verification opportunity payload.

`/api/claim-task` and `/api/claim-submit` remain compatibility aliases for the
same primary API.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, and `NEXT_PUBLIC_APP_URL` in
`frontend/.env.local`. Run [supabase/schema.sql](supabase/schema.sql) in the
Supabase SQL editor before seeding.

## Prepare and seed Fin-Fact tasks

```bash
python3 scripts/prepare_finfact_for_terac.py --input /tmp/Fin-Fact/finfact.json --limit 200
npx tsx scripts/seed_terac_tasks_to_supabase.ts
```

The seed script loads `frontend/.env.local` when present and upserts only the
public task fields. See [docs/SUPABASE_DEPLOYMENT.md](docs/SUPABASE_DEPLOYMENT.md)
for details and [docs/TERAC_LAUNCH.md](docs/TERAC_LAUNCH.md) for the Terac
opportunity setup.

## Held-out evaluation

Use `/api/export` after collecting fresh Terac labels. Group labels by
`task_id`, take majority labels, split tasks before model selection, and compare
the base model with the Terac-trained model on the same held-out split. Do not
claim improvement until that comparison exists. See [ml/README.md](ml/README.md).

## Optional future: source-pair and Browserbase flow

`/annotate/pairs`, `source_pairs`, and the related pair APIs are retained as an
optional future Browserbase-oriented source comparison experiment. They are not
part of the current Fin-Fact Terac MVP, seed flow, admin dashboard, export, or
evaluation claim.
