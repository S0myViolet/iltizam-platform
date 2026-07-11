// Public platform overview — the page every landing CTA points to. It
// explains, before authentication, exactly what the product does: the six
// working surfaces, the deterministic monitoring pipeline, the scoring
// model, and the tenancy model. Public pages carry no band chrome from the
// (app) layout; this page owns its header and CTA band but uses the same
// design tokens as the rest of the product.

import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/Wordmark";
import { PDPL_EXPECTED } from "@/data/pdpl-controls";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import {
  AUDIT_ORIGIN_LABELS,
  LEGAL_DISCLAIMER,
  MONITORING_DISCLAIMER,
  ROLE_LABELS,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "The platform — Iltzam",
  description:
    "How Iltzam turns Egypt PDPL and EU GDPR into control work your team can execute — assessments, evidence, automated monitoring, and exports.",
};

// ─── Section content ─────────────────────────────────────────────────────────

const SURFACES: { name: string; body: string }[] = [
  {
    name: "Control review",
    body: `Answer ${PDPL_EXPECTED.total} Egypt PDPL controls — ${PDPL_EXPECTED.mandatory} legally mandatory and ${PDPL_EXPECTED.important} important supporting controls across ${PDPL_EXPECTED.domains} domains — plus a separate 64-control GDPR library. Every control is a plain-language question tied to its legal basis; assign an owner and a due date to each.`,
  },
  {
    name: "Evidence register",
    body: "Upload files or link records against controls. A human reviewer accepts or rejects every item — only accepted evidence counts toward the evidence position. Rejected and expired items stay on the record.",
  },
  {
    name: "Gap register",
    body: "Every No, every unanswered control, and every accepted answer still missing evidence becomes a gap, prioritised on five tiers — from legally mandatory controls answered No down to answers awaiting evidence — each tracing to the legal basis it comes from.",
  },
  {
    name: "Data inventory",
    body: "A register of where personal data lives: systems, data categories, retention, owners, and transfer destinations. Holds manual entries alongside scan-discovered sources, each marked with how it entered the inventory.",
  },
  {
    name: "Monitoring",
    body: "Deterministic, rules-based findings from sources your organization connects — each one waiting for human review, and each carrying data lineage back to the exact records and rule version that raised it.",
  },
  {
    name: "Reports & exports",
    body: "Generate an audit-style readiness report and a full Excel monitoring workbook — findings, rules, lineage, review decisions, and scores in a form you can hand to counsel or an auditor.",
  },
];

const MONITORING_FLOW: { step: string; body: string }[] = [
  {
    step: "Client-authorized data",
    body: "Monitoring reads only the sources your organization explicitly connects and authorizes. Nothing is scanned without a client decision on record.",
  },
  {
    step: "Automated collection",
    body: "A system job opens the authorized source and collects its files and structured records. Every run is staged and logged from start to finish.",
  },
  {
    step: "Structured normalization",
    body: "Collected material is normalized into structured resources — owner, sharing status, data categories, retention, encryption, transfer destinations — so every rule evaluates the same fields the same way.",
  },
  {
    step: "Fixed rules-based checks",
    body: `${MONITORING_RULES.length} fixed rules with stable codes (MON-ACCESS-001 through MON-EVIDENCE-001) evaluate each resource. The rules are versioned and auditable, and there is no AI anywhere in the decision path.`,
  },
  {
    step: "Potential finding",
    body: "When a rule matches, it raises a potential finding: the rule code, severity, the affected resource, and the related PDPL controls. It enters the queue marked new — awaiting review.",
  },
  {
    step: "Human review",
    body: "A reviewer examines each finding and confirms, dismisses, or resolves it. Unreviewed findings never change the official score.",
  },
  {
    step: "Confirmed outcome",
    body: "Only the reviewer decision becomes part of the compliance record — captured with who decided, what they decided, and when.",
  },
  {
    step: "Deterministic score update",
    body: "Confirmed outcomes feed documented, deterministic formulas. The same inputs always produce the same number; nothing in the score requires trust in a black box.",
  },
  {
    step: "Audit log",
    body: "Every hop — collection, rule evaluation, review decision, score change — writes an audit event stamped with its origin: human, automated rule, or system job.",
  },
  {
    step: "Report and Excel export",
    body: "The confirmed record flows into the audit-style report and the Excel monitoring workbook, with lineage from each figure back to its source.",
  },
];

const SCORING_POINTS: { title: string; body: string }[] = [
  {
    title: "Official readiness — human answers only",
    body: "The official readiness score is computed from human answers alone. No automated finding, scan result, or suggestion moves it until a person has reviewed and confirmed.",
  },
  {
    title: "Evidence readiness — accepted evidence only",
    body: "Evidence readiness counts evidence a reviewer has accepted. Unreviewed, rejected, and expired items are excluded from the figure entirely.",
  },
  {
    title: "Per-domain and per-regulation",
    body: `Scores break down by domain — ${PDPL_EXPECTED.domains} domains for Egypt PDPL — and by regulation. EG-PDPL and EU-GDPR are scored separately, never blended into one number.`,
  },
  {
    title: "Deterministic and documented",
    body: "Every formula is deterministic and documented. The same answers and the same accepted evidence always produce the same score — it can be recomputed and checked by hand.",
  },
];

const TENANCY_POINTS: { title: string; body: string }[] = [
  {
    title: "Organizations",
    body: "Each organization is a separate tenant. Assessments, answers, evidence, findings, inventory, and audit events are scoped to the organization that owns them.",
  },
  {
    title: "Five roles, plus a platform administrator",
    body: "Membership carries one of five roles with server-enforced permissions. Platform administration is a separate capability, not a sixth membership role.",
  },
  {
    title: "Server-side tenancy",
    body: "Every query filters by organization on the server. A request for another tenant records returns 404 — cross-tenant data is not merely forbidden, it is invisible.",
  },
  {
    title: "Audit trail with origins",
    body: "Every write lands in the audit trail stamped with its origin, so a reviewer can always tell whether a person, an automated rule, or a system job made the change.",
  },
];

const AUDIT_ORIGINS_SHOWN = [
  AUDIT_ORIGIN_LABELS.human,
  AUDIT_ORIGIN_LABELS.automated_rule,
  AUDIT_ORIGIN_LABELS.system_job,
];

function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-gold-text">{eyebrow}</p>
      <h2 className="display mt-3 text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      <p className="mt-3 text-[15px] leading-7 text-ink2">{lede}</p>
    </div>
  );
}

export default function PlatformPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Public header — same nav pattern as the landing. */}
      <header className="band sticky top-0 z-40 border-b border-brand-line">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
          >
            <Wordmark />
          </Link>
          <nav aria-label="Account" className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-[13px] font-semibold text-brand-ink hover:text-gold-bright"
            >
              Sign in
            </Link>
            <Link href="/sign-up" className="btn btn-gold-on-band !py-1.5 !text-[13px]">
              Create an account
            </Link>
          </nav>
        </div>
      </header>

      {/* 1 · Header */}
      <section className="band">
        <div className="shell pt-14 pb-28 sm:pt-20 sm:pb-32">
          <p className="eyebrow text-gold-bright">The platform</p>
          <h1 className="display mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
            What Iltzam actually does
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-brand-muted">
            Iltzam turns Egypt PDPL and EU GDPR into control work your team can execute —
            assessments, evidence, automated monitoring, and exports. Six working screens, one
            deterministic pipeline, and scores a reviewer can recompute by hand.
          </p>
          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {[
              {
                figure: String(PDPL_EXPECTED.total),
                label: "Egypt PDPL controls",
                detail: `${PDPL_EXPECTED.mandatory} legally mandatory · ${PDPL_EXPECTED.important} important`,
              },
              { figure: "64", label: "EU GDPR controls", detail: "A separate library" },
              {
                figure: String(PDPL_EXPECTED.domains),
                label: "PDPL domains",
                detail: "Scored individually",
              },
              {
                figure: String(MONITORING_RULES.length),
                label: "Monitoring rules",
                detail: "Fixed, versioned, no AI",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col border-l-2 border-gold/60 pl-4">
                <dt className="order-last text-[12px] font-medium tracking-wide text-brand-muted">
                  {stat.label}
                  <span className="mt-0.5 block text-[11px] text-brand-muted/80">
                    {stat.detail}
                  </span>
                </dt>
                <dd className="display text-3xl font-semibold text-brand-ink">{stat.figure}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The parchment sheet rises over the hero band. */}
      <main className="shell flex-1">
        <div className="sheet -mt-14 px-5 py-10 sm:px-10 sm:py-14">
          {/* 2 · The working surfaces */}
          <section aria-labelledby="surfaces">
            <SectionHeading
              eyebrow="The working surfaces"
              title="Six screens, one system of record"
              lede="Each surface is a real screen in the product, not a module name on a brochure. Together they carry a control from first answer to exported record."
            />
            <span id="surfaces" className="sr-only">
              The working surfaces
            </span>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SURFACES.map((surface, i) => (
                <article key={surface.name} className="card flex flex-col gap-2.5 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="display text-lg font-semibold text-ink">{surface.name}</h3>
                    <span
                      aria-hidden
                      className="font-mono text-[11px] font-semibold tracking-wide text-gold-text"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-ink2">{surface.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* 3 · How monitoring works */}
          <section aria-labelledby="monitoring" className="panel mt-16">
            <SectionHeading
              eyebrow="How monitoring works"
              title="A fixed pipeline, reviewable at every hop"
              lede="Monitoring is deterministic, rules-based automation followed by human review. The chain below is the official flow — every scan follows it, in this order, every time."
            />
            <span id="monitoring" className="sr-only">
              How monitoring works
            </span>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
              <ol className="min-w-0">
                {MONITORING_FLOW.map((hop, i) => (
                  <li key={hop.step} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line2 bg-surface font-mono text-[11px] font-semibold text-ink2">
                        {i + 1}
                      </span>
                      {i < MONITORING_FLOW.length - 1 ? (
                        <span aria-hidden className="w-px flex-1 bg-line" />
                      ) : null}
                    </div>
                    <div className={i < MONITORING_FLOW.length - 1 ? "pb-7" : ""}>
                      <h3 className="pt-1.5 text-sm font-semibold text-ink">{hop.step}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink2">{hop.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <aside className="h-fit lg:sticky lg:top-24">
                <div className="card p-5">
                  <p className="eyebrow text-gold-text">Determinism, stated plainly</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-ink2">
                    <li className="border-l-2 border-line2 pl-3">
                      <strong className="font-semibold text-ink">
                        {MONITORING_RULES.length} fixed rules
                      </strong>{" "}
                      with stable codes, versioned and auditable.
                    </li>
                    <li className="border-l-2 border-line2 pl-3">
                      <strong className="font-semibold text-ink">
                        The same data always produces the same findings.
                      </strong>{" "}
                      Same facts, same rule version — same result, every run.
                    </li>
                    <li className="border-l-2 border-line2 pl-3">
                      <strong className="font-semibold text-ink">
                        Unreviewed findings never change the official score.
                      </strong>{" "}
                      Only a human confirmation does.
                    </li>
                  </ul>
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="field-label">The rule set</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {MONITORING_RULES.map((rule) => (
                        <li key={rule.code}>
                          <span
                            className="tag tag-outline font-mono tracking-wide"
                            title={rule.name}
                          >
                            {rule.code}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-[12px] leading-5 text-ink3">{MONITORING_DISCLAIMER}</p>
              </aside>
            </div>
          </section>

          {/* 4 · Scoring you can defend */}
          <section aria-labelledby="scoring" className="panel mt-16">
            <SectionHeading
              eyebrow="Scoring you can defend"
              title="Numbers built to survive scrutiny"
              lede="A readiness score is only useful if you can explain it to an auditor. Iltzam keeps the official position strictly human-made and every formula reproducible."
            />
            <span id="scoring" className="sr-only">
              Scoring you can defend
            </span>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {SCORING_POINTS.map((point) => (
                <article key={point.title} className="card p-5">
                  <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink2">{point.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* 5 · Built multi-tenant */}
          <section aria-labelledby="tenancy" className="panel mt-16">
            <SectionHeading
              eyebrow="Built multi-tenant"
              title="Tenancy enforced on the server, not the screen"
              lede="Organizations, roles, and the audit trail are structural — isolation is a property of every query, not a setting a screen can forget to apply."
            />
            <span id="tenancy" className="sr-only">
              Built multi-tenant
            </span>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {TENANCY_POINTS.map((point) => (
                <article key={point.title} className="card p-5">
                  <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink2">{point.body}</p>
                  {point.title.startsWith("Five roles") ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {Object.values(ROLE_LABELS).map((label) => (
                        <li key={label}>
                          <span className="tag tag-outline">{label}</span>
                        </li>
                      ))}
                      <li>
                        <span className="tag border border-gold/40 bg-gold/[0.08] text-gold-text">
                          Platform administrator
                        </span>
                      </li>
                    </ul>
                  ) : null}
                  {point.title.startsWith("Audit trail") ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {AUDIT_ORIGINS_SHOWN.map((label) => (
                        <li key={label}>
                          <span className="tag tag-outline">{label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* 6 · CTA band */}
      <section aria-labelledby="get-started" className="band">
        <div className="shell flex flex-col gap-8 py-14 md:flex-row md:items-center md:justify-between sm:py-16">
          <div className="max-w-xl">
            <p className="eyebrow text-gold-bright">Get started</p>
            <h2 id="get-started" className="display mt-3 text-2xl font-semibold sm:text-3xl">
              Put the control work on record
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              Create an organization, open the {PDPL_EXPECTED.total}-control Egypt PDPL
              assessment, and start assigning owners today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-in" className="btn btn-on-band">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn btn-gold-on-band">
              Create an account
            </Link>
          </div>
        </div>
        <div className="border-t border-brand-line">
          <div className="shell flex items-start gap-3 py-6">
            <LogoMark className="h-5 w-5 shrink-0" />
            <p className="text-[12px] leading-5 text-brand-muted">{LEGAL_DISCLAIMER}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
