# Iltzam — Local demonstration guide

How to run the complete product locally and demonstrate the monitoring
backend end to end. Everything below runs on your machine; no cloud
deployment is involved.

## 1. Start it

```bash
npm install
cp .env.example .env        # point DATABASE_URL / DIRECT_URL at a Postgres
npx prisma migrate dev      # creates the schema
npx prisma db seed          # regulations, controls, rules, demo org + DATA VAULT
npm run dev                 # → http://localhost:4040
```

The seed generates the **Nile Digital Services Demo Data Vault** on disk at
`demo-data/nile-digital-services/` — 18 real files (XLSX, CSV, JSON, text,
about 1,700 synthetic records) plus `manifest.json` describing each file's
context (owner, sharing, retention, transfers, evidence links). All of it is
fictional and deterministic: the same seed always produces the same bytes.

## 2. The journey

| Route | What it is |
|---|---|
| `/` | Public opening website (loads before any authentication) |
| `/platform` | Public product explanation — where the landing CTAs point |
| `/sign-in`, `/sign-up` | Email + password authentication (no third-party providers) |
| `/app` | Authenticated client application (assessments home) |
| `/admin/backend-operations` | Admin console: company context, scan, monitoring, inject, reset, export |
| `/admin/monitored-data` | Every scanned source file with context, filters, and masked row previews |
| `/admin/synchronization-runs` | Persisted scan history with change detection per run |
| `/monitoring` | Findings board (matched values, lineage, human review) |
| `/admin/data-explorer` | Read-only registers of every persisted backend table |

## 3. Who signs in

Email + password. In local/demo mode the sign-in page lists the seeded
accounts and the shared demo password (default `iltzam-demo`, override with
`DEMO_USER_PASSWORD`). The platform administrator comes from
`DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` (default
`platform.admin@iltzam.example` / `iltzam-demo`). Anyone can also create a
fresh workspace at `/sign-up`. Roles are enforced server-side: client_admin,
compliance_manager, control_owner, reviewer, viewer, plus the platform
administrator.

## 4. What the scan actually does

`Run scan now` (Backend operations) opens a preflight stating exactly what
will be scanned — company, source, 18 files, estimated records, 12 rules —
then the backend really does the work: reads the manifest, checksums every
file (bytes + manifest context), parses XLSX/CSV/JSON/text server-side,
counts rows, normalizes each file into a `ConnectorResource` + inventory
entry, evaluates the 12 fixed **MON-*** rules (MON-ACCESS-001,
MON-SENSITIVE-001, MON-SECURITY-001, MON-TRANSFER-001, MON-RETENTION-001/002,
MON-OWNER-001, MON-MARKETING-001, MON-LICENCE-001, MON-PROCESSOR-001,
MON-RIGHTS-001, MON-EVIDENCE-001), creates findings with the **exact matched
source values**, maps them to PDPL controls, flags evidence candidates, and
audits every step. A fresh vault yields **23 findings (12 risk + 11 evidence
candidates) and 18 control mappings**; ~1,685 records are inspected.

Every finding defaults to **new** — "Automated finding requiring human
review." — and the per-run before/after snapshot proves the official
readiness score does not move until a human confirms something. Findings
whose condition disappears from the data are auto-resolved **only if no
human ever touched them**; reviewed findings stay for the reviewer.

## 5. Active monitoring and Inject Demo Change

- **Start monitoring** re-scans on a fixed interval (30–300s; a 5-second
  ticker checks `nextSyncAt` in the database, so state survives restarts via
  the instrumentation hook). The status shown is always the truth: Active or
  Paused, with last and next scan times.
- **Inject demo change** (platform admin) mutates the *actual* files or
  manifest — mark Employees.xlsx public, add a cross-border vendor row, add
  unconsented leads, make retention overdue, remove an owner, drop in new
  training or licence evidence files. It never creates findings itself; the
  next scan detects the change (checksum diff → new/changed/removed lists on
  the run) and the rules react.

## 6. Data preview, lineage, exports, reset

- **Monitored data** shows each scanned file's parsed row count and manifest
  context; the drawer previews the first 8 rows **masked by default**
  ("Reveal synthetic demo data" is platform-admin-only and audit-logged).
- **Finding detail** (Monitoring) shows the rule, its JSON condition, the
  matched source values, mapped controls with legal bases, and the full
  lineage: vault → file discovered → rows parsed → resource normalized →
  rule evaluated → condition matched → finding created → controls mapped →
  human review status → score impact held → audit events.
- **Export monitoring workbook** downloads a 26-sheet XLSX containing the
  raw synthetic datasets the scan read (10 "Raw Demo" sheets), source
  systems/files with checksums, inventory, rules, findings + matched values,
  mappings, evidence candidates + confirmed evidence, run history, changed
  resources, gap register, domain/regulation scores, and the audit log. No
  secrets, ever. Raw data sheets are only populated for the flagged demo
  organization.
- **Reset demonstration** (platform admin) regenerates the vault
  byte-for-byte, clears scan artefacts and findings, restores the seeded
  assessment, stops monitoring, and preserves the audit trail.

## 7. Five-minute demonstration script

1. Open `http://localhost:4040` — the public site. Point at the stat strip:
   **85 Egypt PDPL controls — 64 legally mandatory, 21 important, 14
   domains** — and the monitoring pipeline with the human at the decision.
2. Click **Begin your readiness review** → `/platform`, then **Sign in**.
   Use `platform.admin@iltzam.example` / `iltzam-demo`.
3. You land on **Backend operations**: "You are monitoring Nile Digital
   Services." — 18 files, ~1,685 records, Egypt, 12 rules.
4. Click **Run scan now** → read the preflight aloud → confirm. The 12-stage
   pipeline completes in about a second with real counters; scroll to the
   before/after table: official readiness identical, 23 findings awaiting
   review.
5. Open **View monitored data** → click `Biometric_Access_Records.xlsx` →
   show the manifest context and the masked preview; reveal once to prove
   the rows are real.
6. Open **View findings** → open the unencrypted-payroll finding → show the
   matched source values and the lineage trace. Confirm it as a reviewer if
   time allows.
7. Back on Backend operations: **Inject change → "Mark Employees.xlsx as
   publicly shared"**, then **Run scan now** again — the results panel shows
   `Employees.xlsx` under *changed* and a new MON-ACCESS-001 finding.
8. Click **Export monitoring workbook** and open it: 26 sheets, including
   the raw employee spreadsheet the scan just read.
9. Finish with **Reset demonstration** — everything returns to the seeded
   state; the audit trail keeps the whole story.

## 8. Verification

`npm run verify:demo` (server running) executes 67 end-to-end checks over
this exact journey — public routes, safe auth failures, tenancy walls, real
file/row counts, dedup, change detection, auto-resolve, scheduler, masked
preview, workbook contents, reset. `npm test` covers the engines (unit
tests), `npm run lint` / `npm run typecheck` / `npm run build` complete the
gates.

---

Iltzam organises compliance work and identifies potential gaps. It does not
replace legal advice; final legal interpretation should be reviewed by
qualified counsel.
