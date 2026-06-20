# SourceGuard Labeling Arena

A Vercel-deployable annotation platform for Terac annotators to label source
credibility for an AI agent (SourceGuard — a credibility firewall for AI
agents, focused on finance / investment / crypto sources first).

Two annotation flows live side by side in the same app:

- **`/annotate/pairs`** — compare two candidate sources for one research
  task and decide which one an AI agent should trust/cite. This is the
  flow described below and the one wired into `/admin`, `/admin/seed`,
  `/admin/eval`, and `/api/export`.
- **`/annotate`** — single-claim credibility labeling (judge one financial
  claim/source at a time). See its own routes (`/api/claim-task`,
  `/api/claim-submit`) and `docs/TERAC_LAUNCH.md`.

## Layout

```
AI_Hack_Berkeley/
├── frontend/                         # Next.js 16 (App Router, TS, Tailwind v4, shadcn/ui)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # landing page
│       │   ├── annotate/             # single-claim flow (page.tsx + pairs/ subflow)
│       │   │   └── pairs/            # source-pair comparison flow
│       │   ├── admin/                # password-gated dashboard, /seed, /eval
│       │   └── api/
│       │       ├── task/ submit/ results/ export/ seed/   # source-pair API
│       │       ├── claim-task/ claim-submit/               # single-claim API
│       │       └── terac/prepare(-pairs)/                  # Terac launch payloads
│       ├── components/ui/            # shadcn components
│       └── lib/                      # types, scoring baseline, seed data, supabase client
├── supabase/schema.sql               # source_pairs/annotations + source_claim_tasks/claim_annotations
├── ml/README.md                      # how to use the CSV export to train/evaluate a model
├── docs/TERAC_LAUNCH.md              # Terac launch guide (single-claim flow)
├── docs/TERAC_LAUNCH_PAIRS.md        # Terac launch guide (source-pair flow)
└── backend/                          # FastAPI scaffold (unused by this app; kept from starter)
```

## Run it

```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase + ADMIN_PASSWORD
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Deploying

1. **Create a Supabase project.**
2. **Run the schema**: paste `supabase/schema.sql` into the Supabase SQL
   editor (or `supabase db push`).
3. **Add environment variables** to Vercel (and `frontend/.env.local` for
   local dev):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ADMIN_PASSWORD=
   NEXT_PUBLIC_APP_URL=
   ```
   The service role key is server-only — it's read by API routes via
   `frontend/src/lib/supabase/server.ts` and never sent to the browser.
4. **Deploy** the `frontend/` directory as the Next.js project root on
   Vercel.
5. **Seed data**: visit `/admin/seed` (enter the admin password) and click
   "Seed sample data" — inserts ~34 placeholder finance/crypto source pairs.
6. **Send the annotation URL to Terac**: `https://<deployment>/annotate/pairs`
   for the source-pair flow (see `docs/TERAC_LAUNCH_PAIRS.md`), or
   `https://<deployment>/annotate` for the single-claim flow (see
   `docs/TERAC_LAUNCH.md`).
7. **Export labels**: `/admin` → "Export CSV", or
   `GET /api/export?password=<ADMIN_PASSWORD>`.

## Admin dashboard

`/admin` (password-gated via `ADMIN_PASSWORD`, as a form or `?password=`
query param) shows total source pairs, total annotations, annotations per
pair, human-preferred-source distribution, cite yes/no/caution counts, and
machine-vs-human agreement. `/admin/eval` isolates the
`base_human_agreement` metric (heuristic baseline vs. human majority vote)
with instructions for comparing a future trained model against it.

## Machine baseline

`frontend/src/lib/scoring.ts` implements the deterministic scorer used to
pre-score every seeded source pair (start at 50; ±weights for source type,
author transparency, citation/evidence quality, promotional language,
unsupported price predictions, affiliate pressure, missing author, weak
citations; clamped 0–100). Annotators never see this score or the machine's
preferred source — `/api/task` strips it before responding — so human labels
stay unbiased. It's only shown in `/admin`.

## Agent knowledge (background context)

The project originated from **AgentShield**, a credibility layer agents call
before using a web source. See [AGENTS.md](AGENTS.md) and the
[AgentShield knowledge base](docs/agent-knowledge.md) for the MVP definition,
API contract, and demo constraints that informed this build.

## Claude Code integration

### MCP servers (`.mcp.json`)
| Server | Purpose | Needs key? |
|--------|---------|-----------|
| `shadcn` | Browse/install shadcn/ui components via the registry | No |
| `magic`  | 21st.dev Magic — generate UI components from prompts (`/ui ...`) | Yes — set `MAGIC_21ST_API_KEY` |

To enable Magic: copy `.env.example` → `.env`, add your key from
https://21st.dev/magic/console, then restart Claude Code and run `/mcp`.

### Terac MCP
```bash
claude mcp add --transport http terac https://terac.com/api/mcp
```
Run `/mcp` to authenticate. See `docs/TERAC_LAUNCH_PAIRS.md` /
`docs/TERAC_LAUNCH.md` for the full launch flow (quote → review → launch).
