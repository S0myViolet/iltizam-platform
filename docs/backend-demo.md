# Iltzam backend demonstration — operator guide

This guide takes an operator from a clean machine to a running, seeded
Iltzam instance and through the full backend demonstration: the automated
scan pipeline, human review of findings and evidence, data inspection, the
Excel export, and the reset. Everything described here is what the code
actually does — the demonstration is database-backed end to end, with no
client-side simulation.

> Automation guardrail, stated once and honoured everywhere: automated scans
> and rules-based checks produce **potential findings**. A potential finding
> is a **finding awaiting review** until a human confirms it. Nothing
> automated ever changes the official compliance position on its own, and
> every score shown is a **deterministic score** computed from reviewed
> inputs.

---

## 1. System requirements

- **Node.js 20 or later** (the project is typed against `@types/node` 20;
  Node 20 LTS or 22 both work).
- **PostgreSQL 14 or later** — local, Docker, or hosted (Neon works well;
  see `DEPLOY.md` for hosted setup). Prisma 6 is the only database client.
- npm (bundled with Node). `npm install` runs `prisma generate`
  automatically via the `postinstall` script.

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection used by the app at runtime (use your provider's **pooled** string on serverless). |
| `DIRECT_URL` | Yes | **Direct/unpooled** connection used by Prisma Migrate; locally this can be identical to `DATABASE_URL`. |
| `SESSION_SECRET` | Production | HMAC-SHA256 key that signs the session cookie; without it a development fallback is used — set a real value anywhere that matters. |
| `ENABLE_DEMO_TOOLS` | Production demos | Set to `true` to enable the demonstration tools (scan, reset, Backend operations, Data explorer) in a production build. When `NODE_ENV` is not `production` (e.g. `npm run dev`), demo tools are enabled regardless. |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob token for evidence **file** uploads in production. When unset, uploaded files fall back to local disk under `./uploads`; evidence links always work. |

## 3. Install, migrate, seed, start

```bash
npm install
npx prisma migrate dev     # creates the schema
npx prisma db seed         # loads regulations, control libraries, rules, demo org
npm run dev                # http://localhost:4040
```

The seed (`prisma/seed.ts` → `src/lib/seeding.ts`) is **idempotent** — safe
to re-run — and ends with a **loud verification** that throws
`SEED VERIFICATION FAILED` if the loaded libraries drift from the source
documents. On success it prints `Seed verification passed:` with counts.
The verified expectations are:

- Egypt PDPL: **85** controls, **64** legally mandatory, **21** important,
  across **14** domains (plus 5 provisional controls — the Impact
  Assessments domain, whose DPIA duty derives from the Executive
  Regulations rather than the Law itself).
- EU GDPR: **64** controls.

The seed also loads the 12 deterministic monitoring rules, the
demonstration organization (Nile Digital Services), its users, the demo
connector, 3 manual inventory records, and the demonstration assessment
with its answer plan and evidence.

Other useful scripts: `npm run typecheck`, `npm test` (Vitest — scoring,
monitoring determinism, permissions, seed integrity), `npm run db:reset`
(drop + re-migrate + re-seed the whole database).

## 4. Demo access — who you can sign in as

Open **`/signin`**. Authentication is demo-grade by design: you pick a
seeded user (no password ceremony, no self-signup). The signed HTTP-only
cookie only *identifies* the user and expires after 12 hours; every
permission is enforced server-side against the user's membership role.
Sign-ins are recorded in the audit trail.

The nine seeded users (`src/data/demo.ts`):

| Name | Email | Role | Can do |
|---|---|---|---|
| Salma Fawzy | `salma.fawzy@niledigital.example` | Client administrator | Everything in the tenant: manage assessments, answer controls, add and review evidence, review findings, manage inventory and connectors, generate reports, run exports, manage members, comment. |
| Karim Nassar | `karim.nassar@niledigital.example` | Compliance manager | Same as client admin **except** connector management and member management. |
| Dina Mostafa | `dina.mostafa@niledigital.example` | Compliance manager (acts as DPO in the story) | As above. |
| Omar Fathy | `omar.fathy@niledigital.example` | Control owner (IT) | Answer controls, add evidence, comment. |
| Laila Hassan | `laila.hassan@niledigital.example` | Control owner (HR) | Answer controls, add evidence, comment. |
| Youssef Adel | `youssef.adel@niledigital.example` | Control owner (Marketing) | Answer controls, add evidence, comment. |
| Nour El-Sayed | `nour.elsayed@niledigital.example` | Reviewer | Review evidence, review findings, comment — cannot answer controls. |
| Hana Ibrahim | `hana.ibrahim@niledigital.example` | Viewer | Read-only. |
| Iltzam Platform Admin | `platform.admin@iltzam.example` | Platform administrator | Passes all permission checks; the only user who sees **Backend operations** and **Data explorer** in the header. Falls back to the demonstration organization when acting without a membership. |

The permission map lives in one place — `ROLE_PERMISSIONS` in
`src/lib/types.ts` — and every API route checks it server-side.

## 5. Opening Nile Digital Services

1. Sign in (any seeded Nile Digital user, or the platform admin).
2. The home page (`/`) lists the active organization's assessments —
   platform admins without a membership see the demo organization's.
3. Open **"PDPL & GDPR readiness review 2026"**. The assessment workspace
   has a persistent sidebar with four sections:
   - **Dashboard** — `/assessments/{id}` — readiness position, gaps,
     evidence status.
   - **Control review** — `/assessments/{id}/questionnaire` — the 149
     control instances (85 PDPL + 64 GDPR), answers, owners, evidence.
   - **Gap analysis** — `/assessments/{id}/gaps` — every potential gap in
     priority order, mandatory exposure first.
   - **Audit report** — `/assessments/{id}/report` — the printable
     letterhead document.
4. The sidebar's **work queues** (Decisions pending, Gaps to remediate,
   Evidence required, Owner unassigned, Overdue) open the control review
   pre-filtered to that queue.

The seeded assessment already has a realistic answer plan: 37 controls
decided with mixed yes/no/not-applicable answers, owners, due dates, and
evidence in every review state (accepted, unreviewed, rejected) — so
scores, gaps and queues have texture before any scan runs.

## 6. Running the demonstration scan

Sign in as the platform administrator, open **Backend operations**
(`/admin/demo-operations`), and press **Run demonstration scan**. The
button POSTs `/api/demo/scan`, which returns `202` with a run id and then
executes the pipeline server-side; the page polls the run every 700 ms so
you watch the eight stages advance (each stage is paced at 650 ms for
visibility). The stages, in order:

1. **Queued** · 2. **Connecting** · 3. **Discovering** · 4. **Normalizing**
   · 5. **Evaluating rules** · 6. **Mapping controls** · 7. **Updating
   readiness** · 8. **Completed**

Every stage persists to the `SynchronizationRun` row and writes to the
audit trail — nothing is animated client-side.

What a **fresh** scan produces (deterministic — same inputs, same rule
versions, same output every time):

- **18 source resources** discovered from the *Demo Corporate Drive*
  connector and persisted as `ConnectorResource` rows.
- **18 inventory records** upserted from those resources (the register at
  `/inventory` then shows **21** active records — 18 discovered + the 3
  manual entries from the seed).
- **22 potential findings**, all created with status **New — awaiting
  review**:
  - **12 rules-based risk findings** — public personal data, broadly
    accessible biometric data, a cross-border flow to Germany, two missing
    retention periods, one passed retention date, a missing owner, missing
    marketing-consent evidence, missing sensitive-data licence evidence,
    unencrypted payroll, a processor without an agreement, and a rights
    request open 9 working days (past the 6-working-day PDPL threshold).
  - **10 evidence candidates** (rule `DEMO-EVIDENCE-001`, severity info) —
    policies, registers, agreements, a licence, a consent log, a training
    record and a DPO appointment letter. These are informational
    candidates only; a reviewer must attach and accept a document before it
    counts toward any control.
- **18 finding → control mappings**, created deterministically from each
  rule's configured PDPL control codes (e.g. `DEMO-TRANSFER-001` maps to
  `EG-TRF-01/02/03`).
- **Audit events for everything**: the human trigger, scan start, each
  resource discovery, each inventory creation, each rule evaluation, each
  finding creation, each control mapping, the position recalculation, and
  completion — with the origin (`human`, `automated_rule`, `system_job`)
  recorded on every event.

Re-running the scan does **not** duplicate anything: resources and
inventory are upserted by external id, and findings deduplicate on a
`rule:resource` key (existing findings just get their `detectedAt`
refreshed).

## 7. Why the official score does not change — and how to change it

The pipeline snapshots the **official position** (readiness, mandatory
readiness, evidence readiness, gap counts, finding counts) immediately
before the scan and again at the *Updating readiness* stage, and stores
both on the run. The Backend operations page renders them side by side.

**Official readiness is identical before and after the scan.** This is by
design, not omission: the official readiness score is computed
deterministically from the assessment's control answers and reviewed
evidence (`src/lib/scoring.ts`). Scan output enters the system as findings
with status `new` — recorded, mapped, audited, but **not applied**. The
only rows that move in the before/after table are "Findings awaiting
review" (from 0 to 22 on a fresh run). The `score_recalculated` audit event
says exactly this.

To demonstrate a **legitimate** change, use one of the two human review
gates:

- **Confirm a finding** — on `/monitoring`, open a finding and set it to
  *Confirmed* (requires the `finding.review` permission: reviewer,
  compliance manager, client admin, or platform admin). The change is
  audited with before/after state, and the *Confirmed findings* measure of
  the official position rises — visible in the Monitoring counters, the
  Backend operations stat cards, and the next scan's before/after
  snapshot. The readiness percentage itself still derives from control
  answers, so the demonstration point is the human gate: a confirmed
  finding drives remediation on its mapped controls, and changing those
  answers is what moves the score.
- **Accept an evidence item** — in the control review, review an
  *Unreviewed* evidence item and mark it *Accepted* (requires
  `evidence.review`). This immediately triggers the deterministic
  recalculation (`refreshAssessmentAfterAnswerChange`): the assessment's
  cached readiness scores are recomputed by the central scoring engine,
  and **evidence readiness** rises, because evidence readiness counts only
  controls answered *yes* with at least one **accepted** evidence item.
  Rejecting or expiring evidence moves it the other way. The action is
  audited as `evidence_accepted` with before/after review status.

Both paths are pure functions of reviewed data — run them twice and you
get the same numbers twice.

## 8. Inspecting the backend

- **Synchronization runs** — Backend operations shows the latest run with
  its stage stepper, counters (resources discovered/created/updated,
  potential findings, evidence candidates, errors) and the before/after
  position snapshots. Every run is also queryable at
  `GET /api/sync-runs/{id}` and listed in the Data explorer.
- **Inventory** — `/inventory` shows the active register with each row's
  source (*manual* vs *connector*), owner, data categories,
  sensitive-data and cross-border flags, retention, sharing and encryption
  status, and last-scanned time.
- **Findings and lineage** — `/monitoring` is the finding register with
  status counters (New / Under review / Confirmed / Dismissed / Resolved).
  Opening a finding shows the rule code and version that produced it, the
  recommended action, and a full **lineage trace**: connector → discovered
  resource → inventory record → finding, plus every audit event recorded
  against that finding.
- **Control mappings** — inside the finding drawer, the *Mapped controls*
  panel lists the PDPL controls the rule configuration tied the finding
  to, with the mapping reason and source (`deterministic_rule`).
- **Audit log and all 21 datasets** — `/admin/data-explorer` (platform
  admin + demo tools only) is a read-only index of every persisted
  dataset, grouped by schema layer: Organizations, Users, Memberships ·
  Regulations, Control domains, Controls, Regulation mappings ·
  Assessments, Assessment regulations, Assessment controls, Control
  comments · Evidence, Reports · Data inventory, Connectors,
  Synchronization runs, Connector resources · Monitoring rules, Monitoring
  findings, Finding mappings · Audit logs. Rows are sanitized before
  rendering — credential references, storage keys, identity-provider
  identifiers and anything secret-like never leave the database layer.
- **Engineering-level console** — `npx prisma studio` opens Prisma Studio
  directly against `DATABASE_URL` for raw table inspection when you need
  to go below the product surface.

## 9. Excel export — the full backend workbook

From Backend operations, **Export backend data (Excel)** downloads
`GET /api/exports/full` (requires the `export.run` permission or platform
admin; exports **only the caller's organization**). The export records a
`Report` row and an audit event, and produces
`iltizam-backend-demo-<org>.xlsx` with **22 sheets**
(`WORKBOOK_SHEETS` in `src/lib/excel.ts`):

1. Overview
2. Organization
3. Users
4. Regulations
5. Control Domains
6. Controls
7. Regulation Mappings
8. Assessments
9. Assessment Answers
10. Evidence Register
11. Data Inventory
12. Connectors
13. Synchronization Runs
14. Source Resources
15. Monitoring Rules
16. Monitoring Findings
17. Finding Control Mappings
18. Gap Register
19. Domain Scores
20. Regulation Scores
21. Reports
22. Audit Log

Scores in the workbook are copied from the central scoring engine, never
recomputed in the export, and the Connectors sheet carries no credentials
or tokens.

## 10. Reset demonstration

**Backend operations → Reset demonstration** (confirmation dialog, then
`POST /api/demo/reset`) restores the demonstration organization to its
seeded state:

- **Removes**: finding–control mappings, monitoring findings, connector
  resources, synchronization runs, connector-discovered inventory records,
  and generated reports.
- **Restores**: the demonstration assessment ("PDPL & GDPR readiness
  review 2026") is deleted and re-seeded with its full answer plan and
  evidence. Users, memberships, the demo connector, the 3 manual inventory
  records, and the global regulation/control/rule libraries are never
  touched.
- **Preserves**: the audit trail. Reset does not erase history — it
  appends a `demonstration_reset` audit event naming the actor.

Reset is guarded **three ways**: (1) a platform-admin session — anyone
else gets a 404; (2) demo tools must be enabled (`ENABLE_DEMO_TOOLS=true`
in production, or a non-production `NODE_ENV`); (3) `resetDemonstration`
re-checks the organization's `demoOrganization` flag in the database — a
non-demo organization can never be reset, regardless of who asks.

## 11. Five-minute stakeholder demonstration script

**0:00 – 0:30 · Sign in.** Open `/signin`, choose
`platform.admin@iltzam.example`. Point out: seeded users, no passwords by
design, permissions enforced server-side, sign-in audited.

**0:30 – 1:00 · The company's position.** From home, open **"PDPL & GDPR
readiness review 2026"**. On the Dashboard, show the readiness score,
mandatory readiness, and the sidebar work queues. Message: *this is the
official position — human answers, reviewed evidence, deterministic
score.*

**1:00 – 2:00 · Run the automated scan.** Header → **Backend
operations** → **Run demonstration scan**. Narrate the eight stages as
they advance — every stage is a database write, and the counters
(18 resources, 22 potential findings, 10 evidence candidates) fill in
live.

**2:00 – 2:45 · The punchline table.** Scroll to *Official position —
before / after*. Official readiness: **identical**. Findings awaiting
review: **0 → 22**, highlighted. Read the notice aloud: potential findings
are recorded, not applied — only a human reviewer can confirm a finding
into the official position.

**2:45 – 3:30 · Human review.** Open `/monitoring`. Filter to high
severity, open *"Cross-border data flow to review: Cross-Border Vendor
List.xlsx"*: show the rule code and version, the mapped controls
(EG-TRF-01/02/03), and the lineage trace down to the audit events. Confirm
the finding — the status counter moves, the action is audited with your
name.

**3:30 – 4:15 · Evidence and inventory.** Show `/inventory`: 21 records,
manual entries alongside scan-discovered systems with sensitive-data and
cross-border flags. Then, in the assessment's Control review, accept an
*Unreviewed* evidence item — evidence readiness recalculates on the spot,
deterministically.

**4:15 – 4:45 · Nothing is hidden.** Open `/admin/data-explorer` — all 21
datasets, read-only, sanitized — or click **Export backend data (Excel)**
and open the 22-sheet workbook, ending on the Audit Log sheet: every
automated action carries its origin.

**4:45 – 5:00 · Reset.** Press **Reset demonstration**. Scan artefacts
disappear, the seeded assessment returns, and the reset itself lands in
the audit trail. The demonstration is repeatable indefinitely.

## 12. Known limitations

- **Demo-grade sign-in.** There are no passwords — the sign-in flow
  authenticates *who you are demonstrating as*. A production identity
  provider must replace `createSession`/`getSession` in `src/lib/auth.ts`
  **before any real client data enters the system**; all authorization
  checks are already server-side and survive that swap unchanged.
- **Single-organization sessions.** A session acts in the user's *first*
  active membership (`activeOrg = memberships[0]`); there is no
  organization switcher yet. All seeded users belong to exactly one
  organization, so this does not surface in the demonstration.
- **In-process scan execution.** The scan runs via Next.js `after()` once
  the HTTP response is sent, and the UI polls the run row. There is no
  durable queue, retry, or resumption — a process restart mid-scan strands
  the run. A durable job queue is the production path; the pipeline is
  already idempotent (upserts + finding dedup keys) to make that swap
  safe.
- **AI layer: architecture only, disabled by default.** The audit
  vocabulary reserves an `optional_ai` origin and the UI labels it
  "advisory / suggestion only", but no AI integration is implemented and
  nothing in the codebase invokes a model. All monitoring is deterministic
  rules; any future AI output would enter as advisory suggestions subject
  to the same human-review gate.

## 13. Security notes

- **Server-side tenancy on every query.** Pages and API routes resolve the
  organization from the session's membership and filter every Prisma query
  by that `organizationId`. Cross-tenant access returns **404, not 403** —
  the platform never confirms to one tenant that another tenant's record
  exists (`requireOrgAccess`, `requireAssessmentAccess`).
- **Role permissions in one authority.** `ROLE_PERMISSIONS` in
  `src/lib/types.ts` is the single permission map; every mutating route
  calls `requirePermission` before acting. The session cookie is
  HMAC-SHA256-signed, HTTP-only, `SameSite=Lax`, secure in production, and
  carries only the user id — roles are re-read from the database on every
  request.
- **Demo tools are triple-gated.** Both tools require the demo-tools flag
  **and** the target organization's `demoOrganization` database flag (the
  scan refuses to run against a non-demo organization). Their session gates
  differ: **reset** requires a platform-admin session — anyone else gets a
  404, hiding that the surface exists — while the **scan** may also be
  triggered by a demo-org member holding `connector.manage` (the client
  administrator); members without that permission receive a 403.
- **No secrets in exports or the explorer.** The Data explorer strips
  credential references, storage keys, identity-provider ids and any
  secret-like column before rendering; the Excel workbook exports no
  credentials, tokens or sessions, and only the caller's organization.
- **Evidence access is authorized per-tenant — with one storage caveat.**
  The download route (`/api/evidence/{id}/download`) resolves the owning
  organization through the evidence's assessment and gates on membership;
  review and deletion require the corresponding permission (deleting
  **accepted** evidence additionally requires review authority, since it
  changes the reviewed position). Uploads are capped at 4 MB. Caveat: with
  local-disk storage (development) the authenticated route streams the
  file itself, but on Vercel Blob (production) files live at unguessable
  **public** URLs and the route redirects to them — anyone holding the
  exact URL can fetch the file without signing in. Do not upload real
  client documents to a Blob-backed demo deployment.
