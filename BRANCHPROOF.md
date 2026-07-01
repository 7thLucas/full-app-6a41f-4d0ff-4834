# BranchProof AI — UI built on the QuantumByte Judgment Engine

The BranchProof front-end now lives inside this template and is wired to the real
`@qb/judgment` API. No mock data — every screen reads/writes the engine.

## What was added

| File | Purpose |
| --- | --- |
| `app/routes/_index.tsx` | Role picker / login (HQ, QA, Area, Branch). Stores role in `localStorage`, routes to `/workspace`. |
| `app/routes/workspace.tsx` | App shell (sidebar + topbar, role-aware nav, branch switcher, Switch Role) + data orchestration. Loads configs + dashboards from the engine. |
| `app/components/bp/screens.tsx` | The screens: Command Center, Evidence Review, SOP Library, Submit Evidence, Corrective Actions, My Submissions. |
| `app/lib/judgment.client.ts` | Typed client for `/api/judgment/*` (configs, dashboard, submit, parse, create, complete, resolve). |
| `app/lib/bp.tsx` | Roles, verdict/severity → CSS-var color helpers, and shared UI atoms (Card, Badge, Btn, Stat, Ring, Bar). |
| `app/modules/judgment/src/seeds/branchproof.seed.ts` | Seeds 4 SOP configs on boot (handwashing, fridge temperature log, closing checklist, promo display) — idempotent. |
| `app/tailwind.css` + `configurables.default.ts` | Brand theme set to indigo primary + teal accent (via the configurables module, kept in sync per R5). |

## How the mapping works

- **Judgment config** = an SOP / evidence program (rules + criteria + input/output schema).
- **Submission** = a branch evidence upload. The engine returns the verdict
  (`pass/partial/fail/risk/ready/not_ready`), score, confidence, severity, reason and fix suggestion.
- **Branch / Store** = `inputData.branch`, injected automatically from the topbar branch picker.
- **Corrective actions** = submissions whose verdict isn't `pass`/`ready`, surfaced with the AI fix suggestion.

## Run it locally

```bash
# 1. install deps (use bun or npm — a bun.lock and package-lock.json are present)
npm install        # or: bun install

# 2. make sure MongoDB is running and .env has MONGODB_URI
#    (copy .env.example -> .env if needed)

# 3. start the dev server
npm run dev
```

Then open the app:
- `/` → pick a workspace (role)
- `/workspace` → the role's dashboard

On first boot the 4 SOP configs are seeded automatically, so every role has data immediately.

### About the AI judgment
- With `QB_SCAFFOLDER_KEY` set, evidence is evaluated by the LLM adapter at `/api/agents/llm`
  (it reads the actual uploaded files against the SOP rules).
- Without the key, the engine falls back to a deterministic keyword check, so the full
  loop (submit → verdict → corrective action) still works end-to-end for demos.

## Notes
- Colors flow through the `configurables` brandColor / CSS variables (no hardcoded hex in components),
  so the theme can still be re-skinned from the portal.
- This sandbox couldn't run `tsc`/MongoDB, so please run `npm run typecheck` and `npm run dev`
  locally; all new files pass an esbuild parse check.
