# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project
Fullstack hackathon starter. Frontend: Next.js 16 (App Router, TypeScript, Tailwind v4,
shadcn/ui) in `frontend/`. Backend: FastAPI in `backend/` (venv at `backend/.venv`).
No product logic yet — the idea is still TBD.

## Conventions
- **Frontend**: App Router under `frontend/src/app/`. UI components via shadcn/ui in
  `src/components/ui/`. Add components with `npx shadcn@latest add <name>` (or the `shadcn` MCP).
  Import alias is `@/*`.
- **Backend**: Add routers under `backend/app/api/` and mount them in `app/main.py`. Pydantic
  schemas in `app/schemas/`, models in `app/models/`, business logic in `app/services/`.
  Settings come from `app/core/config.py` (reads `.env`). Run with the venv's interpreter.
- **Secrets**: never commit `.env` / `.env.local`. Templates are the `.example` files.

## MCP & skills
- `.mcp.json` defines the `shadcn` and `magic` (21st.dev) MCP servers. Magic needs
  `MAGIC_21ST_API_KEY` in the root `.env`.
- Skills in `.claude/skills/` auto-activate. Lean on `frontend-design` / `ui-ux-pro-max` for UI,
  `senior-backend` / `api-design-reviewer` for API work, `claude-api` for Anthropic integration.

## Commands
- Backend dev: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`
- Frontend dev: `cd frontend && npm run dev`
- Frontend lint/build: `npm run lint` / `npm run build`
