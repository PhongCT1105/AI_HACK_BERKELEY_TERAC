# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project
Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui) app in `frontend/`. No separate
backend — all server logic lives in Next.js API routes under `frontend/src/app/api/` and talks
directly to Supabase. Deploys as a single Vercel (or Render Node) service with no extra
backend hosting cost.

## Conventions
- **Frontend**: App Router under `frontend/src/app/`. UI components via shadcn/ui in
  `src/components/ui/`. Add components with `npx shadcn@latest add <name>` (or the `shadcn` MCP).
  Import alias is `@/*`.
- **API/data**: Route handlers in `frontend/src/app/api/` use `getSupabaseAdmin()`
  (`frontend/src/lib/supabase/server.ts`, service-role key) for privileged reads/writes. Schema
  and migrations live in `supabase/`.
- **Secrets**: never commit `.env` / `.env.local`. Templates are the `.example` files.

## MCP & skills
- `.mcp.json` defines the `shadcn` and `magic` (21st.dev) MCP servers. Magic needs
  `MAGIC_21ST_API_KEY` in the root `.env`.
- Skills in `.claude/skills/` auto-activate. Lean on `frontend-design` / `ui-ux-pro-max` for UI,
  `senior-backend` / `api-design-reviewer` for API work, `claude-api` for Anthropic integration.

## Commands
- Frontend dev: `cd frontend && npm run dev`
- Frontend lint/build: `npm run lint` / `npm run build`
