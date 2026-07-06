# Iltzam — Compliance self-assessment platform

Iltzam helps companies understand, assess and manage privacy-compliance obligations —
starting with **Egypt's PDPL** and **EU GDPR** — without reading legal text. Companies
answer 64 plain-language yes/no controls grouped into 14 areas, get a readiness score,
see a prioritised gap report, assign owners, attach evidence, and export an audit-style
report.

> This tool helps organise compliance work and identify potential gaps. It does not
> replace legal advice. Final legal interpretation should be reviewed by qualified counsel.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma 6** + **SQLite** (file database, swappable for Postgres later)
- **Tailwind CSS 4**
- **Vitest** for unit tests

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies migrations
npx prisma db seed       # loads the 64-control library + regulations
npm run dev              # http://localhost:4040
```

`.env` needs `DATABASE_URL="file:./dev.db"` (see `.env.example`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest unit tests (scoring, gap priority, seed integrity) |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run lint` | ESLint |
| `npm run db:seed` | Re-seed the control library (idempotent upserts) |
| `npm run db:reset` | Drop + re-migrate + re-seed the database |

## How it's put together

```
src/
  data/controls.ts        ← the 64-control library (seed source of truth)
  lib/types.ts            ← enum-like vocabulary (answers, severities, statuses)
  lib/scoring.ts          ← pure readiness-score math (answer- & evidence-based modes)
  lib/gaps.ts             ← pure gap prioritisation (5 tiers)
  lib/csv.ts              ← audit CSV builder
  lib/assessments.ts      ← service layer (only module that queries the DB for pages)
  lib/storage.ts          ← evidence file storage (local disk; swap point for S3)
  app/                    ← pages + API route handlers
prisma/
  schema.prisma           ← Regulation ⇄ Control crosswalk, Assessment, Answer, Evidence
  seed.ts                 ← idempotent seed script
```

### Data model in one paragraph

A versioned **Regulation** layer (EU-GDPR 2016/679 in force, EG-PDPL provisional) maps
onto a law-agnostic **Control** library through a crosswalk table — one control, many
laws, so new regulations or amended versions (e.g. the Digital Omnibus) are added by
remapping, not rewriting. Each company **Assessment** instantiates a **ControlAnswer**
per applicable control (answer, owner, notes, due date, remediation status), and each
answer holds **Evidence** (links or uploaded files).

### Scoring

`Yes` = compliant · `No` = gap · `Not answered` = incomplete · `Not applicable` =
excluded from the denominator. Scores are % of applicable controls compliant, overall
and split by severity and by domain. The MVP scores on answers; evidence-based scoring
(`Yes` **and** evidence attached) is already implemented behind a mode flag in
`lib/scoring.ts`.

### Gap priority

1. Legally mandatory answered **No**
2. Legally mandatory **not answered**
3. Important answered **No**
4. Important **not answered**
5. Answered **Yes** but expected evidence missing

## Control library provenance

Seed data comes from the *Iltzam Control Library* document (64 questions, exact
wording, severity and regimes preserved) cross-referenced with the *GDPR → Control
Framework* document (control codes, GDPR article citations, evidence artifacts).
PDPL mappings are provisional pending legal confirmation, and are flagged as such in
the data model and UI.
