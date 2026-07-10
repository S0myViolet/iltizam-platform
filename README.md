# Iltzam — Compliance platform

Iltzam helps companies understand, assess and manage privacy-compliance obligations —
starting with **Egypt's PDPL** (Law 151/2020 + Executive Regulations 816/2025) and
**EU GDPR** — without reading legal text. Organizations answer plain-language yes/no
controls, get deterministic readiness scores, see a prioritised gap register, assign
owners, attach and **review** evidence, run an automated monitoring demonstration
against a connector, and export the entire backend as a 22-sheet Excel workbook.

> This tool helps organise compliance work and identify potential gaps. It does not
> replace legal advice. Final legal interpretation should be reviewed by qualified counsel.

## What's inside

- **Two separate control libraries** (never merged): Egypt PDPL — 85 controls
  (64 legally mandatory, 21 important) across 14 domains with per-control legal
  bases; EU GDPR — 64 controls across 14 domains.
- **Multi-tenant**: organizations, users, role-based memberships
  (client_admin, compliance_manager, control_owner, reviewer, viewer) plus a
  platform administrator. Tenancy is enforced server-side; cross-tenant access
  returns **404**, never data.
- **Deterministic engines**: answer readiness (the official score), evidence
  readiness (counts **accepted** evidence only), per-domain and per-regulation
  scores, five-tier gap prioritisation. Same input ⇒ same output; no AI in any
  scoring or decision path.
- **Evidence review workflow**: unreviewed → accepted / rejected / expired /
  needs update, performed by humans with the `evidence.review` permission.
- **Automated monitoring (demonstration)**: a demo connector with 18 fictional
  resources, 12 versioned deterministic rules, and a staged scan pipeline that
  persists resources, inventory, findings and control mappings. Findings default
  to **"new" and require human review** — they never change official scores.
- **Comprehensive audit trail** with origins: `human`, `automated_rule`,
  `system_job` (an `optional_ai` origin exists but no AI feature is enabled).
- **Platform-admin surfaces**: Backend operations (scan trigger with live stage
  stepper, before/after score proof, reset, export) and a read-only Data
  explorer over 21 datasets (secrets are never rendered).
- **22-sheet Excel export** of the full backend (no credentials, tokens or keys).

See **docs/backend-demo.md** for the operator guide and the five-minute
stakeholder demonstration script.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma 6** + **PostgreSQL** (Neon or any hosted Postgres; Vercel-ready)
- **Vercel Blob** for evidence uploads in production (local disk in dev)
- **Tailwind CSS 4** · **exceljs** · **Vitest**

## Getting started

```bash
npm install
cp .env.example .env     # point DATABASE_URL / DIRECT_URL at a Postgres
npx prisma migrate dev   # creates the schema
npx prisma db seed       # regulations, both control libraries, rules, demo org
npm run dev              # http://localhost:4040
```

Sign in at `/signin` as any seeded demonstration user — e.g.
`salma.fawzy@niledigital.example` (client admin of **Nile Digital Services**),
`nour.elsayed@niledigital.example` (reviewer), or
`platform.admin@iltzam.example` (platform administrator). This is demo-grade
authentication (signed session cookie, no passwords) designed to be swapped
for a real identity provider.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (port 4040) |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest unit tests (scoring, gaps, both libraries, monitoring, permissions) |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run lint` | ESLint |
| `npm run verify:demo` | End-to-end verification against a running server (60 checks) |
| `npm run db:seed` | Re-seed (idempotent upserts; fails loudly if library counts drift) |
| `npm run db:reset` | Drop + re-migrate + re-seed the database |

## How it's put together

```
src/
  data/controls.ts          ← GDPR library: 64 controls (seed source of truth)
  data/pdpl-controls.ts     ← Egypt PDPL library: 85 controls, legal bases, 14 domains
  data/monitoring-rules.ts  ← 12 versioned deterministic monitoring rules
  data/demo.ts              ← demo org, 8 users, connector, 18 resources, answer plan
  lib/types.ts              ← vocabulary + ROLE_PERMISSIONS (server-side authority)
  lib/auth.ts               ← session, tenancy (404 on cross-tenant), permissions
  lib/scoring.ts            ← pure score math (answer + accepted-evidence readiness)
  lib/gaps.ts               ← pure gap prioritisation (5 tiers, reasons, alerts)
  lib/monitoring.ts         ← pure rule evaluator (all/any condition trees)
  lib/scan.ts               ← staged demonstration scan pipeline (all persisted)
  lib/seeding.ts            ← idempotent seeders + loud count verification
  lib/excel.ts              ← 22-sheet workbook builder (uses the central engines)
  lib/explorer.ts           ← data-explorer registry (21 datasets, sanitized)
  lib/assessments.ts        ← assessment service layer
  lib/audit.ts / reset.ts / connectors.ts / storage.ts
  app/                      ← pages + API route handlers
prisma/schema.prisma        ← full multi-tenant model (see docs/backend-demo.md)
scripts/verify-demo.ts      ← end-to-end verification walkthrough
```

### Scoring, in one paragraph

`Yes` = compliant · `No` = gap · `Not answered` = incomplete · `Not applicable` =
excluded from every denominator. The **official readiness score** is the percentage
of applicable controls answered Yes — it moves only when a human changes an answer.
**Evidence readiness** counts a control only when its Yes is backed by at least one
piece of **accepted** evidence, so accepting or rejecting evidence moves it
deterministically. Automated findings never touch either number until a human
confirms them and acts on the underlying control.

## Control library provenance

GDPR seed data comes from the *Iltzam Control Library* (64 questions, exact wording,
severity and regimes preserved) cross-referenced with the *GDPR → Control Framework*
document. Egypt PDPL seed data comes from the *Egypt PDPL Law and Controls* document
(85 questions verbatim, per-control citations of Law 151/2020 articles and Executive
Regulations). The five Impact-Assessment controls are marked **provisional** pending
confirmation in final ER guidance, and are flagged in the data model, UI and exports.
