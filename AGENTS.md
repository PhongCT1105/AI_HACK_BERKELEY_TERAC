# AgentShield project knowledge

Read [docs/agent-knowledge.md](docs/agent-knowledge.md) before making product, model, API, demo, or sponsor-integration decisions. It is the project's authoritative working brief distilled from the hackathon materials.

## Operating rules

- Keep the MVP API-first: the UI is a client of `POST /api/score-source`.
- Protect the vertical slice first: URL + task -> trace/fixture -> score -> Credibility Capsule -> UI.
- Prefer deterministic extraction and saved fixtures over open-ended browser behavior. Live integrations must retain a fixture fallback.
- Do not claim model improvement without a held-out comparison against Terac-collected labels.
- Never invent evaluation results, sponsor usage, trace IDs, or source facts.

## Next.js note

This repo pins a Next.js version with breaking changes vs. older training data —
APIs, conventions, and file structure may differ. Check `node_modules/next/dist/docs/`
and heed deprecation notices before writing App Router code.
