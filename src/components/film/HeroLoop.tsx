// ─────────────────────────────────────────────────────────────────────────────
// HeroLoop.tsx — a 10-second silent, seamless loop of "The 90-Day
// Transformation" ribbon beats for the landing hero.
//
// Beats: the report (headlines) unfolds into the paper ribbon → the DAY
// markers print on → one inspection finding tag → the dossier closes →
// the brand line → crossfade back to the seam. The final 1.5s dissolves to
// the first frame so the wrap is invisible. Reduced motion freezes at 5.4s
// (the printed ribbon + the finding tag).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useLoopClock, useReducedMotion } from "./engine";
import { easeInOut, easeOut, mix, sub } from "./math";

const W = 720;
const H = 450;

const BG = "#efeadf";
const BG2 = "#e8e2d6";
const PAPER = "#f8f4ea";
const PAPER_EDGE = "#c9c1af";
const RIB_FACE = "#f4efe2";
const GRAPHITE = "#26292e";
const INKBLUE = "#1c2740";
const EMERALD = "#0d6f64";
const EMERALD_DEEP = "#0a5a50";
const STONE = "#b9b2a6";
const STONE_DEEP = "#8a8375";
const AMBER = "#b0762a";
const CORAL = "#a53b2a";

const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

const LOOP_DUR = 10;
const FREEZE_T = 5.4;

const RIB_Y = 300;
const RIB_H = 56;
const RIB_X0 = 70;

/** Editorial type: stone under-print + graphite face. */
function Ed({
  x,
  y,
  text,
  size = 15,
  spacing = 0.2,
  o = 1,
  color = GRAPHITE,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  spacing?: number;
  o?: number;
  color?: string;
}) {
  if (o <= 0.01) return null;
  return (
    <g opacity={o} transform={`translate(0 ${3 * (1 - easeOut(o))})`}>
      <text x={x + 1} y={y + 1.5} textAnchor="middle" fontFamily={SERIF} fontSize={size} fontWeight={600} letterSpacing={`${spacing}em`} fill={STONE} opacity={0.9}>
        {text}
      </text>
      <text x={x} y={y} textAnchor="middle" fontFamily={SERIF} fontSize={size} fontWeight={600} letterSpacing={`${spacing}em`} fill={color}>
        {text}
      </text>
    </g>
  );
}

/** The report card — also the seam frame the loop returns to. */
function ReportBeat({ t }: { t: number }) {
  /* lands 0–0.9, then folds down into the ribbon 1.2–2.6 */
  const land = easeOut(sub(t, 0.05, 0.9));
  const fold = easeInOut(sub(t, 1.2, 2.4));
  const x = mix(300, RIB_X0, fold);
  const y = mix(mix(60, 120, land), RIB_Y, fold);
  const w = mix(150, 190, fold);
  const h = mix(104, RIB_H, fold);
  const o = 1 - sub(t, 2.1, 2.5);
  if (o <= 0.01) return null;
  return (
    <g opacity={o} transform={`rotate(${mix(8, 0, land) * (1 - fold)} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={PAPER} stroke={PAPER_EDGE} />
      <g opacity={1 - sub(t, 1.5, 2.1)}>
        <rect x={x + 10} y={y + 9} width={54} height={5} fill={GRAPHITE} />
        <rect x={x + w - 20} y={y + 8} width={10} height={10} fill={CORAL} />
        <line x1={x + 10} y1={y + 21} x2={x + w - 10} y2={y + 21} stroke={PAPER_EDGE} />
        <text x={x + 10} y={y + 39} fontFamily={SERIF} fontSize={13} fontWeight={700} fill={GRAPHITE}>
          {"New privacy obligations"}
        </text>
        <text x={x + 10} y={y + 57} fontFamily={SERIF} fontSize={11} fontWeight={600} fill="#3a3e44">
          {"Inspection exposure rising"}
        </text>
        <g fill={STONE}>
          <rect x={x + 10} y={y + 70} width={110} height={3} />
          <rect x={x + 10} y={y + 79} width={122} height={3} />
        </g>
      </g>
    </g>
  );
}

export function HeroLoop() {
  const reduced = useReducedMotion();
  const looped = useLoopClock(LOOP_DUR, !reduced);
  const t = reduced ? FREEZE_T : looped;

  /* the ribbon grows from the folded report */
  const edge = mix(RIB_X0 + 4, 668, easeInOut(sub(t, 1.6, 4.2)));
  const ribO = sub(t, 1.9, 2.5) * (1 - sub(t, 8.5, 9.6));
  const flapW = (26 + 10 * Math.sin(t * 3)) * (1 - sub(t, 4.0, 4.4));

  /* day markers print as the fold passes */
  const days: { x: number; label: string }[] = [
    { x: 150, label: "DAY 1" },
    { x: 320, label: "DAY 20" },
    { x: 470, label: "DAY 60" },
    { x: 610, label: "DAY 90" },
  ];

  /* one finding above the band */
  const frameP = sub(t, 4.4, 5.3);
  const tagO = Math.min(sub(t, 5.3, 5.9), 1 - sub(t, 6.6, 7.1));

  /* the dossier closes → brand */
  const dosO = Math.min(sub(t, 6.6, 7.1), 1 - sub(t, 8.5, 9.4));
  const closeT = easeInOut(sub(t, 7.3, 8.1));
  const brandO = Math.min(sub(t, 8.0, 8.6), 1 - sub(t, 9.2, 9.9));

  /* seam — crossfade back to the opening frame */
  const seam = sub(t, 8.6, 9.9);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-line bg-[#efeadf]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
        <defs>
          <pattern id="hlHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
            <line x1="0" y1="0" x2="0" y2="7" stroke={GRAPHITE} strokeWidth="0.5" strokeOpacity="0.1" />
          </pattern>
          <filter id="hlShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={GRAPHITE} floodOpacity="0.16" />
          </filter>
        </defs>

        <rect width={W} height={H} fill={BG} />
        <rect y={390} width={W} height={60} fill={BG2} />
        <line x1={0} y1={390} x2={W} y2={390} stroke="#d7cfbc" strokeWidth={2} />

        {/* 1 · the report lands, folds into the band */}
        <ReportBeat t={t} />

        {/* 2 · the ribbon with printed DAY markers */}
        {ribO > 0.01 ? (
          <g opacity={ribO}>
            <rect x={RIB_X0} y={RIB_Y + RIB_H + 5} width={edge - RIB_X0} height={8} rx={4} fill={GRAPHITE} opacity={0.08} />
            <rect x={RIB_X0 - 4} y={RIB_Y - 4} width={edge - RIB_X0 + 4} height={RIB_H + 4} fill="#ddd5c2" />
            <rect x={RIB_X0} y={RIB_Y} width={edge - RIB_X0} height={RIB_H} fill={RIB_FACE} stroke={PAPER_EDGE} />
            <rect x={RIB_X0} y={RIB_Y} width={edge - RIB_X0} height={3} fill="#fbf8ef" />
            <rect x={RIB_X0} y={RIB_Y + RIB_H - 5} width={edge - RIB_X0} height={5} fill={STONE} opacity={0.28} />
            <path d={`M ${RIB_X0} ${RIB_Y} l 20 0 l -12 ${RIB_H} l -14 0 Z`} fill={GRAPHITE} opacity={0.88} />
            {[236, 545].map((cx) =>
              cx < edge - 30 ? (
                <path key={cx} d={`M ${cx - 12} ${RIB_Y} l 22 0 l 10 ${RIB_H} l -22 0 Z`} fill={GRAPHITE} opacity={0.86} />
              ) : null,
            )}
            {flapW > 1.5 && edge < 660 ? (
              <path d={`M ${edge} ${RIB_Y} l ${flapW} 8 l -11 ${RIB_H - 3} l -11 -5 Z`} fill="#31353b" />
            ) : null}
            {days.map((d) => {
              const po = sub(edge, d.x + 16, d.x + 76);
              const big = d.label === "DAY 90";
              return (
                <g key={d.label} opacity={po}>
                  <line x1={d.x} y1={RIB_Y + 6} x2={d.x} y2={RIB_Y + 14} stroke={GRAPHITE} strokeWidth={big ? 2.2 : 1.5} />
                  <Ed x={d.x} y={RIB_Y + 36} text={d.label} size={big ? 15 : 13} spacing={0.16} o={po} color={big ? INKBLUE : GRAPHITE} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* 3 · one inspection finding above the band */}
        {frameP > 0.01 || tagO > 0.01 ? (
          <g opacity={1 - sub(t, 6.6, 7.1)}>
            <Doc x={210} y={168} o={sub(t, 4.2, 4.7)} />
            {frameP > 0 ? (
              <g stroke={GRAPHITE} strokeWidth={1.7} fill="none" opacity={0.92}>
                {[
                  "M 196 196 V 158 H 214",
                  "M 250 158 H 268 V 176",
                  "M 268 226 V 244 H 250",
                  "M 214 244 H 196 V 226",
                ].map((d, i) => {
                  const cp = sub(frameP, i * 0.12, i * 0.12 + 0.4);
                  return cp > 0 ? <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cp} /> : null;
                })}
              </g>
            ) : null}
            {tagO > 0.01 ? (
              <g opacity={tagO}>
                <line x1={268} y1={172} x2={296} y2={152} stroke={GRAPHITE} strokeWidth={1.1} opacity={0.6} />
                <circle cx={268} cy={172} r={3} fill={AMBER} />
                <g transform="translate(296 132)" filter="url(#hlShadow)">
                  <rect width={158} height={40} rx={3} fill={PAPER} stroke={PAPER_EDGE} />
                  <rect width={4} height={40} rx={1} fill={AMBER} />
                  <text x={12} y={16.5} fontFamily={SANS} fontSize={10} fontWeight={700} letterSpacing="0.06em" fill={GRAPHITE}>
                    {"SENSITIVE DATA"}
                  </text>
                  <text x={12} y={31} fontFamily={SANS} fontSize={9} fill={STONE_DEEP}>
                    {"Access too broad"}
                  </text>
                </g>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* 4 · the dossier closes */}
        {dosO > 0.01 ? (
          <g opacity={dosO}>
            <g filter="url(#hlShadow)">
              <rect x={266} y={120} width={188} height={140} rx={3} fill="#f6f1e4" stroke={GRAPHITE} strokeWidth={1.8} />
              <rect x={266} y={120} width={16} height={140} fill={INKBLUE} />
              {[0, 1, 2].map((i) => (
                <rect key={i} x={452} y={134 + i * 26} width={12} height={13} rx={2} fill={PAPER} stroke={STONE} />
              ))}
            </g>
            {/* the cover swings closed */}
            <g transform={`translate(282 0) scale(${mix(0.12, 1, closeT)} 1) translate(-282 0)`}>
              <rect x={282} y={120} width={172} height={140} fill={RIB_FACE} stroke={GRAPHITE} strokeWidth={1.6} opacity={mix(0.4, 1, closeT)} />
              <g opacity={sub(closeT, 0.65, 1)}>
                <text x={368} y={172} textAnchor="middle" fontFamily={MONO} fontSize={10} letterSpacing="0.2em" fill={GRAPHITE}>
                  {"EVIDENCE PACK"}
                </text>
                <text x={368} y={192} textAnchor="middle" fontFamily={MONO} fontSize={9} letterSpacing="0.18em" fill={EMERALD_DEEP}>
                  {"INSPECTION-READY"}
                </text>
                <text x={368} y={212} textAnchor="middle" fontFamily={SERIF} fontSize={12} fontWeight={600} letterSpacing="0.14em" fill={INKBLUE}>
                  {"DAY 90"}
                </text>
              </g>
            </g>
          </g>
        ) : null}

        {/* 5 · brand */}
        {brandO > 0.01 ? (
          <g opacity={brandO}>
            <Ed x={360} y={92} text="ILTZAM" size={26} spacing={0.32} color={INKBLUE} />
            <rect x={318} y={102} width={84} height={2} fill={EMERALD} />
          </g>
        ) : null}

        {/* the seam — crossfade back to the opening frame */}
        {seam > 0.01 ? (
          <g opacity={seam}>
            <rect width={W} height={H} fill={BG} />
            <rect y={390} width={W} height={60} fill={BG2} />
            <line x1={0} y1={390} x2={W} y2={390} stroke="#d7cfbc" strokeWidth={2} />
            <ReportBeat t={0.06} />
          </g>
        ) : null}

        <rect width={W} height={H} fill="url(#hlHatch)" opacity={0.5} />
      </svg>
      <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] tracking-wide text-[#6d675c]">
        {"From Exposure to Control — an Iltizam film · 78s"}
      </p>
    </div>
  );
}

/** A small folded-corner document for the loop. */
function Doc({ x, y, o = 1 }: { x: number; y: number; o?: number }) {
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      <path d={`M ${x} ${y} h 34 l 10 10 v 56 h -44 Z`} fill={PAPER} stroke={PAPER_EDGE} />
      <path d={`M ${x + 34} ${y} l 10 10 h -10 Z`} fill="#e3dcc9" />
      <g fill={STONE}>
        <rect x={x + 7} y={y + 24} width={26} height={2.6} />
        <rect x={x + 7} y={y + 36} width={20} height={2.6} />
        <rect x={x + 7} y={y + 48} width={24} height={2.6} />
      </g>
    </g>
  );
}
