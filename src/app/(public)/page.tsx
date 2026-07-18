// The public opening website at "/" — the marketing front door. Parchment
// page, no band chrome except the closing CTA and footer. Every control count
// on this page derives from PDPL_EXPECTED and MONITORING_RULES so the copy
// can never drift from the seed data it describes.

import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/Wordmark";
import { LEGAL_DISCLAIMER, MONITORING_DISCLAIMER } from "@/lib/types";
import { PDPL_EXPECTED } from "@/data/pdpl-controls";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import { LandingNav } from "./LandingNav";
import { FilmSection } from "./FilmSection";
import { HeroLoop } from "@/components/film/HeroLoop";

export const metadata: Metadata = {
  title: "Iltzam — Managed compliance for Egypt’s PDPL",
  description: `Become inspection-ready under Egypt’s Personal Data Protection Law (Law No. 151 of 2020): ${PDPL_EXPECTED.total} controls, deterministic monitoring with human review, and audit-ready reports before the 1 November 2026 deadline.`,
};

/** GDPR is a separate 64-control library — never combined with the PDPL count. */
const GDPR_CONTROL_COUNT = 64;

const WORKFLOW_STEPS: { title: string; body: string }[] = [
  {
    title: "Connect or register the systems that hold personal data",
    body: "Cloud drives, HR files, CRM exports, registers — connected under the client’s authorization, or registered by hand.",
  },
  {
    title: "Collect authorized metadata and structured records",
    body: "The platform reads only what it was granted: file metadata, sharing settings, and structured records such as registers and spreadsheets.",
  },
  {
    title: "Normalize into the data inventory",
    body: "Each source becomes a structured inventory entry — data categories, storage country, retention, sharing status, transfers.",
  },
  {
    title: "Run fixed rules-based checks",
    body: `${MONITORING_RULES.length} deterministic rules, each versioned. The same facts under the same rule version always produce the same result.`,
  },
  {
    title: "Create potential findings",
    body: "A rule match becomes a potential finding — labelled as potential, never treated as a conclusion.",
  },
  {
    title: "Map findings to controls",
    body: "Every finding is linked to the specific Egypt PDPL controls it puts in question.",
  },
  {
    title: "Send findings for human review",
    body: "A reviewer confirms, dismisses, or resolves each finding. No finding proceeds without a person.",
  },
  {
    title: "Update confirmed gaps and deterministic readiness scores",
    body: "Only confirmed findings change the official position; scores are recomputed by fixed arithmetic.",
  },
  {
    title: "Maintain an audit trail",
    body: "Every collection, rule evaluation, and review decision is logged with its origin — human, automated rule, or system job.",
  },
  {
    title: "Export reports and Excel workbooks",
    body: "Management-ready reports and working Excel exports of the inventory, gaps, and findings.",
  },
];

const MONITORING_CHAIN = [
  "Client-authorized data",
  "Automated collection",
  "Structured normalization",
  "Fixed rules-based checks",
  "Potential finding",
  "Human review",
  "Confirmed outcome",
  "Deterministic score update",
  "Audit log",
  "Report and Excel export",
] as const;

const PDPL_DEMANDS = [
  "A licence or permit from the PDPC before personal data is processed",
  "An appointed Data Protection Officer",
  "Data subject rights answered within 6 working days",
  "Breach notification to the PDPC within 72 hours",
  "A separate PDPC licence before personal data leaves Egypt",
] as const;

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.08em] text-ink3 uppercase">{label}</dt>
      <dd className="display mt-1 text-3xl font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-gold-text">{eyebrow}</p>
      <h2 className="display mt-3 text-3xl leading-tight font-semibold text-ink sm:text-4xl">
        {title}
      </h2>
      {lede ? <p className="mt-4 text-[15px] leading-7 text-ink2">{lede}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <LandingNav />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="shell pt-16 pb-14 sm:pt-24 sm:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
            <div>
              <p className="eyebrow text-gold-text">Managed compliance for Egypt</p>
              <h1 className="display mt-5 max-w-3xl text-4xl leading-[1.12] font-semibold text-ink sm:text-5xl">
                Become inspection-ready under Egypt’s PDPL — and stay that way.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-ink2 sm:text-base sm:leading-8">
                Law No. 151 of 2020 and its Executive Regulations (816/2025) are enforced by the
                Personal Data Protection Center (PDPC), with compliance expected by{" "}
                <strong className="font-semibold text-ink">1 November 2026</strong>. Iltzam turns those
                duties into control work your organisation can answer, evidence, and defend.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/platform" className="btn btn-primary">
                  Explore the platform
                </Link>
                <Link href="/sign-in" className="btn">
                  Sign in
                </Link>
              </div>
            </div>
            {/* Silent 10-second loop: an ordinary action, invisible data, a risk
                surfacing, Iltizam ordering it. Frozen under reduced motion. */}
            <div className="hidden overflow-hidden rounded-xl border border-line shadow-[var(--shadow-sheet)] lg:block">
              <HeroLoop />
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-3 lg:grid-cols-6">
            <Stat value={PDPL_EXPECTED.total} label="Egypt PDPL controls" />
            <Stat value={PDPL_EXPECTED.mandatory} label="Legally mandatory" />
            <Stat value={PDPL_EXPECTED.important} label="Important supporting" />
            <Stat value={PDPL_EXPECTED.domains} label="PDPL domains" />
            <Stat value={GDPR_CONTROL_COUNT} label="GDPR controls · separate library" />
            <Stat value={MONITORING_RULES.length} label="Deterministic monitoring rules" />
          </dl>
        </section>

        {/* ── The film ─────────────────────────────────────────────────────── */}
        <section id="film" className="band scroll-mt-24">
          <div className="shell py-16 sm:py-20">
            <p className="eyebrow text-gold-bright">The film</p>
            <h2 className="display mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              After Submit
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-brand-muted">
              One application, one request, and the responsibility that begins after “Submit”.
            </p>
            <div className="mt-8">
              <FilmSection />
            </div>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-brand-muted">
              <Link href="/film?cut=30" className="hover:text-gold-bright hover:underline">
                30-second cut
              </Link>
              <Link href="/film?cut=15" className="hover:text-gold-bright hover:underline">
                15-second cut
              </Link>
              <Link href="/film" className="hover:text-gold-bright hover:underline">
                Watch with sound on the film page →
              </Link>
            </p>
          </div>
        </section>

        {/* ── The law ───────────────────────────────────────────────────────── */}
        <section id="problem" className="scroll-mt-24 border-t border-line">
          <div className="shell py-16 sm:py-20">
            <SectionHeading
              eyebrow="The problem"
              title="A strict law, short deadlines, criminal exposure."
              lede="The PDPL is not a policy exercise. It licenses processing, names an accountable officer, sets deadlines measured in days and hours, and backs its rules with fines in Egyptian pounds — and, for its gravest violations, prison."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="card p-6">
                <h3 className="display text-lg font-semibold text-ink">What the PDPL demands</h3>
                <ul className="mt-4 space-y-3">
                  {PDPL_DEMANDS.map((d) => (
                    <li key={d} className="flex gap-2.5 text-sm leading-6 text-ink2">
                      <span aria-hidden className="mt-[11px] h-px w-3.5 shrink-0 bg-gold" />
                      {d}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="card p-6">
                <h3 className="display text-lg font-semibold text-ink">
                  What happens if it is ignored
                </h3>
                <p className="mt-4 text-sm leading-6 text-ink2">
                  Failing controller or processor duties draws fines of up to EGP 3 million;
                  denying a person their rights, up to EGP 1 million.
                </p>
                <p className="mt-3 text-sm leading-6 text-ink2">
                  Violations involving sensitive data or unlicensed cross-border transfer are
                  criminal offences — imprisonment of at least three months plus fines of up to
                  EGP 5 million.
                </p>
              </article>
              <article className="card border-l-[3px] border-l-gold p-6">
                <h3 className="display text-lg font-semibold text-ink">
                  The deadline: 1 November 2026
                </h3>
                <p className="mt-4 text-sm leading-6 text-ink2">
                  The Executive Regulations were issued in 2025, and the PDPC expects organisations
                  processing personal data in Egypt to be compliant by 1 November 2026.
                </p>
                <p className="mt-3 text-sm leading-6 text-ink2">
                  Licensing, a DPO, rights handling, breach response, and transfer controls each
                  take months to stand up — and each needs evidence behind it, not a policy on
                  file.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── How Iltzam works ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-24 border-t border-line">
          <div className="shell py-16 sm:py-20">
            <SectionHeading
              eyebrow="How it works"
              title="One workflow, from first connection to exported report."
              lede="Ten steps, in order. The automated half of the pipeline prepares the work; people make every decision that counts."
            />
            <ol className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {WORKFLOW_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="display mt-px shrink-0 text-lg font-semibold text-gold-text tabular-nums"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Automated monitoring ──────────────────────────────────────────── */}
        <section id="monitoring" className="scroll-mt-24 border-t border-line">
          <div className="shell py-16 sm:py-20">
            <SectionHeading
              eyebrow="Automated monitoring"
              title="A deterministic pipeline, with a human at the decision."
              lede="Monitoring runs on fixed, rules-based automation. Its output is a queue of potential findings for a person to judge — never a verdict."
            />
            <ol className="mt-10 flex flex-wrap items-center gap-y-3" aria-label="Monitoring flow">
              {MONITORING_CHAIN.map((stage, i) => (
                <li key={stage} className="flex items-center">
                  <span
                    className={
                      stage === "Human review"
                        ? "rounded-md border border-accent/40 bg-accent/[0.07] px-3 py-1.5 text-[13px] font-semibold text-accent-strong"
                        : "rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink2"
                    }
                  >
                    {stage}
                  </span>
                  {i < MONITORING_CHAIN.length - 1 ? (
                    <span aria-hidden className="mx-2 text-line2">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-3xl text-[15px] leading-7 text-ink2">
              Every rule is deterministic, versioned, and auditable: the same facts evaluated under
              the same rule version always yield the same finding, and every evaluation is written
              to the audit log.{" "}
              <strong className="font-semibold text-ink">No AI decides compliance</strong> — no
              model sits anywhere in the decision path, and no score moves until a person has
              reviewed the finding.
            </p>
            <p className="mt-6 max-w-3xl rounded-md border border-line bg-surface2/50 px-4 py-3 text-[13px] leading-6 text-ink2">
              {MONITORING_DISCLAIMER}
            </p>
          </div>
        </section>

        {/* ── Regulations ───────────────────────────────────────────────────── */}
        <section id="regulations" className="scroll-mt-24 border-t border-line">
          <div className="shell py-16 sm:py-20">
            <SectionHeading
              eyebrow="Regulations"
              title="Two control libraries, kept apart."
              lede="Iltzam carries the regulation you are accountable to today and the one you may face next. Each library is scored on its own — the counts are never combined."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="tag tag-outline font-mono tracking-wide">EG-PDPL</span>
                  <span className="text-xs font-medium text-ink3">
                    Compliance expected by 1 November 2026
                  </span>
                </div>
                <h3 className="display mt-4 text-xl font-semibold text-ink">
                  Egypt Personal Data Protection Law
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink2">
                  {PDPL_EXPECTED.total} controls — {PDPL_EXPECTED.mandatory} legally mandatory and{" "}
                  {PDPL_EXPECTED.important} important supporting controls — across{" "}
                  {PDPL_EXPECTED.domains} domains, drafted from the text of the Law and its
                  Executive Regulations.
                </p>
                <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Legal instrument</dt>
                    <dd className="text-right font-medium text-ink">
                      Law No. 151 of 2020 · Executive Regulations 816/2025
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Regulator</dt>
                    <dd className="text-right font-medium text-ink">
                      Personal Data Protection Center (PDPC)
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Deadline</dt>
                    <dd className="text-right font-medium text-ink">1 November 2026</dd>
                  </div>
                </dl>
              </article>
              <article className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="tag tag-outline font-mono tracking-wide">EU-GDPR</span>
                  <span className="text-xs font-medium text-ink3">Separate library</span>
                </div>
                <h3 className="display mt-4 text-xl font-semibold text-ink">
                  EU General Data Protection Regulation
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink2">
                  {GDPR_CONTROL_COUNT} controls in a library maintained separately from the Egypt
                  PDPL set. An organisation’s PDPL position is scored on the PDPL library alone —
                  the two counts are never merged.
                </p>
                <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Controls</dt>
                    <dd className="text-right font-medium text-ink">{GDPR_CONTROL_COUNT}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Applies</dt>
                    <dd className="text-right font-medium text-ink">
                      When the personal data of EU residents is in scope
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0 text-ink3">Kept</dt>
                    <dd className="text-right font-medium text-ink">
                      Independently of the Egypt PDPL library
                    </dd>
                  </div>
                </dl>
              </article>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section className="band">
          <div className="shell flex flex-col items-start gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow text-gold-bright">Next step</p>
              <h2 className="display mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                See where you stand.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-brand-muted">
                Walk the platform on synthetic demonstration data, or create an account and open
                your first readiness assessment.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/platform" className="btn btn-primary">
                Explore the platform
              </Link>
              <Link href="/sign-up" className="btn btn-gold-on-band">
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="band border-t border-brand-line">
        <div className="shell flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-[13px] leading-6 text-brand-muted">
              Managed compliance for Egypt’s PDPL — controls, evidence, deterministic monitoring,
              and reports in one place.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2.5">
            <p className="eyebrow text-gold-bright">Get started</p>
            <Link href="/platform" className="mt-1 text-[13px] font-medium text-brand-ink hover:underline">
              Platform
            </Link>
            <Link href="/sign-in" className="text-[13px] font-medium text-brand-ink hover:underline">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-[13px] font-medium text-brand-ink hover:underline">
              Create account
            </Link>
          </nav>
          <div className="max-w-md">
            <p className="eyebrow text-gold-bright">A note on scope</p>
            <p className="mt-3 text-[13px] leading-6 text-brand-muted">{LEGAL_DISCLAIMER}</p>
            <p className="mt-4 flex items-center gap-2 text-[12px] text-brand-muted/80">
              <LogoMark className="h-5 w-5 shrink-0" />
              All demonstration data on this platform is synthetic.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
