# BranchProof AI — Developer Handover

Everything below lives in **this repo** (the `app` folder you already have). Hand your dev
this whole folder (ideally as a git commit / PR), and point them at this file + `BRANCHPROOF.md`.

---

## 1. What this is

BranchProof AI = a multi-branch **compliance & readiness** app built on your QuantumByte template.
It's one app: your **UI** + the **judgment engine**, running on the same server, backed by MongoDB.

The core loop is live end-to-end:
**Publish SOP → branch submits evidence → AI judges it → a failed judgment auto-creates a corrective task → HQ/QA complete it → readiness updates.**

---

## 2. How to run it

```bash
# in the app/ folder
npm install          # or: bun install
cp .env.example .env # if you don't already have .env
#   set MONGODB_URI (Mongo must be running)
#   set QB_SCAFFOLDER_KEY for real LLM judging (optional — see note)
npm run dev
```

Then open the app:
- `/` → pick a role (HQ, QA, Area, Branch)
- `/workspace` → that role's dashboard

On first boot the 4 SOP configs seed automatically, so every role has data immediately.

> **LLM note:** with `QB_SCAFFOLDER_KEY` set, evidence is judged by the LLM adapter
> (`/api/agents/llm`) against the SOP rules. Without it, the engine's deterministic fallback
> still runs the whole flow — good for local dev/demos.

**Please run `npm run typecheck` locally.** The code was verified with an esbuild parse, but the
full TypeScript check and the server were not run in the environment where it was written.

---

## 3. The judgment engine (already in the repo)

Lives at `app/modules/judgment/`. It auto-registers its routes at **`/api/judgment/*`** on the
same Express server as the UI. Data is stored in MongoDB (configs, submissions, issues, tasks, audit).

Key endpoints the UI uses:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/judgment/configs` | list SOP configs |
| GET | `/api/judgment/configs/:id/dashboard` | config + its submissions |
| POST | `/api/judgment/configs/:id/submit` | submit evidence (multipart, field `files`) |
| POST | `/api/judgment/configs/parse` | upload an SOP → AI drafts a config |
| POST | `/api/judgment/configs/direct` | publish a config |
| GET | `/api/judgment/tasks?status=open` | **(added)** list corrective-action tasks |
| POST | `/api/judgment/tasks/:id/complete` | complete a task |
| GET | `/api/judgment/issues?status=open` | **(added)** list issues |
| POST | `/api/judgment/issues/:id/resolve` | resolve an issue |

---

## 4. What was added / changed (the review list)

**New files**
- `app/routes/_index.tsx` — role picker / login
- `app/routes/workspace.tsx` — app shell + data orchestration (loads configs, dashboards, tasks)
- `app/components/bp/screens.tsx` — all screens (Command Center, Evidence Review, SOP Library, Submit Evidence, Corrective Actions, My Submissions)
- `app/lib/bp.tsx` — UI components + helpers (theme-aware)
- `app/lib/judgment.client.ts` — typed client for `/api/judgment/*`
- `app/modules/judgment/src/seeds/branchproof.seed.ts` — seeds the 4 SOP configs on boot
- `BRANCHPROOF.md` — run guide / architecture notes
- `HANDOVER.md` — this file

**Edited existing files**
- `app/tailwind.css` — theme (colours/vars)
- `app/modules/configurables/src/constants/configurables.default.ts` — theme defaults (kept in sync, per the template's rules)
- `app/modules/judgment/src/services/judgment-submission.service.ts` — added `listActionTasks()` / `listIssues()`
- `app/modules/judgment/src/controllers/judgment.controller.ts` — added `getTasks` / `getIssues`
- `app/modules/judgment/src/routes/judgment.routes.ts` — registered the two GET routes

Nothing your dev originally built was removed — the judgment engine, agentic and configurables
modules are intact; the changes are additive.

---

## 5. Conventions to keep

- **Colours flow through the configurables module** (theme-aware Tailwind classes / CSS vars) — the template forbids hardcoded hex in components.
- The UI reads/writes **only** through `app/lib/judgment.client.ts`. Keep new API calls there.
- Screens pull data from the workspace loader via the `Ctx` object — no per-screen fetching.

---

## 6. Design reference (not part of the app)

`branchproof-ai.html` (delivered separately) is the **clickable design prototype** — the source of
truth for look & feel and flows. It's a standalone mockup; the React app is the real product.
