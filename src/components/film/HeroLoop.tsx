// ─────────────────────────────────────────────────────────────────────────────
// HeroLoop.tsx — a 10-second silent, seamless loop of "After Submit" story
// moments (not dashboards) for the landing hero.
//
// Beats: submit → the paper copies itself into two trays → the delete
// request arrives → the Iltizam card sees all four places and the copies
// fold closed → fade back to the seam. The final 1.5s crossfades to the
// first frame so the wrap is invisible. Reduced motion freezes at 7.5s
// (the card + the folding copies).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import type { ReactNode } from "react";
import { useLoopClock, useReducedMotion } from "./engine";
import { easeInOut, envelope, mix, sub } from "./math";

const W = 720;
const H = 450;
const PAPER = "#efeadf";
const PAPER_DIM = "#e6e1d1";
const LIGHT = "#e8dcc4";
const WOOD = "#4a3f33";
const TEAL = "#0d6f64";
const AMBER = "#b0762a";
const QUIET = "#cfc4a8";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const LOOP_DUR = 10;
const FREEZE_T = 7.5;

function Doc({
  x,
  y,
  w = 38,
  h = 48,
  tint = 0,
  opacity = 1,
  foldT = 0,
  rotate = 0,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  tint?: number;
  opacity?: number;
  foldT?: number;
  rotate?: number;
}) {
  const grow = easeInOut(sub(foldT, 0, 0.55));
  const collapse = easeInOut(sub(foldT, 0.45, 1));
  const c = Math.min(mix(8, Math.min(w, h) * 0.92, grow), Math.min(w, h) * 0.95);
  const o = opacity * (1 - 0.95 * collapse);
  if (o <= 0.01) return null;
  return (
    <g
      opacity={o}
      transform={`translate(${x + w / 2} ${y + h}) scale(1 ${1 - 0.85 * collapse}) rotate(${rotate}) translate(${-(x + w / 2)} ${-(y + h)})`}
    >
      <path d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`} fill={PAPER} />
      {tint > 0 ? (
        <path
          d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`}
          fill={AMBER}
          opacity={0.16 * tint}
        />
      ) : null}
      <path d={`M ${x + w - c} ${y} L ${x + w} ${y + c} L ${x + w - c} ${y + c} Z`} fill="#ddd5c2" />
    </g>
  );
}

function Motif({ from, to, y, t01 }: { from: number; to: number; y: number; t01: number }) {
  if (t01 <= 0 || t01 >= 1) return null;
  const head = mix(from, to, easeInOut(t01));
  return <rect x={head - 110} y={y} width={110} height={1} fill="url(#hlMotif)" opacity={0.45} />;
}

function Beat({ o, children }: { o: number; children: ReactNode }) {
  if (o <= 0.01) return null;
  return <g opacity={o}>{children}</g>;
}

/* Beat 1 base — also the seam frame the loop returns to. */
function SubmitBeat({ t }: { t: number }) {
  const press = sub(t, 1.1, 1.2) * (1 - sub(t, 1.35, 1.55));
  const panelO = t < 1.35 ? 1 : 1 - sub(t, 1.4, 1.9);
  const submittedO = sub(t, 1.55, 1.95);
  const motif = sub(t, 1.6, 2.6);
  return (
    <g>
      <rect y={318} width={W} height={132} fill="#221d18" />
      <rect x={110} y={310} width={480} height={9} fill={WOOD} />
      {/* laptop */}
      <rect x={252} y={303} width={108} height={5} rx={2} fill="#26211c" />
      <rect x={344} y={224} width={6} height={82} rx={2} fill="#211c17" transform="rotate(14 347 306)" />
      {/* tiny panel */}
      <g opacity={panelO}>
        <rect x={382} y={182} width={150} height={88} rx={6} fill={PAPER} opacity={0.97} />
        <rect x={392} y={196} width={130} height={15} rx={3} fill={PAPER_DIM} />
        <text x={399} y={207} fontFamily={MONO} fontSize={7.5} fill="#191e2a">
          {"CV_Mariam_Hassan.pdf"}
        </text>
        <rect x={392} y={216} width={130} height={15} rx={3} fill={PAPER_DIM} />
        <text x={399} y={227} fontFamily={MONO} fontSize={7.5} fill="#191e2a">
          {"ID_scan.jpg"}
        </text>
        <g transform={`translate(0 ${1.2 * press})`}>
          <rect x={452} y={240} width={70} height={18} rx={4} fill={press > 0.3 ? "#1f1b17" : "#2a2723"} />
          <text x={487} y={252.5} textAnchor="middle" fontFamily={SANS} fontSize={9} fill={PAPER}>
            {"Submit"}
          </text>
        </g>
      </g>
      <text x={455} y={292} textAnchor="middle" fontFamily={SANS} fontSize={12} fill={QUIET} opacity={submittedO}>
        {"Application submitted"}
      </text>
      <Motif from={360} to={760} y={309} t01={motif} />
    </g>
  );
}

export function HeroLoop() {
  const reduced = useReducedMotion();
  const running = !reduced;
  const looped = useLoopClock(LOOP_DUR, running);
  const t = reduced ? FREEZE_T : looped;

  /* beat envelopes */
  const o1 = t < 2.3 ? 1 : 1 - sub(t, 2.3, 2.7);
  const o2 = envelope(t, 2.45, 4.7, 0.3);
  const o3 = envelope(t, 4.45, 6.7, 0.3);
  const o4 = Math.min(sub(t, 6.45, 6.75), 1 - sub(t, 8.6, 9.6));
  const seam = sub(t, 8.5, 9.8); // crossfade home

  /* beat 2 — duplication into two trays */
  const dupL = easeInOut(sub(t, 2.9, 3.9));
  const dupR = easeInOut(sub(t, 3.2, 4.2));
  const m2 = sub(t, 2.55, 3.1);

  /* beat 3 — the request */
  const msg = "Could you delete the ID copy…?";
  const chars = Math.floor(mix(0, msg.length, easeInOut(sub(t, 4.7, 6.0))));

  /* beat 4 — seen + folded closed */
  const rows = [0, 1, 2, 3].map((i) => sub(t, 6.7 + i * 0.22, 6.95 + i * 0.22));
  const folds = [sub(t, 7.35, 8.0), sub(t, 7.55, 8.2), sub(t, 7.75, 8.4)];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-line bg-brand">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hlWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2723" />
            <stop offset="1" stopColor="#211e1a" />
          </linearGradient>
          <linearGradient id="hlMotif" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={LIGHT} stopOpacity="0" />
            <stop offset="0.8" stopColor={LIGHT} stopOpacity="1" />
            <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#hlWall)" />
        {/* warm window glow, top right */}
        <rect x={520} y={30} width={170} height={230} fill={LIGHT} opacity={0.07} />

        {/* 1 · submit */}
        <Beat o={o1}>
          <SubmitBeat t={t} />
        </Beat>

        {/* 2 · the paper duplicates into two trays */}
        <Beat o={o2}>
          <rect y={330} width={W} height={120} fill="#221d18" />
          <Doc x={340} y={182} w={42} h={54} />
          <Motif from={140} to={620} y={318} t01={m2} />
          {[
            { tx: 150, dup: dupL, dir: -1 },
            { tx: 470, dup: dupR, dir: 1 },
          ].map((s, i) => (
            <g key={i}>
              <rect x={s.tx} y={312} width={120} height={7} fill="#3a352e" />
              <rect x={s.tx} y={292} width={5} height={27} fill="#3a352e" />
              <rect x={s.tx + 115} y={292} width={5} height={27} fill="#3a352e" />
              {s.dup > 0 ? (
                <Doc
                  x={mix(340, s.tx + 38, s.dup)}
                  y={mix(182, 254, s.dup)}
                  w={42}
                  h={54}
                  tint={1}
                  rotate={s.dir * 7 * s.dup}
                />
              ) : null}
            </g>
          ))}
        </Beat>

        {/* 3 · the delete request */}
        <Beat o={o3}>
          <rect x={172} y={96} width={376} height={258} rx={11} fill="#221e1a" />
          <rect x={186} y={110} width={348} height={230} rx={6} fill={PAPER} opacity={0.95} />
          <circle cx={208} cy={132} r={8} fill={PAPER_DIM} />
          <rect x={224} y={128} width={58} height={8} rx={2} fill="#d8d1bd" />
          <line x1={186} y1={148} x2={534} y2={148} stroke="#d8d1bd" />
          {chars > 0 ? (
            <g>
              <rect x={204} y={172} width={262} height={40} rx={10} fill={PAPER_DIM} />
              <text x={218} y={196} fontFamily={SANS} fontSize={12} fill="#191e2a">
                {msg.slice(0, chars)}
              </text>
            </g>
          ) : null}
        </Beat>

        {/* 4 · seen — and folded closed */}
        <Beat o={o4}>
          <rect x={196} y={120} width={220} height={168} rx={7} fill={PAPER} opacity={0.98} />
          <text x={212} y={150} fontFamily={SERIF} fontSize={15} fill="#191e2a">
            {"Mariam Hassan"}
          </text>
          <text x={212} y={170} fontFamily={SANS} fontSize={11} fontWeight={600} fill="#191e2a">
            {"4 locations identified"}
          </text>
          {rows.map((r, i) => (
            <g key={i} opacity={mix(0.25, 1, r)}>
              <circle cx={220} cy={188 + i * 22} r={2.6} fill={TEAL} opacity={r} />
              <rect x={231} y={184 + i * 22} width={[96, 128, 118, 140][i]} height={7} rx={2} fill="#d8d1bd" />
            </g>
          ))}
          <Doc x={490} y={140} foldT={folds[0]} opacity={0.5} />
          <Doc x={545} y={230} foldT={folds[1]} opacity={0.5} />
          <Doc x={470} y={320} foldT={folds[2]} opacity={0.5} />
        </Beat>

        {/* the seam — crossfade back to the opening frame */}
        <Beat o={seam}>
          <rect width={W} height={H} fill="url(#hlWall)" opacity={seam} />
          <rect x={520} y={30} width={170} height={230} fill={LIGHT} opacity={0.07 * seam} />
          <SubmitBeat t={0} />
        </Beat>
      </svg>
      <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] tracking-wide text-brand-muted">
        {"After Submit — an Iltizam film · 48s"}
      </p>
    </div>
  );
}
