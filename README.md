# AIHackBerk

Fullstack hackathon starter — **Next.js** frontend + **Python (FastAPI)** backend, pre-wired
with a curated set of **Claude Code skills** and **MCP servers**. No app logic yet; this is the
scaffold to build on once you pick an idea.

## Layout

```
AIHackBerk/
├── frontend/              # Next.js 16 (App Router, TS, Tailwind v4, shadcn/ui)
│   ├── src/app/           # routes
│   ├── src/components/ui/ # shadcn components (button installed)
│   └── src/lib/utils.ts
├── backend/               # FastAPI
│   ├── app/main.py        # entrypoint (/ and /api/health)
│   ├── app/core/config.py # settings (.env-driven)
│   ├── app/{api,models,schemas,services}/
│   ├── .venv/             # virtualenv (deps installed)
│   └── requirements.txt
├── .mcp.json              # MCP servers: shadcn + 21st-dev Magic
├── .env.example           # MAGIC_21ST_API_KEY for the Magic MCP
└── .claude/
    ├── skills/            # 20 installed Claude skills (auto-activated)
    └── skill-sources/     # full upstream repos kept for reference
```

## Run it

**Backend** (http://localhost:8000, docs at `/docs`):
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:3000):
```bash
cd frontend
cp .env.local.example .env.local
npm run dev
```

## Claude Code integration

### MCP servers (`.mcp.json`)
| Server | Purpose | Needs key? |
|--------|---------|-----------|
| `shadcn` | Browse/install shadcn/ui components via the registry | No |
| `magic`  | 21st.dev Magic — generate UI components from prompts (`/ui ...`) | Yes — set `MAGIC_21ST_API_KEY` |

To enable Magic: copy `.env.example` → `.env`, add your key from
https://21st.dev/magic/console, then restart Claude Code and run `/mcp` to confirm both are live.

### Skills (`.claude/skills/`)
Auto-activate when relevant. Installed (20):

- **Frontend / design** — `frontend-design`, `ui-ux-pro-max`, `design`, `design-system`,
  `ui-styling`, `brand`, `brand-guidelines`, `theme-factory`, `canvas-design`,
  `web-artifacts-builder`
- **Backend / data** — `senior-backend`, `api-design-reviewer`, `api-test-suite-builder`,
  `database-schema-designer`, `sql-database-assistant`, `secrets-vault-manager`
- **AI / tooling** — `claude-api`, `mcp-builder`, `skill-creator`, `webapp-testing`

Sources: [anthropics/skills](https://github.com/anthropics/skills),
[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
[alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills).

## Next steps
Pick an idea, then build features into `frontend/src/app/` and `backend/app/api/`. The skills and
MCP servers above will assist automatically.
