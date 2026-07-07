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
- **Prisma 6** + **PostgreSQL** (Neon or any hosted Postgres; Vercel-ready)
- **Vercel Blob** for evidence uploads in production (local disk in dev)
- **Tailwind CSS 4**
- **Vitest** for unit tests

## Getting started

```bash
npm install
cp .env.example .env     # then point DATABASE_URL / DIRECT_URL at a Postgres
npx prisma migrate dev   # creates the schema
npx prisma db seed       # loads the 64-control library + regulations
npm run dev              # http://localhost:4040
```

Any Postgres works for development — a free [Neon](https://neon.tech) database
is the quickest, or a local install. To deploy on Vercel, see **DEPLOY.md**.

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
  lib/storage.ts          ← evidence storage (Vercel Blob in prod, local disk in dev)
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

Two first-class regulation libraries, each seeded verbatim from its source document:

- **EU-GDPR — 64 controls** (54 legally mandatory / 10 important) from the *Iltzam
  Control Library* document, cross-referenced with the *GDPR → Control Framework*
  document (control codes, GDPR article citations, evidence artifacts).
- **EG-PDPL — 85 controls** (64 legally mandatory / 21 important) from the *Egypt
  PDPL Law and Controls* document: Law No. 151 of 2020 + Executive Regulations
  816/2025, regulator PDPC, compliance deadline 1 November 2026. Question wording,
  severity, domains and PDPL bases are preserved exactly; the Impact Assessments
  domain is provisional pending confirmation in the Executive Regulations, and the
  library as a whole awaits counsel sign-off before client-facing use.

Assessments select either regulation or both; combined reviews carry both control
sets with per-regulation readiness, filters, and report sections. Cross-law overlap
is expressed through crosswalk mapping rows (exact / similar / partial /
egypt_specific / gdpr_specific / provisional), not by merging controls.
