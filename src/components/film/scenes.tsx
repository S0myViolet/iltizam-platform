// ─────────────────────────────────────────────────────────────────────────────
// scenes.tsx — "The 90-Day Transformation" · the Iltzam brand film world.
//
// ONE continuous tactile world: a company cutaway on warm ivory, threaded by a
// PHYSICAL RIBBON — a layered paper band (ivory face, graphite underside,
// visible fold creases) that unfolds left→right through the whole film and
// carries printed editorial type: DAY 1 / DAY 20 / DAY 60 / DAY 90 and
// DIAGNOSE / BUILD / OPERATIONALISE. The camera is one slow continuous
// world-translate along the ribbon (a whole-scene transform) that never
// resets. Every element is a pure function of MASTER time t (0…90):
// no hooks, no state, no randomness — frames render identically on the
// server (poster) and in the rAF loop (player).
//
// Vocabulary
//   · Fig        — silhouette-with-rim-light people (graphite fill, warm rim)
//   · Doc        — the folded-corner paper document; NEVER dots
//   · Ribbon     — the star: the two-tone paper band with printed type
//   · InspectFrame — thin graphite rulers/brackets that measure real objects
// Palette: warm ivory paper (#efeadf / #e8e2d6), graphite #26292e, ink blue
// #1c2740, muted emerald #0d6f64, warm stone #b9b2a6, amber #b0762a / coral
// #a53b2a as risk accents only. Soft shadows; a low-opacity hatch for grain.
// FORBIDDEN and absent: glowing networks, node maps, particles, dashboards,
// shields, padlocks, dark cyber voids.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactElement } from "react";
import { clamp01, easeIn, easeInOut, easeOut, mix, sub } from "./math";

/* ── Palette ────────────────────────────────────────────────────────────── */

const BG = "#efeadf"; // warm ivory canvas
const BG2 = "#e8e2d6"; // ground plane
const PAPER = "#f8f4ea"; // document face
const PAPER_EDGE = "#c9c1af";
const PAPER_FOLD = "#e3dcc9";
const RIB_FACE = "#f4efe2"; // ribbon face
const GRAPHITE = "#26292e";
const GRAPHITE_SOFT = "#3a3e44";
const INKBLUE = "#1c2740";
const EMERALD = "#0d6f64";
const EMERALD_DEEP = "#0a5a50";
const STONE = "#b9b2a6";
const STONE_DEEP = "#8a8375";
const AMBER = "#b0762a";
const CORAL = "#a53b2a";
const RIM = "#f3e9d2"; // the warm rim light on silhouettes
const ROOM = "#f7f3e8";

const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ── Stage / layout ─────────────────────────────────────────────────────── */

export const STAGE_W = 960;
export const STAGE_H = 540;

export type Orientation = "16:9" | "9:16";

/** Per-orientation viewport: same world, one wrapper transform. */
export const LAYOUTS: Record<
  Orientation,
  { w: number; h: number; s: number; dy: number }
> = {
  "16:9": { w: 960, h: 540, s: 1, dy: 0 },
  "9:16": { w: 900, h: 1600, s: 1.85, dy: 300 },
};

const GROUND_Y = 440;
const RIB_X0 = 820; // where the report unfolds into the ribbon
const RIB_Y = 448;
const RIB_H = 64;
const DAY90_X = 6420; // the ribbon's end — the timeline stops exactly here

/* ── Timing tracks ──────────────────────────────────────────────────────── */

type Key = readonly [number, number] | readonly [number, number, "io" | "o" | "i"];

/** Piecewise keyframe track; optional easing on the segment ENDING at a key. */
function track(t: number, keys: readonly Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    const k = keys[i];
    if (t <= k[0]) {
      const prev = keys[i - 1];
      const f = (t - prev[0]) / (k[0] - prev[0]);
      const e =
        k[2] === "io" ? easeInOut(f) : k[2] === "o" ? easeOut(f) : k[2] === "i" ? easeIn(f) : f;
      return mix(prev[1], k[1], e);
    }
  }
  return keys[keys.length - 1][1];
}

/** THE CAMERA — one slow continuous world-translate; monotonic, never resets. */
const CAM_KEYS: readonly Key[] = [
  [0, 440],
  [5.5, 600, "io"],
  [9, 1010],
  [16.5, 2080],
  [29.5, 3280],
  [41.5, 4400],
  [43.5, 4640, "io"],
  [49.5, 4760],
  [52, 5060, "io"],
  [59.5, 5560],
  [61.5, 5940, "io"],
  [66.5, 6050],
  [69.5, 6310, "o"],
  [70.3, 6330],
  [77.5, 6700],
  [83, 7400, "io"],
  [86, 7440],
  [90, 7450],
];

/** The ribbon's unfolding leading edge; halts EXACTLY at DAY 90. */
const EDGE_KEYS: readonly Key[] = [
  [5.9, 824],
  [7.2, 1010],
  [9, 1580],
  [16.4, 2010],
  [29.5, 4010],
  [41.2, 5150],
  [50, 5820],
  [60, 6340],
  [66.5, 6392],
  [69.3, DAY90_X, "o"],
];

export const camAt = (t: number): number => track(t, CAM_KEYS);
const edgeAt = (t: number): number => track(t, EDGE_KEYS);

/* ── Shared defs ────────────────────────────────────────────────────────── */

export function FilmDefs(): ReactElement {
  return (
    <defs>
      <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.5" />
      </filter>
      <filter id="fShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={GRAPHITE} floodOpacity="0.16" />
      </filter>
      {/* subtle grain: a low-opacity noise-free hatch */}
      <pattern id="fHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
        <line x1="0" y1="0" x2="0" y2="7" stroke={GRAPHITE} strokeWidth="0.5" strokeOpacity="0.1" />
      </pattern>
      <radialGradient id="fVign" cx="0.5" cy="0.5" r="0.72">
        <stop offset="0.62" stopColor={GRAPHITE} stopOpacity="0" />
        <stop offset="1" stopColor={GRAPHITE} stopOpacity="0.08" />
      </radialGradient>
    </defs>
  );
}

/* ── Editorial type (dimensional: stone under-print + graphite face) ────── */

function EdType({
  x,
  y,
  text,
  size = 20,
  spacing = 0.22,
  o = 1,
  color = GRAPHITE,
  anchor = "middle",
  font = SERIF,
  weight = 600,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  spacing?: number;
  o?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  font?: string;
  weight?: number;
}): ReactElement | null {
  if (o <= 0.01) return null;
  const rise = 4 * (1 - easeOut(o));
  return (
    <g opacity={o} transform={`translate(0 ${rise})`}>
      <text
        x={x + 1.1}
        y={y + 1.8}
        textAnchor={anchor}
        fontFamily={font}
        fontSize={size}
        fontWeight={weight}
        letterSpacing={`${spacing}em`}
        fill={STONE}
        opacity={0.9}
      >
        {text}
      </text>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fontFamily={font}
        fontSize={size}
        fontWeight={weight}
        letterSpacing={`${spacing}em`}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

/* ── The folded-corner document — THE repeated shape; never dots ────────── */

function Doc({
  x,
  y,
  w = 40,
  h = 52,
  tint = 0,
  o = 1,
  rot = 0,
  foldT = 0,
  lines = 3,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** 0..1 amber risk tint that marks a stray copy. */
  tint?: number;
  o?: number;
  rot?: number;
  /** 0..1 — folds itself closed (used sparingly). */
  foldT?: number;
  lines?: number;
}): ReactElement | null {
  const grow = easeInOut(sub(foldT, 0, 0.55));
  const collapse = easeInOut(sub(foldT, 0.45, 1));
  const c = Math.min(mix(8, Math.min(w, h) * 0.9, grow), Math.min(w, h) * 0.94);
  const oo = o * (1 - 0.95 * collapse);
  if (oo <= 0.01) return null;
  const sy = 1 - 0.85 * collapse;
  return (
    <g
      opacity={oo}
      transform={`translate(${x + w / 2} ${y + h}) scale(1 ${sy}) rotate(${rot}) translate(${-(x + w / 2)} ${-(y + h)})`}
    >
      <path
        d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`}
        fill={PAPER}
        stroke={PAPER_EDGE}
        strokeWidth={1}
      />
      {tint > 0 ? (
        <path
          d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`}
          fill={AMBER}
          opacity={0.2 * tint}
        />
      ) : null}
      <path d={`M ${x + w - c} ${y} L ${x + w} ${y + c} L ${x + w - c} ${y + c} Z`} fill={PAPER_FOLD} />
      {w >= 26 && collapse < 0.2 ? (
        <g fill={STONE}>
          {Array.from({ length: lines }, (_, i) => (
            <rect
              key={i}
              x={x + 5}
              y={y + h * (0.34 + i * 0.18)}
              width={w * (0.6 - (i % 2) * 0.12)}
              height={2}
            />
          ))}
        </g>
      ) : null}
    </g>
  );
}

/* ── Silhouette-with-rim-light people ───────────────────────────────────── */

type Pose = "seated" | "standing" | "walk" | "bust";

const POSE_BODY: Record<Pose, string> = {
  seated:
    "M -26 0 C -34 -44 -31 -86 -16 -104 C -8 -112 8 -113 16 -105 C 23 -95 25 -74 23 -58 L 54 -54 C 63 -52 63 -38 55 -36 L 22 -36 L 22 0 Z",
  standing:
    "M -17 0 C -22 -58 -20 -112 -10 -138 C -4 -146 10 -146 15 -138 C 24 -110 22 -56 17 0 Z",
  walk:
    "M -16 -52 C -20 -100 -18 -122 -9 -140 C -3 -148 9 -148 14 -140 C 21 -116 20 -96 16 -52 Z M -14 -54 L -24 -2 L -14 -2 L -4 -54 Z M 4 -54 L 12 -2 L 22 -2 L 16 -54 Z",
  bust: "M -34 0 C -30 -34 -20 -52 0 -58 C 20 -52 30 -34 34 0 Z",
};

const POSE_HEAD: Record<Pose, { cx: number; cy: number; r: number }> = {
  seated: { cx: 6, cy: -124, r: 15 },
  standing: { cx: 2, cy: -156, r: 15 },
  walk: { cx: 2, cy: -158, r: 15 },
  bust: { cx: 0, cy: -74, r: 18 },
};

/**
 * A graphite silhouette with a warm rim light (paint-order stroke behind the
 * fill). Faces +x; flip mirrors. headTurn/lean/bun as in the previous film;
 * `accent` prints a small role chip on the chest (the DPO wears emerald).
 */
function Fig({
  x,
  y,
  s = 1,
  pose = "standing",
  flip = false,
  o = 1,
  headTurn = 0,
  lean = 0,
  bun = false,
  accent,
}: {
  x: number;
  y: number;
  s?: number;
  pose?: Pose;
  flip?: boolean;
  o?: number;
  headTurn?: number;
  lean?: number;
  bun?: boolean;
  accent?: string;
}): ReactElement | null {
  if (o <= 0.01) return null;
  const head = POSE_HEAD[pose];
  const chestY = pose === "seated" ? -84 : pose === "bust" ? -40 : -114;
  return (
    <g
      opacity={o}
      filter="url(#fSoft)"
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${lean})`}
    >
      <g fill={GRAPHITE} stroke={RIM} strokeWidth={2.2} strokeOpacity={0.55} paintOrder="stroke">
        <path d={POSE_BODY[pose]} />
        <g transform={`rotate(${headTurn} ${head.cx} ${head.cy + 12})`}>
          <circle cx={head.cx} cy={head.cy} r={head.r} />
          <path d={`M ${head.cx + head.r - 2} ${head.cy - 3} l 6 3.4 l -6 3.4 Z`} />
          {bun ? <circle cx={head.cx - head.r + 3} cy={head.cy - 7} r={5.5} /> : null}
        </g>
      </g>
      {accent ? <circle cx={4} cy={chestY} r={4} fill={accent} stroke={RIM} strokeWidth={1} /> : null}
    </g>
  );
}

function Shadow({ cx, cy = GROUND_Y - 2, rx = 30 }: { cx: number; cy?: number; rx?: number }): ReactElement {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={5} fill={GRAPHITE} opacity={0.09} />;
}

/* ── Small furniture ────────────────────────────────────────────────────── */

function Desk({
  x,
  w = 150,
  topY = 384,
  screen = false,
}: {
  x: number;
  w?: number;
  topY?: number;
  screen?: boolean;
}): ReactElement {
  return (
    <g>
      <Shadow cx={x + w / 2} rx={w * 0.55} />
      <rect x={x} y={topY} width={w} height={8} rx={2} fill={GRAPHITE_SOFT} />
      <rect x={x + 8} y={topY + 8} width={7} height={GROUND_Y - topY - 8} fill={GRAPHITE_SOFT} />
      <rect x={x + w - 15} y={topY + 8} width={7} height={GROUND_Y - topY - 8} fill={GRAPHITE_SOFT} />
      {screen ? (
        <g>
          <rect x={x + w / 2 - 26} y={topY - 40} width={52} height={36} rx={3} fill="#efe8d8" stroke={GRAPHITE} strokeWidth={1.5} />
          <g stroke={STONE} strokeWidth={2}>
            <line x1={x + w / 2 - 18} y1={topY - 30} x2={x + w / 2 + 16} y2={topY - 30} />
            <line x1={x + w / 2 - 18} y1={topY - 22} x2={x + w / 2 + 8} y2={topY - 22} />
            <line x1={x + w / 2 - 18} y1={topY - 14} x2={x + w / 2 + 12} y2={topY - 14} />
          </g>
          <rect x={x + w / 2 - 4} y={topY - 6} width={8} height={6} fill={GRAPHITE_SOFT} />
        </g>
      ) : null}
    </g>
  );
}

/** A labeled drawer cabinet — ink-blue plate, ivory body, sliding front. */
function DrawerUnit({
  x,
  label,
  w = 150,
  h = 88,
  riseT = 1,
  openT = 0,
}: {
  x: number;
  label: string;
  w?: number;
  h?: number;
  riseT?: number;
  openT?: number;
}): ReactElement | null {
  if (riseT <= 0.01) return null;
  /* snap into place: overshoot mid-rise, settle to 1 */
  const sy = riseT * (1 + 0.16 * Math.sin(clamp01(riseT) * Math.PI));
  const open = easeInOut(openT);
  return (
    <g transform={`translate(${x + w / 2} ${GROUND_Y - 4}) scale(1 ${sy}) translate(${-(x + w / 2)} ${-(GROUND_Y - 4)})`}>
      <Shadow cx={x + w / 2} rx={w * 0.55} />
      <rect x={x} y={GROUND_Y - 4 - h} width={w} height={h} rx={3} fill="#f1ebdc" stroke={GRAPHITE} strokeWidth={1.4} />
      <rect x={x} y={GROUND_Y - 4 - h} width={w} height={20} rx={3} fill={INKBLUE} />
      <text
        x={x + w / 2}
        y={GROUND_Y - 4 - h + 13.5}
        textAnchor="middle"
        fontFamily={SANS}
        fontSize={8.4}
        fontWeight={600}
        letterSpacing="0.09em"
        fill={BG}
      >
        {label}
      </text>
      {open > 0.02 ? (
        <rect x={x + 9} y={GROUND_Y - 4 - h + 26} width={w - 18} height={20 * open} fill="#514c42" opacity={0.55} />
      ) : null}
      <g transform={`translate(0 ${20 * open})`}>
        <rect x={x + 9} y={GROUND_Y - 4 - h + 26} width={w - 18} height={h - 36} rx={2} fill="#e9e2d1" stroke={STONE} />
        <rect x={x + w / 2 - 13} y={GROUND_Y - 4 - h + 26 + (h - 36) / 2 - 2} width={26} height={4} rx={2} fill={GRAPHITE_SOFT} />
      </g>
    </g>
  );
}

/* ── Inspection frame: thin graphite rulers/brackets (never a light sweep) ─ */

function InspectFrame({
  x,
  y,
  w,
  h,
  p,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
}): ReactElement | null {
  if (p <= 0.01) return null;
  const L = 15;
  const m = 9; // margin around the object
  const x0 = x - m;
  const y0 = y - m;
  const x1 = x + w + m;
  const y1 = y + h + m;
  const corners = [
    `M ${x0} ${y0 + L} V ${y0} H ${x0 + L}`,
    `M ${x1 - L} ${y0} H ${x1} V ${y0 + L}`,
    `M ${x1} ${y1 - L} V ${y1} H ${x1 - L}`,
    `M ${x0 + L} ${y1} H ${x0} V ${y1 - L}`,
  ];
  const rulerP = easeOut(sub(p, 0.5, 1));
  const ticks = Math.floor((x1 - x0) / 13);
  return (
    <g stroke={GRAPHITE} strokeWidth={1.8} fill="none" opacity={0.92}>
      {corners.map((d, i) => {
        const cp = sub(p, i * 0.11, i * 0.11 + 0.34);
        return cp > 0 ? (
          <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cp} />
        ) : null;
      })}
      {rulerP > 0 ? (
        <g>
          <line x1={x0} y1={y0 - 8} x2={mix(x0, x1, rulerP)} y2={y0 - 8} strokeWidth={1.2} />
          {Array.from({ length: ticks + 1 }, (_, i) =>
            i / ticks <= rulerP ? (
              <line
                key={i}
                x1={x0 + ((x1 - x0) * i) / ticks}
                y1={y0 - 8}
                x2={x0 + ((x1 - x0) * i) / ticks}
                y2={y0 - (i % 4 === 0 ? 15 : 12)}
                strokeWidth={1.2}
              />
            ) : null,
          )}
        </g>
      ) : null}
    </g>
  );
}

/* ── Finding tag ────────────────────────────────────────────────────────── */

function FindingTag({
  ax,
  ay,
  tx,
  ty,
  title,
  note,
  o,
  accent = AMBER,
}: {
  ax: number;
  ay: number;
  tx: number;
  ty: number;
  title: string;
  note: string;
  o: number;
  accent?: string;
}): ReactElement | null {
  if (o <= 0.01) return null;
  const w = Math.max(title.length, note.length) * 6.6 + 26;
  const rise = 5 * (1 - easeOut(o));
  return (
    <g opacity={o}>
      <line x1={ax} y1={ay} x2={tx + 2} y2={ty + 20 + rise} stroke={GRAPHITE} strokeWidth={1.2} opacity={0.6} />
      <circle cx={ax} cy={ay} r={3} fill={accent} />
      <g transform={`translate(${tx} ${ty + rise})`} filter="url(#fShadow)">
        <rect width={w} height={40} rx={3} fill={PAPER} stroke={PAPER_EDGE} />
        <rect width={4} height={40} rx={1} fill={accent} />
        <text x={12} y={16.5} fontFamily={SANS} fontSize={9.8} fontWeight={700} letterSpacing="0.07em" fill={GRAPHITE}>
          {title}
        </text>
        <text x={12} y={31.5} fontFamily={SANS} fontSize={8.8} fill={STONE_DEEP}>
          {note}
        </text>
      </g>
    </g>
  );
}

/* ── Check chip (Operationalise) ────────────────────────────────────────── */

function CheckChip({ x, y, label, o }: { x: number; y: number; label: string; o: number }): ReactElement | null {
  if (o <= 0.01) return null;
  const w = label.length * 6.3 + 36;
  return (
    <g opacity={o} transform={`translate(${x - w / 2} ${y})`} filter="url(#fShadow)">
      <rect width={w} height={22} rx={11} fill="#f6f2e6" stroke={EMERALD} strokeWidth={1.2} />
      <path d="M 10 11.5 l 4 4.5 l 7 -9.5" fill="none" stroke={EMERALD} strokeWidth={2.2} strokeLinecap="round" />
      <text x={26} y={14.8} fontFamily={MONO} fontSize={8.6} letterSpacing="0.08em" fill={EMERALD_DEEP}>
        {label}
      </text>
    </g>
  );
}

/* ── THE RIBBON ─────────────────────────────────────────────────────────── */

const RIB_CREASES = [1240, 1520, 2760, 3220, 4060, 4700, 5480, 6120];

const DAY_MARKS: { x: number; label: string; from: number; to: number }[] = [
  { x: 880, label: "DAY 1", from: 900, to: 1000 },
  { x: 1980, label: "DAY 20", from: 2000, to: 2120 },
  { x: 4950, label: "DAY 60", from: 4970, to: 5090 },
  { x: 6330, label: "DAY 90", from: 6398, to: 6418 },
];

const PHASE_MARKS: { x: number; label: string; at: number }[] = [
  { x: 2200, label: "DIAGNOSE", at: 16.5 },
  { x: 3470, label: "BUILD", at: 30.0 },
  { x: 5080, label: "OPERATIONALISE", at: 50.0 },
];

function Ribbon({ t }: { t: number }): ReactElement | null {
  const edge = edgeAt(t);
  if (edge <= RIB_X0 + 4) return null;
  const o = sub(t, 6.2, 7.0); // fades in as the report becomes the band
  const halted = t >= 69.3;
  const flapW = halted ? 0 : (34 + 15 * Math.sin(t * 2.1)) * (1 - easeInOut(sub(t, 66.5, 69.3)));
  return (
    <g opacity={o}>
      {/* drop shadow of the whole band */}
      <rect x={RIB_X0} y={RIB_Y + RIB_H + 6} width={edge - RIB_X0} height={10} rx={4} fill={GRAPHITE} opacity={0.13} />
      {/* under-layer sliver along the top (the band is layered paper) */}
      <rect x={RIB_X0 - 4} y={RIB_Y - 4} width={edge - RIB_X0 + 4} height={RIB_H + 4} rx={2} fill="#d6cdb7" />
      {/* the ivory face */}
      <rect x={RIB_X0} y={RIB_Y} width={edge - RIB_X0} height={RIB_H} fill={RIB_FACE} stroke={PAPER_EDGE} strokeWidth={1} />
      <rect x={RIB_X0} y={RIB_Y} width={edge - RIB_X0} height={3} fill="#fbf8ef" />
      <rect x={RIB_X0} y={RIB_Y + RIB_H - 7} width={edge - RIB_X0} height={7} fill={STONE} opacity={0.4} />
      {/* crisp edges so the band reads against the ground */}
      <line x1={RIB_X0} y1={RIB_Y} x2={edge} y2={RIB_Y} stroke={GRAPHITE} strokeWidth={0.8} opacity={0.42} />
      <line x1={RIB_X0} y1={RIB_Y + RIB_H} x2={edge} y2={RIB_Y + RIB_H} stroke={GRAPHITE} strokeWidth={0.8} opacity={0.35} />
      {/* the paper's bottom edge (thickness) */}
      <rect x={RIB_X0} y={RIB_Y + RIB_H} width={edge - RIB_X0} height={5} fill="#cfc6ae" />

      {/* start fold — where the report was folded into the band */}
      <path
        d={`M ${RIB_X0} ${RIB_Y} L ${RIB_X0 + 24} ${RIB_Y} L ${RIB_X0 + 10} ${RIB_Y + RIB_H} L ${RIB_X0 - 8} ${RIB_Y + RIB_H} Z`}
        fill={GRAPHITE}
        opacity={0.88}
      />

      {/* fold creases — the graphite underside shows at each twist */}
      {RIB_CREASES.map((cx) =>
        cx < edge - 40 ? (
          <g key={cx}>
            <path
              d={`M ${cx - 15} ${RIB_Y} L ${cx + 11} ${RIB_Y} L ${cx + 23} ${RIB_Y + RIB_H} L ${cx - 3} ${RIB_Y + RIB_H} Z`}
              fill={GRAPHITE}
              opacity={0.86}
            />
            <line x1={cx + 11} y1={RIB_Y} x2={cx + 23} y2={RIB_Y + RIB_H} stroke="#4a4e55" strokeWidth={1.5} />
            <line x1={cx + 34} y1={RIB_Y + 2} x2={cx + 42} y2={RIB_Y + RIB_H - 2} stroke={STONE} strokeWidth={1} opacity={0.5} />
          </g>
        ) : null,
      )}

      {/* the travelling fold flap at the leading edge */}
      {flapW > 1.5 ? (
        <path
          d={`M ${edge} ${RIB_Y} L ${edge + flapW} ${RIB_Y + 9} L ${edge + flapW - 13} ${RIB_Y + RIB_H + 5} L ${edge - 12} ${RIB_Y + RIB_H} Z`}
          fill="#31353b"
        />
      ) : null}
      {/* the finished end: a squared cap with a folded-back dog-ear */}
      {halted ? (
        <g>
          <rect x={DAY90_X - 5} y={RIB_Y} width={5} height={RIB_H} fill={GRAPHITE} opacity={0.85} />
          <path
            d={`M ${DAY90_X} ${RIB_Y} L ${DAY90_X - 26} ${RIB_Y} L ${DAY90_X} ${RIB_Y + 26} Z`}
            fill="#31353b"
          />
        </g>
      ) : null}

      {/* DAY markers printed on the face as the fold passes them */}
      {DAY_MARKS.map((d) => {
        const po = sub(edge, d.from, d.to);
        const big = d.label === "DAY 90";
        return (
          <g key={d.label} opacity={po}>
            <line x1={d.x} y1={RIB_Y + 7} x2={d.x} y2={RIB_Y + 17} stroke={GRAPHITE} strokeWidth={big ? 2.4 : 1.6} />
            <EdType
              x={d.x}
              y={RIB_Y + 42}
              text={d.label}
              size={big ? 18 : 14.5}
              spacing={0.18}
              o={po}
              color={big ? INKBLUE : GRAPHITE}
            />
            {big ? (
              <rect x={d.x - 40} y={RIB_Y + 49} width={80 * po} height={2} fill={INKBLUE} />
            ) : null}
          </g>
        );
      })}

      {/* phase names printed as each phase begins */}
      {PHASE_MARKS.map((ph) => (
        <EdType
          key={ph.label}
          x={ph.x}
          y={RIB_Y + 44}
          text={ph.label}
          size={26}
          spacing={0.3}
          anchor="start"
          o={sub(t, ph.at, ph.at + 1.5)}
          color={GRAPHITE}
        />
      ))}
    </g>
  );
}

/* ── The company cutaway (opening: tangled · closing: transformed) ──────── */

const ROLE_CHIPS = ["HR", "IT", "SALES", "FINANCE", "SUPPORT"];

function Cutaway({ x, t, ordered }: { x: number; t: number; ordered: boolean }): ReactElement {
  const W = 640;
  const roofY = 156;
  const midY = 296;
  /* desk positions per room: [roomX, floorY] */
  const rooms: { rx: number; fy: number; flip: boolean }[] = [
    { rx: x + 24, fy: GROUND_Y, flip: false },
    { rx: x + 238, fy: GROUND_Y, flip: true },
    { rx: x + 452, fy: GROUND_Y, flip: false },
    { rx: x + 24, fy: midY, flip: true },
    { rx: x + 238, fy: midY, flip: false },
  ];
  /* the paper mess accumulating in the opening (clamped; frozen when ordered) */
  const mess = ordered ? 0 : 1;
  const acc = (i: number, k: number) => (ordered ? 1 : sub(t, 0.7 + i * 0.55 + k * 0.95, 1.1 + i * 0.55 + k * 0.95));
  return (
    <g>
      <Shadow cx={x + W / 2} cy={GROUND_Y} rx={W * 0.54} />
      {/* shell */}
      <rect x={x} y={roofY} width={W} height={GROUND_Y - roofY} fill={ROOM} stroke={GRAPHITE} strokeWidth={3} />
      <rect x={x - 8} y={roofY - 9} width={W + 16} height={9} rx={2} fill={GRAPHITE} />
      <rect x={x} y={midY} width={W} height={6} fill={GRAPHITE} opacity={0.85} />
      <rect x={x + 214} y={roofY} width={5} height={GROUND_Y - roofY} fill={GRAPHITE} opacity={0.42} />
      <rect x={x + 428} y={roofY} width={5} height={GROUND_Y - roofY} fill={GRAPHITE} opacity={0.42} />

      {/* rooms: desk + worker + papers */}
      {rooms.map((r, i) => {
        const topY = r.fy - 52;
        return (
          <g key={i}>
            <rect x={r.rx + 12} y={topY} width={128} height={6} rx={2} fill={GRAPHITE_SOFT} />
            <rect x={r.rx + 18} y={topY + 6} width={5} height={46} fill={GRAPHITE_SOFT} />
            <rect x={r.rx + 130} y={topY + 6} width={5} height={46} fill={GRAPHITE_SOFT} />
            <Fig
              x={r.rx + 108}
              y={r.fy - 2}
              s={0.52}
              pose="seated"
              flip={r.flip}
              bun={i === 1 || i === 4}
              headTurn={4 * Math.sin(t * 0.85 + i * 2.1)}
            />
            {/* stacks — tilted + amber-tinted while tangled; square + owned when ordered */}
            {[0, 1, 2].map((k) => (
              <Doc
                key={k}
                x={r.rx + 26 + (ordered ? 0 : (k % 2) * 7 - 3)}
                y={topY - 26 - k * 9}
                w={30}
                h={26}
                rot={ordered ? 0 : (k % 2 === 0 ? -7 : 9) * mess}
                tint={ordered ? 0 : k === 1 ? 0.9 : 0.3}
                o={0.96 * acc(i, k)}
                lines={2}
              />
            ))}
            {!ordered ? (
              <Doc x={r.rx + 158} y={r.fy - 24} w={26} h={22} rot={14} tint={0.7} o={acc(i, 2)} lines={2} />
            ) : (
              <g filter="url(#fShadow)">
                <rect x={r.rx + 148} y={topY - 16} width={46} height={16} rx={8} fill="#f6f2e6" stroke={EMERALD} strokeWidth={1} />
                <circle cx={r.rx + 157} cy={topY - 8} r={3} fill={EMERALD} />
                <text x={r.rx + 165} y={topY - 4.6} fontFamily={MONO} fontSize={7.6} fill={EMERALD_DEEP}>
                  {ROLE_CHIPS[i]}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* lower-middle room extras: a small labeled cabinet when ordered */}
      {ordered ? (
        <g>
          <rect x={x + 320} y={GROUND_Y - 64} width={92} height={60} rx={2} fill="#f1ebdc" stroke={GRAPHITE} strokeWidth={1.2} />
          <rect x={x + 320} y={GROUND_Y - 64} width={92} height={14} rx={2} fill={INKBLUE} />
          <text x={x + 366} y={GROUND_Y - 54} textAnchor="middle" fontFamily={SANS} fontSize={6.8} letterSpacing="0.08em" fill={BG}>
            {"REGISTERS"}
          </text>
          <rect x={x + 327} y={GROUND_Y - 44} width={78} height={16} fill="#e9e2d1" stroke={STONE} />
          <rect x={x + 327} y={GROUND_Y - 24} width={78} height={16} fill="#e9e2d1" stroke={STONE} />
        </g>
      ) : null}

      {/* leader office — upper right room */}
      <g>
        <rect x={x + 470} y={midY - 34} width={140} height={6} rx={2} fill={GRAPHITE_SOFT} />
        <rect x={x + 478} y={midY - 28} width={5} height={28} fill={GRAPHITE_SOFT} />
        <rect x={x + 598} y={midY - 28} width={5} height={28} fill={GRAPHITE_SOFT} />
        <Fig
          x={x + 452}
          y={midY - 2}
          s={0.56}
          pose="standing"
          headTurn={ordered ? 0 : 8 * easeInOut(sub(t, 1.6, 2.4))}
          lean={ordered ? 0 : 5 * easeInOut(sub(t, 2.4, 3.4))}
        />
        {ordered ? (
          <g>
            <Fig x={x + 560} y={midY - 2} s={0.54} pose="standing" bun accent={EMERALD} />
            <Doc x={x + 505} y={midY - 56} w={34} h={22} lines={2} />
          </g>
        ) : null}
      </g>
    </g>
  );
}

/* ── 0–9 · the report lands; the cutaway reveal; report → ribbon ────────── */

const HEADLINE_1 = "New privacy obligations";
const HEADLINE_2 = "Inspection exposure rising";

function ReportCard({ x, y, w, h, textO }: { x: number; y: number; w: number; h: number; textO: number }): ReactElement {
  const k = w / 118; // designed at 118 wide
  return (
    <g transform={`translate(${x} ${y}) scale(${k} ${h / 80})`} filter="url(#fShadow)">
      <rect width={118} height={80} rx={2} fill={PAPER} stroke={PAPER_EDGE} />
      <g opacity={textO}>
        <rect x={8} y={7} width={44} height={4} fill={GRAPHITE} />
        <rect x={102} y={6} width={8} height={8} fill={CORAL} />
        <line x1={8} y1={16.5} x2={110} y2={16.5} stroke={PAPER_EDGE} />
        <text x={8} y={30} fontFamily={SERIF} fontSize={10.5} fontWeight={700} fill={GRAPHITE}>
          {HEADLINE_1}
        </text>
        <text x={8} y={44} fontFamily={SERIF} fontSize={9} fontWeight={600} fill={GRAPHITE_SOFT}>
          {HEADLINE_2}
        </text>
        <g fill={STONE}>
          <rect x={8} y={54} width={92} height={2.4} />
          <rect x={8} y={61} width={100} height={2.4} />
          <rect x={8} y={68} width={84} height={2.4} />
        </g>
      </g>
    </g>
  );
}

function OpeningCompany({ t }: { t: number }): ReactElement {
  /* facade slides away — the cutaway reveal */
  const reveal = easeInOut(sub(t, 1.0, 2.6));
  /* the report flies in and lands on the leader's desk */
  const land = easeOut(sub(t, 0.4, 1.7));
  /* then lifts and unfolds into the ribbon (match transition) */
  const unfold = easeInOut(sub(t, 5.5, 7.2));
  const gone = t >= 7.25;
  const rx = unfold > 0 ? mix(598, RIB_X0, unfold) : mix(940, 598, land);
  const ry = unfold > 0 ? mix(186, RIB_Y, unfold) : mix(96, 186, land);
  const rw = unfold > 0 ? mix(118, Math.max(120, edgeAt(t) - RIB_X0), unfold) : 118;
  const rh = unfold > 0 ? mix(80, RIB_H, unfold) : 80;
  const rrot = unfold > 0 ? 0 : mix(16, -1.5, land);
  const reportO = 1 - sub(t, 6.8, 7.25);
  return (
    <g>
      <Cutaway x={120} t={t} ordered={false} />
      {/* facade (the closed building) fading to reveal the working interior */}
      {reveal < 1 ? (
        <g opacity={1 - reveal}>
          <rect x={120} y={156} width={640} height={GROUND_Y - 156} fill="#e6dfcd" stroke={GRAPHITE} strokeWidth={3} />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => (
              <rect
                key={`${c}-${r}`}
                x={168 + c * 214}
                y={196 + r * 140}
                width={120}
                height={78}
                fill="#d8d0bc"
                stroke={GRAPHITE_SOFT}
                strokeWidth={1.5}
              />
            )),
          )}
        </g>
      ) : null}
      {/* the report — lands on the desk, later unfolds into the ribbon */}
      {t >= 0.35 && !gone ? (
        <g opacity={reportO}>
          <g transform={`rotate(${rrot} ${rx + rw / 2} ${ry + rh / 2})`}>
            <ReportCard x={rx} y={ry} w={rw} h={rh} textO={1 - sub(t, 6.2, 6.9)} />
          </g>
        </g>
      ) : null}
    </g>
  );
}

/* ── 9–16.5 · the disorganized web ──────────────────────────────────────── */

function FlyDoc({
  t,
  t0,
  t1,
  from,
  to,
  arc = 46,
  tint = 1,
  fade = false,
}: {
  t: number;
  t0: number;
  t1: number;
  from: [number, number];
  to: [number, number];
  arc?: number;
  tint?: number;
  fade?: boolean;
}): ReactElement | null {
  const k = sub(t, t0, t1);
  if (k <= 0 || k >= 1) return null;
  const e = easeInOut(k);
  return (
    <Doc
      x={mix(from[0], to[0], e)}
      y={mix(from[1], to[1], e) - arc * Math.sin(Math.PI * e)}
      w={34}
      h={42}
      tint={tint}
      rot={10 * Math.sin(e * 6)}
      o={fade ? 1 - sub(k, 0.8, 1) : 1}
      lines={2}
    />
  );
}

function WebSection({ t }: { t: number }): ReactElement {
  const labelO = sub(t, 10.4, 11.8);
  const pile = (n: number) => (ordinal: number) => sub(t, 9 + ordinal * (7 / n), 9.4 + ordinal * (7 / n));
  const p1 = pile(4);
  return (
    <g>
      {/* two desks */}
      <Desk x={1080} screen />
      <Fig x={1188} y={GROUND_Y - 2} s={0.62} pose="seated" flip headTurn={5 * Math.sin(t * 0.8)} />
      <Desk x={1400} screen />
      <Fig x={1392} y={GROUND_Y - 2} s={0.62} pose="seated" bun headTurn={4 * Math.sin(t * 0.7 + 2)} />
      {/* growing piles */}
      {[0, 1, 2, 3].map((k) => (
        <Doc key={k} x={1096 + (k % 2) * 9} y={352 - k * 10} w={34} h={28} rot={k % 2 ? 8 : -6} tint={0.5} o={p1(k)} lines={2} />
      ))}
      {[0, 1, 2].map((k) => (
        <Doc key={k} x={1500 - (k % 2) * 8} y={352 - k * 10} w={34} h={28} rot={k % 2 ? -9 : 5} tint={0.5} o={p1(k + 1)} lines={2} />
      ))}
      {/* stray copies on the floor */}
      <Doc x={1256} y={GROUND_Y - 22} w={30} h={22} rot={18} tint={0.8} o={sub(t, 11.5, 12.1)} lines={2} />
      <Doc x={1560} y={GROUND_Y - 20} w={28} h={20} rot={-12} tint={0.8} o={sub(t, 13.2, 13.8)} lines={2} />

      {/* papers duplicating: desk → desk → archive → vendor edge */}
      <FlyDoc t={t} t0={9.6} t1={10.9} from={[1130, 300]} to={[1450, 302]} />
      <FlyDoc t={t} t0={10.8} t1={12.1} from={[1450, 302]} to={[1694, 262]} />
      <FlyDoc t={t} t0={12.4} t1={13.7} from={[1130, 300]} to={[1322, 372]} fade />
      <FlyDoc t={t} t0={13.8} t1={15.1} from={[1710, 300]} to={[1856, 300]} fade />
      <FlyDoc t={t} t0={14.6} t1={15.9} from={[1450, 302]} to={[1858, 330]} fade />

      {/* a clerk carrying yet another copy toward the archive */}
      {t > 10.5 && t < 13.4 ? (
        <g opacity={1 - sub(t, 13.0, 13.4)}>
          <Fig x={mix(1500, 1614, easeInOut(sub(t, 10.5, 13.2)))} y={GROUND_Y - 2} s={0.66} pose="walk" />
          <Doc x={mix(1516, 1630, easeInOut(sub(t, 10.5, 13.2)))} y={GROUND_Y - 96} w={26} h={32} tint={0.8} lines={2} />
        </g>
      ) : null}

      {/* an opaque partition papers slip behind */}
      <rect x={1310} y={302} width={24} height={GROUND_Y - 302} fill={STONE} opacity={0.95} />
      <rect x={1310} y={302} width={24} height={6} fill={GRAPHITE} opacity={0.4} />

      {/* the archive shelf */}
      <g>
        <Shadow cx={1720} rx={80} />
        <rect x={1650} y={228} width={140} height={GROUND_Y - 228} fill="#f1ebdc" stroke={GRAPHITE} strokeWidth={2} />
        {[0, 1, 2].map((r) => (
          <line key={r} x1={1650} y1={294 + r * 66} x2={1790} y2={294 + r * 66} stroke={GRAPHITE} strokeWidth={2} />
        ))}
        <line x1={1720} y1={228} x2={1720} y2={GROUND_Y} stroke={GRAPHITE} strokeWidth={1.4} opacity={0.6} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Doc
            key={i}
            x={1662 + (i % 2) * 70}
            y={238 + Math.floor(i / 2) * 66}
            w={26}
            h={44}
            rot={i % 2 ? 6 : -4}
            tint={0.4}
            o={i < 4 ? 1 : sub(t, 11.6 + i * 0.7, 12.1 + i * 0.7)}
            lines={2}
          />
        ))}
      </g>

      {/* the vendor edge — an opaque plane at the boundary of the company */}
      <g>
        <rect x={1846} y={236} width={46} height={GROUND_Y - 236} fill={GRAPHITE} opacity={0.94} />
        <rect x={1846} y={236} width={46} height={6} fill="#4a4e55" />
        <text
          x={1869}
          y={330}
          textAnchor="middle"
          fontFamily={SANS}
          fontSize={9}
          letterSpacing="0.22em"
          fill={BG}
          transform="rotate(-90 1869 330)"
        >
          {"THIRD PARTY"}
        </text>
      </g>

      {/* the label */}
      <EdType x={1430} y={136} text="A scattered web of customer data." size={21} spacing={0.06} o={labelO} weight={600} />
    </g>
  );
}

/* ── 16.5–29.5 · DIAGNOSE ───────────────────────────────────────────────── */

const FINDINGS = [
  { title: "SENSITIVE DATA", note: "Access too broad", accent: AMBER },
  { title: "CROSS-BORDER TRANSFER", note: "Review required", accent: AMBER },
  { title: "CONSENT EVIDENCE", note: "Missing", accent: CORAL },
  { title: "RETENTION PERIOD", note: "Undefined", accent: AMBER },
];

function DiagnoseSection({ t }: { t: number }): ReactElement {
  /* the inspector walks the line of objects, measuring one at a time */
  const ix = track(t, [
    [16.6, 1980],
    [17.3, 2062],
    [19.6, 2062],
    [20.4, 2408],
    [22.5, 2408],
    [23.3, 2762],
    [25.5, 2762],
    [26.3, 3062],
    [29.5, 3062],
  ]);
  const iWalking =
    (t > 16.6 && t < 17.3) ||
    (t > 19.6 && t < 20.4) ||
    (t > 22.5 && t < 23.3) ||
    (t > 25.5 && t < 26.3);
  return (
    <g>
      {/* the inspector (compliance) with her clipboard */}
      <Fig
        x={ix}
        y={GROUND_Y - 2}
        s={0.82}
        pose={iWalking ? "walk" : "standing"}
        bun
        accent={EMERALD}
        lean={iWalking ? 0 : 5}
        o={sub(t, 16.6, 17.2)}
      />
      {!iWalking && t > 17.2 ? (
        <rect x={ix + 12} y={322} width={15} height={21} rx={2} fill={PAPER} stroke={PAPER_EDGE} transform={`rotate(9 ${ix + 19} ${332})`} />
      ) : null}
      {/* object 1 — a workstation holding sensitive records */}
      <Desk x={2120} w={140} screen />
      <Fig x={2110} y={GROUND_Y - 2} s={0.6} pose="seated" />
      {[0, 1].map((k) => (
        <Doc key={k} x={2134} y={352 - k * 11} w={32} h={28} rot={k ? 7 : -5} tint={0.6} lines={2} />
      ))}
      <InspectFrame x={2120} y={310} w={140} h={122} p={sub(t, 17.2, 18.9)} />
      <FindingTag ax={2190} ay={318} tx={2196} ty={216} title={FINDINGS[0].title} note={FINDINGS[0].note} o={sub(t, 18.9, 19.8)} accent={FINDINGS[0].accent} />

      {/* object 2 — a record crossing the border between two posts */}
      <g>
        <rect x={2480} y={318} width={12} height={GROUND_Y - 318} fill={GRAPHITE_SOFT} />
        <rect x={2560} y={318} width={12} height={GROUND_Y - 318} fill={GRAPHITE_SOFT} />
        <line x1={2526} y1={252} x2={2526} y2={GROUND_Y} stroke={GRAPHITE} strokeWidth={1.6} strokeDasharray="7 6" opacity={0.65} />
        <Doc x={2506} y={330 + 4 * Math.sin(t * 1.4)} w={38} h={48} tint={0.8} rot={-4} />
      </g>
      <InspectFrame x={2478} y={300} w={96} h={132} p={sub(t, 20.2, 21.7)} />
      <FindingTag ax={2526} ay={308} tx={2540} ty={206} title={FINDINGS[1].title} note={FINDINGS[1].note} o={sub(t, 21.8, 22.7)} accent={FINDINGS[1].accent} />

      {/* object 3 — the consent form on its stand, checkbox row empty */}
      <g>
        <Shadow cx={2862} rx={40} />
        <line x1={2836} y1={GROUND_Y} x2={2862} y2={344} stroke={GRAPHITE_SOFT} strokeWidth={5} />
        <line x1={2888} y1={GROUND_Y} x2={2862} y2={344} stroke={GRAPHITE_SOFT} strokeWidth={5} />
        <g transform="rotate(-2 2862 300)">
          <rect x={2822} y={256} width={80} height={96} fill={PAPER} stroke={PAPER_EDGE} filter="url(#fShadow)" />
          <rect x={2830} y={266} width={40} height={4} fill={GRAPHITE} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={2830} y={282 + r * 18} width={9} height={9} fill="none" stroke={r === 2 ? CORAL : STONE} strokeWidth={1.6} />
              <rect x={2845} y={285 + r * 18} width={48} height={2.6} fill={STONE} />
            </g>
          ))}
        </g>
      </g>
      <InspectFrame x={2818} y={252} w={90} h={104} p={sub(t, 23.2, 24.7)} />
      <FindingTag ax={2862} ay={260} tx={2876} ty={196} title={FINDINGS[2].title} note={FINDINGS[2].note} o={sub(t, 24.8, 25.7)} accent={FINDINGS[2].accent} />

      {/* object 4 — the archive cabinet, one drawer ajar */}
      <g>
        <Shadow cx={3190} rx={70} />
        <rect x={3130} y={288} width={120} height={GROUND_Y - 288} fill="#f1ebdc" stroke={GRAPHITE} strokeWidth={2} />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={3138} y={298 + r * 48} width={104} height={38} fill="#e9e2d1" stroke={STONE} transform={r === 1 ? "translate(10 0)" : undefined} />
            <rect x={3178} y={314 + r * 48} width={24} height={4} rx={2} fill={GRAPHITE_SOFT} transform={r === 1 ? "translate(10 0)" : undefined} />
          </g>
        ))}
        <Doc x={3226} y={324} w={22} h={26} rot={24} tint={0.8} lines={2} />
      </g>
      <InspectFrame x={3130} y={288} w={120} h={148} p={sub(t, 25.8, 27.2)} />
      <FindingTag ax={3190} ay={296} tx={3204} ty={214} title={FINDINGS[3].title} note={FINDINGS[3].note} o={sub(t, 27.3, 28.2)} accent={FINDINGS[3].accent} />

      {/* compliance + IT lean in over the findings */}
      <Fig x={3316} y={GROUND_Y - 2} s={0.82} pose="standing" flip lean={-7 * easeInOut(sub(t, 26.6, 27.6))} o={sub(t, 24.5, 25.3)} accent={EMERALD} />
      {t > 24.5 ? <rect x={3290} y={330} width={16} height={22} rx={2} fill={PAPER} stroke={PAPER_EDGE} transform="rotate(8 3298 341)" opacity={sub(t, 24.5, 25.3)} /> : null}
      <Fig x={3372} y={GROUND_Y - 2} s={0.8} pose="standing" flip lean={-5 * easeInOut(sub(t, 27.0, 28.0))} o={sub(t, 25.0, 25.8)} />

      {/* the diagnosis summary */}
      <EdType
        x={3080}
        y={140}
        text="Data mapped · Gaps identified · Licensing requirements defined"
        size={14}
        spacing={0.05}
        font={MONO}
        weight={600}
        o={sub(t, 28.1, 29.3)}
      />
    </g>
  );
}

/* ── 29.5–41.5 · BUILD ──────────────────────────────────────────────────── */

const DRAWERS: { x: number; label: string; at: number }[] = [
  { x: 3760, label: "CONSENT REGISTER", at: 34.7 },
  { x: 3940, label: "BREACH LOG", at: 35.8 },
  { x: 4120, label: "PROCESSING REGISTER", at: 36.9 },
  { x: 4300, label: "RETENTION SCHEDULE", at: 38.0 },
];

function BuildSection({ t }: { t: number }): ReactElement {
  /* the diagnosed document laid on the ribbon… */
  const layT = easeOut(sub(t, 29.6, 30.4));
  /* …unfolds into a floor plan */
  const openT = easeInOut(sub(t, 30.5, 32.3));
  const drawP = sub(t, 31.4, 33.4);
  /* structure rises */
  const wallL = easeOut(sub(t, 31.6, 32.4));
  const wallR = easeOut(sub(t, 32.6, 33.4));
  const shelfT = easeOut(sub(t, 33.6, 34.4));
  const roofT = easeOut(sub(t, 34.4, 35.2));
  const planW = mix(46, 220, openT);
  const planH = mix(56, 152, openT);
  const planX = mix(3450, 3428, openT);
  const planY = mix(mix(300, 402, layT), 252, openT);
  return (
    <g>
      {/* the plan document (on/above the ribbon) */}
      {t > 29.6 ? (
        <g filter="url(#fShadow)">
          <rect x={planX} y={planY} width={planW} height={planH} fill={PAPER} stroke={PAPER_EDGE} />
          <rect x={planX} y={planY} width={planW} height={planH} fill={AMBER} opacity={0.1 * (1 - openT)} />
          {/* crease lines from the unfold */}
          <line x1={planX + planW / 3} y1={planY} x2={planX + planW / 3} y2={planY + planH} stroke={STONE} strokeWidth={1} opacity={0.8} />
          <line x1={planX + (2 * planW) / 3} y1={planY} x2={planX + (2 * planW) / 3} y2={planY + planH} stroke={STONE} strokeWidth={1} opacity={0.8} />
          <line x1={planX} y1={planY + planH / 2} x2={planX + planW} y2={planY + planH / 2} stroke={STONE} strokeWidth={1} opacity={0.6} />
          {openT > 0.6 ? (
            <g opacity={sub(openT, 0.6, 1)}>
              <text x={planX + 10} y={planY + 16} fontFamily={MONO} fontSize={8.5} letterSpacing="0.14em" fill={GRAPHITE}>
                {"COMPLIANCE FRAMEWORK — PLAN"}
              </text>
              <g stroke={INKBLUE} strokeWidth={1.4} fill="none">
                <path d={`M ${planX + 14} ${planY + 30} h 90 v 50 h -90 Z`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sub(drawP, 0, 0.45)} />
                <path d={`M ${planX + 118} ${planY + 30} h 88 v 108 h -88 Z`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sub(drawP, 0.3, 0.75)} />
                <path d={`M ${planX + 14} ${planY + 94} h 90 v 44 h -90 M ${planX + 46} ${planY + 94} v 12`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sub(drawP, 0.55, 1)} />
              </g>
            </g>
          ) : null}
        </g>
      ) : null}

      {/* the rising structure */}
      {wallL > 0 ? <rect x={3720} y={GROUND_Y - 4 - 176 * wallL} width={14} height={176 * wallL} fill={GRAPHITE} /> : null}
      {wallR > 0 ? <rect x={4456} y={GROUND_Y - 4 - 176 * wallR} width={14} height={176 * wallR} fill={GRAPHITE} /> : null}
      {shelfT > 0 ? (
        <g>
          <rect x={3734} y={332} width={722 * shelfT} height={8} fill={GRAPHITE_SOFT} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Doc key={i} x={3768 + i * 92} y={296} w={26} h={34} o={sub(shelfT, 0.3 + i * 0.13, 0.5 + i * 0.13)} lines={2} />
          ))}
        </g>
      ) : null}
      {roofT > 0 ? <rect x={mix(4095, 3712, roofT)} y={256} width={766 * roofT} height={11} rx={2} fill={GRAPHITE} /> : null}

      {/* the four labeled drawers snap into place */}
      {DRAWERS.map((d) => (
        <DrawerUnit
          key={d.label}
          x={d.x}
          label={d.label}
          riseT={easeOut(sub(t, d.at, d.at + 0.7))}
          openT={
            d.label === "BREACH LOG"
              ? Math.min(sub(t, 38.2, 38.7), 1 - sub(t, 39.5, 40.1))
              : d.label === "RETENTION SCHEDULE"
                ? Math.min(sub(t, 39.4, 39.9), 1 - sub(t, 40.6, 41.2))
                : 0
          }
        />
      ))}

      {/* figures place papers into the registers */}
      <Fig x={3908} y={GROUND_Y - 2} s={0.8} pose="standing" o={sub(t, 35.2, 36.0)} />
      <FlyDoc t={t} t0={38.4} t1={39.3} from={[3924, 336]} to={[4000, 392]} arc={26} tint={0.4} fade />
      <Fig x={4268} y={GROUND_Y - 2} s={0.8} pose="standing" bun o={sub(t, 36.2, 37.0)} />
      <FlyDoc t={t} t0={39.5} t1={40.4} from={[4284, 336]} to={[4360, 392]} arc={26} tint={0.4} fade />
      {/* a carrier walks material in, arriving as the placer takes over */}
      {t > 33.4 && t < 35.6 ? (
        <g opacity={1 - sub(t, 35.2, 35.6)}>
          <Fig x={mix(3640, 3892, easeInOut(sub(t, 33.4, 35.4)))} y={GROUND_Y - 2} s={0.78} pose="walk" />
          <Doc x={mix(3658, 3910, easeInOut(sub(t, 33.4, 35.4)))} y={GROUND_Y - 112} w={26} h={32} lines={2} />
        </g>
      ) : null}
    </g>
  );
}

/* ── 41.5–49.5 · the Data Protection Officer ────────────────────────────── */

const DUTIES = ["records", "consent", "incidents", "rights", "training"];
const DUTY_FROM: [number, number][] = [
  [4652, 262],
  [4760, 246],
  [4856, 264],
  [4918, 284],
  [4770, 228],
];

function DpoSection({ t }: { t: number }): ReactElement {
  const step = easeInOut(sub(t, 42.4, 44.6));
  const dpoX = mix(4700, 4548, step);
  return (
    <g>
      {/* the table */}
      <Shadow cx={4730} rx={170} />
      <rect x={4580} y={356} width={300} height={10} rx={3} fill={GRAPHITE_SOFT} />
      <rect x={4596} y={366} width={8} height={GROUND_Y - 366} fill={GRAPHITE_SOFT} />
      <rect x={4856} y={366} width={8} height={GROUND_Y - 366} fill={GRAPHITE_SOFT} />
      <Doc x={4650} y={334} w={30} h={20} lines={2} />
      <Doc x={4780} y={332} w={30} h={20} rot={-4} lines={2} />

      {/* the team */}
      <Fig x={4648} y={368} s={0.86} pose="bust" headTurn={-6 * step} />
      <Fig x={4756} y={368} s={0.86} pose="bust" headTurn={-8 * step} />
      <Fig x={4854} y={368} s={0.86} pose="bust" flip headTurn={8 * step} />
      <Fig x={4930} y={GROUND_Y - 2} s={0.82} pose="standing" flip lean={4 * step} />

      {/* one figure steps to the head position — and the duties settle to her */}
      <Fig
        x={dpoX}
        y={GROUND_Y - 2}
        s={0.88}
        pose={step > 0.05 && step < 0.95 ? "walk" : "standing"}
        flip
        bun
        accent={EMERALD}
      />

      {DUTIES.map((d, i) => {
        const settle = easeInOut(sub(t, 44.8 + i * 0.35, 46.0 + i * 0.35));
        const o = sub(t, 42.6 + i * 0.25, 43.2 + i * 0.25);
        const x = mix(DUTY_FROM[i][0], 4478, settle);
        const y = mix(DUTY_FROM[i][1], 268 + i * 23, settle);
        const w = d.length * 6.2 + 18;
        return (
          <g key={d} opacity={o}>
            {settle > 0.9 ? (
              <line x1={x + w / 2 + 2} y1={y + 9} x2={4536} y2={318} stroke={GRAPHITE} strokeWidth={1} opacity={0.45 * sub(settle, 0.9, 1)} />
            ) : null}
            <g transform={`translate(${x - w / 2} ${y})`} filter="url(#fShadow)">
              <rect width={w} height={18} rx={9} fill={PAPER} stroke={settle > 0.5 ? EMERALD : PAPER_EDGE} />
              <text x={w / 2} y={12.4} textAnchor="middle" fontFamily={MONO} fontSize={8.4} fill={GRAPHITE}>
                {d}
              </text>
            </g>
          </g>
        );
      })}

      <EdType x={4718} y={150} text="DATA PROTECTION OFFICER" size={19} spacing={0.22} o={sub(t, 45.3, 46.4)} />
      <EdType x={4718} y={176} text="ACCOUNTABILITY ASSIGNED" size={10.5} spacing={0.3} font={MONO} o={sub(t, 47.0, 48.0)} color={EMERALD_DEEP} />
    </g>
  );
}

/* ── 49.5–60 · OPERATIONALISE ───────────────────────────────────────────── */

function OpsSection({ t }: { t: number }): ReactElement {
  /* two staff flow through the doorway access check */
  const w1 = track(t, [
    [50.4, 4960],
    [52.0, 5024],
    [53.0, 5030],
    [54.8, 5210],
  ]);
  const w2 = track(t, [
    [55.6, 4960],
    [57.2, 5024],
    [58.0, 5030],
    [59.8, 5210],
  ]);
  const chip1 = Math.min(sub(t, 52.2, 52.8), 1 - sub(t, 55.6, 56.4));
  const chip1b = Math.min(sub(t, 57.3, 57.9), 1 - sub(t, 59.4, 60.2));
  const consentChip = Math.min(sub(t, 53.8, 54.4), 1 - sub(t, 56.6, 57.4));
  const retChip = Math.min(sub(t, 56.2, 56.8), 1 - sub(t, 59.6, 60.4));
  const send = easeInOut(sub(t, 55.2, 56.4));
  const sheetFold = sub(t, 57.0, 58.6);
  return (
    <g>
      {/* the doorway */}
      <Shadow cx={5070} rx={46} />
      <rect x={5040} y={300} width={10} height={GROUND_Y - 300} fill={GRAPHITE} />
      <rect x={5090} y={300} width={10} height={GROUND_Y - 300} fill={GRAPHITE} />
      <rect x={5032} y={290} width={76} height={11} rx={2} fill={GRAPHITE} />
      {t > 52.8 ? (
        <path d="M 5062 276 l 5 5.5 l 9 -11" fill="none" stroke={EMERALD} strokeWidth={2.6} strokeLinecap="round" opacity={Math.min(1, sub(t, 52.8, 53.2))} />
      ) : null}
      <CheckChip x={5070} y={240} label="ACCESS CHECK" o={Math.max(chip1, chip1b)} />
      {t > 50.4 && t < 54.8 ? <Fig x={w1} y={GROUND_Y - 2} s={0.78} pose="walk" /> : null}
      {t > 55.6 && t < 59.8 ? <Fig x={w2} y={GROUND_Y - 2} s={0.76} pose="walk" bun /> : null}

      {/* the marketing desk: consent check before the send */}
      <Desk x={5260} w={150} screen />
      <Fig x={5392} y={GROUND_Y - 2} s={0.62} pose="seated" flip />
      {/* the envelope that waits for its consent check */}
      <g transform={`translate(${mix(5306, 5470, send)} ${mix(316, 296, send)}) rotate(${8 * send})`} opacity={1 - sub(t, 56.0, 56.6)}>
        <rect width={40} height={26} fill={PAPER} stroke={PAPER_EDGE} />
        <path d="M 0 0 L 20 14 L 40 0" fill="none" stroke={STONE} strokeWidth={1.4} />
      </g>
      <CheckChip x={5326} y={252} label="CONSENT CHECK" o={consentChip} />

      {/* the archive: retention check */}
      <g>
        <Shadow cx={5600} rx={70} />
        <rect x={5540} y={296} width={120} height={GROUND_Y - 296} fill="#f1ebdc" stroke={GRAPHITE} strokeWidth={2} />
        <rect x={5540} y={296} width={120} height={16} fill={INKBLUE} />
        <text x={5600} y={307.5} textAnchor="middle" fontFamily={SANS} fontSize={7.6} letterSpacing="0.14em" fill={BG}>
          {"ARCHIVE"}
        </text>
        {[0, 1].map((r) => (
          <rect key={r} x={5548} y={320 + r * 52} width={104} height={40} fill="#e9e2d1" stroke={STONE} />
        ))}
      </g>
      <Fig x={5516} y={GROUND_Y - 2} s={0.78} pose="standing" o={sub(t, 55.0, 55.8)} />
      <FlyDoc t={t} t0={57.0} t1={57.9} from={[5530, 330]} to={[5596, 336]} arc={20} tint={0} fade />
      <CheckChip x={5600} y={256} label="RETENTION CHECK" o={retChip} />

      {/* a policy sheet folds into the doorway */}
      {t > 56.4 && sheetFold < 1 ? (
        <Doc
          x={5052}
          y={mix(238, 322, easeInOut(sheetFold))}
          w={38}
          h={48}
          foldT={sheetFold}
          o={sub(t, 56.4, 56.9)}
        />
      ) : null}
      {/* Printed while the recorded line "Compliance moves from paper to
          practice" plays (master ≈52.8–56.8 through the SYNC warp). */}
      <EdType x={5350} y={134} text="FROM POLICY TO PRACTICE" size={18} spacing={0.18} o={sub(t, 53.2, 54.4)} />
    </g>
  );
}

/* ── 60–66.5 · the simulated breach (amber, contained — never red panic) ── */

function BreachSection({ t }: { t: number }): ReactElement {
  const amberO = Math.min(sub(t, 60.0, 60.6), 1 - sub(t, 65.3, 66.3));
  const escape = easeOut(sub(t, 60.3, 61.5)) * (1 - easeInOut(sub(t, 62.3, 63.3)));
  const itWalk = easeInOut(sub(t, 60.8, 62.0));
  const seal = sub(t, 62.0, 63.2);
  const dpoLine = sub(t, 62.6, 63.4);
  const logOpen = Math.min(sub(t, 63.4, 63.9), 1 - sub(t, 64.8, 65.4));
  const strays: [number, number, number, number, number][] = [
    /* [x0, y0, x1, y1, rot] */
    [6058, 296, 6152, 262, 18],
    [6066, 356, 6168, 348, -14],
    [6008, 282, 6086, 218, 10],
  ];
  return (
    <g>
      {/* the breach-log drawer (built in phase two, used now) */}
      <DrawerUnit x={5738} label="BREACH LOG" w={132} h={84} riseT={1} openT={logOpen} />
      <FlyDoc t={t} t0={63.6} t1={64.5} from={[5960, 340]} to={[5780, 384]} arc={30} tint={0.5} fade />

      {/* the system slab holding customer records */}
      <g>
        <Shadow cx={5980} rx={140} />
        <rect x={5850} y={262} width={260} height={168} rx={8} fill="#f3eee1" stroke={GRAPHITE} strokeWidth={2} />
        <rect x={5850} y={262} width={260} height={168} rx={8} fill={AMBER} opacity={0.16 * amberO} />
        <rect x={5850} y={262} width={260} height={22} rx={8} fill={INKBLUE} />
        <text x={5980} y={277} textAnchor="middle" fontFamily={SANS} fontSize={8.6} letterSpacing="0.18em" fill={BG}>
          {"CUSTOMER RECORDS"}
        </text>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const idx = r * 3 + c;
            const isStray = idx === 2 || idx === 5 || idx === 0 ? false : false;
            return isStray ? null : (
              <Doc key={idx} x={5872 + c * 82} y={296 + r * 44} w={26} h={32} lines={2} o={0.92} />
            );
          }),
        )}
        {/* amber stroke while the simulation runs */}
        <rect x={5850} y={262} width={260} height={168} rx={8} fill="none" stroke={AMBER} strokeWidth={2.4} opacity={amberO} />
        {/* the containment redraw — the outline closes emerald */}
        {seal > 0 ? (
          <line x1={6110} y1={262 + 168 * (1 - seal)} x2={6110} y2={430} stroke={EMERALD} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        ) : null}
      </g>

      {/* three records drift outside the outline… and are brought back */}
      {strays.map((s, i) =>
        escape > 0.01 ? (
          <Doc
            key={i}
            x={mix(s[0], s[1], escape)}
            y={mix(s[2] - 40, s[3] - 40, escape) + 40}
            w={26}
            h={32}
            tint={1}
            rot={s[4] * escape}
            lines={2}
          />
        ) : null,
      )}

      {/* alert dot — coral, small, honest */}
      {t > 60.15 && t < 62.6 ? (
        <circle cx={6104} cy={256} r={5} fill={CORAL} opacity={0.55 + 0.45 * Math.sin(t * 10)} />
      ) : null}

      {/* IT isolates; the DPO is notified */}
      <Fig x={mix(6220, 6140, itWalk)} y={GROUND_Y - 2} s={0.8} pose={itWalk < 1 ? "walk" : "standing"} flip o={sub(t, 60.8, 61.2)} />
      <Fig x={6238} y={GROUND_Y - 2} s={0.8} pose="standing" flip bun accent={EMERALD} o={sub(t, 62.2, 62.8)} />
      {dpoLine > 0 ? (
        <line
          x1={6112}
          y1={268}
          x2={mix(6112, 6226, dpoLine)}
          y2={mix(268, 296, dpoLine)}
          stroke={GRAPHITE}
          strokeWidth={1.4}
          opacity={0.6 * (1 - sub(t, 65.0, 65.8))}
        />
      ) : null}
      <CheckChip x={6180} y={240} label="DPO NOTIFIED" o={Math.min(sub(t, 62.9, 63.4), 1 - sub(t, 64.8, 65.4))} />

      {/* the audit-trail ticks under the slab */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M ${5886 + i * 46} 443 l 4 4.5 l 7 -9`}
          fill="none"
          stroke={EMERALD}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={sub(t, 63.5 + i * 0.35, 63.9 + i * 0.35)}
        />
      ))}

      {/* status line */}
      <EdType x={5980} y={152} text="SIMULATION ACTIVE" size={13} spacing={0.25} font={MONO} color={AMBER} o={Math.min(sub(t, 60.4, 61.0), 1 - sub(t, 62.4, 62.8))} />
      <EdType x={5980} y={152} text="INCIDENT CONTAINED" size={13} spacing={0.25} font={MONO} o={Math.min(sub(t, 62.8, 63.3), 1 - sub(t, 64.7, 65.1))} />
      <EdType x={5980} y={152} text="RESPONSE VERIFIED" size={13} spacing={0.25} font={MONO} color={EMERALD_DEEP} o={Math.min(sub(t, 65.1, 65.6), 1 - sub(t, 67.4, 68.0))} />
    </g>
  );
}

/* ── 70–78.5 · the evidence pack ────────────────────────────────────────── */

export const DOSSIER_TABS = [
  "GAP ASSESSMENT",
  "DATA INVENTORY",
  "CONTROL REGISTER",
  "CONSENT REGISTER",
  "BREACH LOG",
  "DPO APPOINTMENT",
  "TRAINING RECORDS",
  "SIMULATION RESULTS",
  "AUDIT TRAIL",
];

function DossierSection({ t }: { t: number }): ReactElement {
  const bodyO = sub(t, 69.8, 70.5);
  return (
    <g>
      {/* beyond the ribbon's end: the regulator's own timeline — neutral */}
      <g opacity={sub(t, 71.0, 72.0)}>
        <line x1={6470} y1={484} x2={8760} y2={484} stroke={STONE} strokeWidth={2.5} strokeDasharray="12 9" opacity={0.55} />
        <text x={6940} y={472} textAnchor="middle" fontFamily={SERIF} fontSize={12.5} fontStyle="italic" fill={STONE_DEEP} opacity={sub(t, 71.6, 72.6)}>
          {"Regulator review — external timeline"}
        </text>
      </g>

      <g opacity={bodyO}>
        <Shadow cx={6670} rx={150} />
        {/* the dossier: layered paper spine + body */}
        <g filter="url(#fShadow)">
          <rect x={6540} y={252} width={260} height={186} rx={3} fill="#f6f1e4" stroke={GRAPHITE} strokeWidth={2} />
          {/* page edges (the layered stack) */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={6788 - i * 3.5} y1={258} x2={6788 - i * 3.5} y2={432} stroke={STONE} strokeWidth={1} opacity={0.7} />
          ))}
          <rect x={6540} y={252} width={22} height={186} rx={3} fill={INKBLUE} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={6545} y1={286 + i * 56} x2={6557} y2={286 + i * 56} stroke={BG} strokeWidth={1.6} opacity={0.7} />
          ))}
          <text x={6580} y={286} fontFamily={MONO} fontSize={9.5} letterSpacing="0.16em" fill={GRAPHITE}>
            {"EVIDENCE PACK"}
          </text>
          <line x1={6580} y1={294} x2={6768} y2={294} stroke={PAPER_EDGE} />
          <text x={6580} y={310} fontFamily={SANS} fontSize={7.8} letterSpacing="0.1em" fill={STONE_DEEP}>
            {"ASSEMBLED DAY 71 — DAY 90"}
          </text>
        </g>

        {/* nine tab labels step out on the left as each paper slides in */}
        {DOSSIER_TABS.map((label, i) => {
          const o = sub(t, 70.4 + i * 0.78, 70.9 + i * 0.78);
          const y = 262 + i * 19;
          return (
            <g key={label} opacity={o} transform={`translate(${mix(10, 0, easeOut(o))} 0)`}>
              <rect x={6452} y={y} width={90} height={15} rx={2} fill={i % 2 ? "#efe8d8" : PAPER} stroke={STONE} />
              <text x={6537} y={y + 10.6} textAnchor="end" fontFamily={SANS} fontSize={6.9} letterSpacing="0.04em" fill={GRAPHITE}>
                {label}
              </text>
            </g>
          );
        })}
        {/* each figure slides a paper in */}
        {DOSSIER_TABS.map((label, i) => (
          <FlyDoc key={label} t={t} t0={70.4 + i * 0.78} t1={71.0 + i * 0.78} from={[6852, 320]} to={[6740, 262 + i * 19]} arc={24} tint={0} fade />
        ))}
        <Fig x={6862} y={GROUND_Y - 2} s={0.82} pose="standing" flip lean={4 * Math.abs(Math.sin(t * 1.6))} />
        <Fig x={mix(6960, 6906, easeInOut(sub(t, 71.0, 74.0)))} y={GROUND_Y - 2} s={0.78} pose={t < 74 ? "walk" : "standing"} flip bun o={sub(t, 70.8, 71.4)} />
      </g>

      {/* the stamps */}
      <g transform="rotate(-2 6640 190)">
        <EdType x={6640} y={166} text="EVIDENCE COMPLETE" size={13} spacing={0.2} font={MONO} o={sub(t, 76.6, 77.2)} />
        <EdType x={6640} y={192} text="INSPECTION-READY" size={15} spacing={0.24} font={MONO} color={EMERALD_DEEP} o={sub(t, 77.2, 77.8)} />
        <EdType x={6640} y={220} text="DAY 90" size={17} spacing={0.2} color={INKBLUE} o={sub(t, 77.8, 78.4)} />
      </g>
    </g>
  );
}

/* ── 78.5–90 · the transformed company · the dossier becomes the brand ──── */

const GHOST_DOCS: [number, number, number][] = [
  [7160, 240, -14],
  [7290, 200, 18],
  [7418, 300, -22],
  [7360, 388, 12],
  [7530, 236, -8],
  [7600, 350, 24],
  [7250, 356, -18],
  [7660, 262, 9],
  [7480, 178, -12],
  [7560, 408, 16],
];

function FinalCompany({ t }: { t: number }): ReactElement | null {
  if (t < 74) return null;
  const ghostO = sub(t, 78.4, 79.1) * (1 - easeInOut(sub(t, 79.6, 82.4)));
  return (
    <g>
      <Cutaway x={7080} t={t} ordered />
      <EdType x={7400} y={132} text="THE SAME COMPANY — DAY 90" size={11.5} spacing={0.3} font={MONO} color={STONE_DEEP} o={sub(t, 80.0, 81.2)} />
      {/* a brief ghost of the tangled version, dissolving into the ordered one */}
      {ghostO > 0.01 ? (
        <g opacity={0.5 * ghostO}>
          {GHOST_DOCS.map(([x, y, r], i) => (
            <Doc key={i} x={x} y={y} w={34} h={42} rot={r} tint={1} lines={2} />
          ))}
        </g>
      ) : null}
    </g>
  );
}

/** The dossier cover closes over the frame and carries the brand type. */
function BrandCover({ t, vw, vh }: { t: number; vw: number; vh: number }): ReactElement | null {
  if (t < 83.9) return null;
  const grow = easeInOut(sub(t, 84.2, 86.2));
  const w = mix(330, vw, grow);
  const h = mix(224, vh, grow);
  const x = (vw - w) / 2;
  const y = (vh - h) / 2 - mix(30, 0, grow);
  const o = sub(t, 84.2, 84.9);
  const line1 = sub(t, 85.3, 86.2);
  const line2 = sub(t, 86.5, 87.5);
  const foot = sub(t, 88.2, 89.2);
  const cy = y + h * 0.42;
  return (
    <g opacity={o}>
      <g filter="url(#fShadow)">
        <rect x={x} y={y} width={w} height={h} rx={mix(4, 0, grow)} fill={RIB_FACE} stroke={GRAPHITE} strokeWidth={2} />
        {/* the spine */}
        <rect x={x} y={y} width={mix(16, 34, grow)} height={h} fill={INKBLUE} />
        {/* tab edges, fading as the cover fills the frame */}
        {grow < 0.9 ? (
          <g opacity={1 - sub(grow, 0.4, 0.9)}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={x + w - 4} y={y + 24 + i * 30} width={10} height={14} rx={2} fill={PAPER} stroke={STONE} />
            ))}
          </g>
        ) : null}
        {/* inner rule frame */}
        <rect x={x + mix(26, 60, grow)} y={y + mix(18, 46, grow)} width={w - mix(44, 120, grow)} height={h - mix(36, 92, grow)} fill="none" stroke={STONE} strokeWidth={1} opacity={0.7} />
      </g>
      <EdType x={x + w / 2 + mix(8, 17, grow)} y={cy} text="ILTZAM" size={mix(24, 46, grow)} spacing={0.34} color={INKBLUE} o={sub(t, 84.5, 85.4)} weight={600} />
      <rect x={x + w / 2 - mix(40, 70, grow)} y={cy + mix(10, 20, grow)} width={mix(80, 140, grow) * line1} height={2} fill={EMERALD} />
      <EdType
        x={x + w / 2}
        y={cy + mix(34, 62, grow)}
        text="From scattered data to inspection-ready in 90 days."
        size={mix(11, 17, grow)}
        spacing={0.02}
        font={SERIF}
        weight={500}
        o={line1}
      />
      <EdType
        x={x + w / 2}
        y={cy + mix(56, 104, grow)}
        text="Diagnose. Build. Operationalise."
        size={mix(10, 14.5, grow)}
        spacing={0.16}
        font={MONO}
        color={EMERALD_DEEP}
        o={line2}
      />
      <EdType x={x + w / 2} y={y + h - mix(14, 36, grow)} text="AN ILTZAM FILM" size={8.5} spacing={0.3} font={MONO} color={STONE_DEEP} o={foot} />
    </g>
  );
}

/* ── The world, and the one moving camera over it ───────────────────────── */

function World({ t }: { t: number }): ReactElement {
  return (
    <g>
      {/* full-bleed paper sky + ground (covers both orientations) */}
      <rect x={-1600} y={-900} width={10800} height={900 + GROUND_Y} fill={BG} />
      <rect x={-1600} y={GROUND_Y} width={10800} height={1500} fill={BG2} />
      <line x1={-1600} y1={GROUND_Y} x2={9200} y2={GROUND_Y} stroke="#d7cfbc" strokeWidth={2} />
      <Ribbon t={t} />
      <OpeningCompany t={t} />
      <WebSection t={t} />
      <DiagnoseSection t={t} />
      <BuildSection t={t} />
      <DpoSection t={t} />
      <OpsSection t={t} />
      <BreachSection t={t} />
      <DossierSection t={t} />
      <FinalCompany t={t} />
    </g>
  );
}

/**
 * A master-cut frame at time t (0…90): the world under the continuous camera
 * translate, plus viewport-space grain, vignette and the brand cover.
 */
export function FilmStage({
  t,
  orientation = "16:9",
}: {
  t: number;
  orientation?: Orientation;
}): ReactElement {
  const L = LAYOUTS[orientation];
  const cx = camAt(t);
  return (
    <g>
      <rect width={L.w} height={L.h} fill={BG} />
      <g transform={`translate(${L.w / 2 - cx * L.s} ${L.dy}) scale(${L.s})`}>
        <World t={t} />
      </g>
      <rect width={L.w} height={L.h} fill="url(#fHatch)" opacity={0.5} />
      <rect width={L.w} height={L.h} fill="url(#fVign)" />
      <BrandCover t={t} vw={L.w} vh={L.h} />
    </g>
  );
}

/* ── Poster ─────────────────────────────────────────────────────────────── */

/**
 * The poster: the ribbon crossing the company cutaway, with the plan's name
 * printed as editorial type. Server-renderable — no hooks, no state.
 */
export function FilmPoster({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <FilmDefs />
      <rect width={STAGE_W} height={STAGE_H} fill={BG} />
      <rect y={430} width={STAGE_W} height={110} fill={BG2} />
      <line x1={0} y1={430} x2={STAGE_W} y2={430} stroke="#d7cfbc" strokeWidth={2} />

      {/* the company cutaway, left — mid-tangle */}
      <g transform="translate(-370 96) scale(0.78)">
        <Cutaway x={120} t={4.6} ordered={false} />
      </g>

      {/* the ribbon crossing the frame */}
      <g>
        <rect x={-10} y={368} width={980} height={9} rx={4} fill={GRAPHITE} opacity={0.08} transform="translate(0 64)" />
        <rect x={-14} y={358} width={988} height={68} fill="#d6cdb7" />
        <rect x={-10} y={362} width={980} height={64} fill={RIB_FACE} stroke={PAPER_EDGE} />
        <rect x={-10} y={362} width={980} height={3} fill="#fbf8ef" />
        <rect x={-10} y={419} width={980} height={7} fill={STONE} opacity={0.4} />
        <line x1={-10} y1={362} x2={970} y2={362} stroke={GRAPHITE} strokeWidth={0.8} opacity={0.42} />
        <line x1={-10} y1={426} x2={970} y2={426} stroke={GRAPHITE} strokeWidth={0.8} opacity={0.35} />
        <rect x={-10} y={426} width={980} height={5} fill="#cfc6ae" />
        {[210, 560, 836].map((cx) => (
          <path
            key={cx}
            d={`M ${cx - 15} 362 L ${cx + 11} 362 L ${cx + 23} 426 L ${cx - 3} 426 Z`}
            fill={GRAPHITE}
            opacity={0.86}
          />
        ))}
        <EdType x={96} y={404} text="DAY 1" size={14} spacing={0.18} />
        <EdType x={382} y={404} text="DIAGNOSE" size={15} spacing={0.26} />
        <EdType x={700} y={404} text="BUILD" size={15} spacing={0.26} />
        <EdType x={910} y={404} text="DAY 90" size={15} spacing={0.16} color={INKBLUE} />
      </g>

      {/* the title */}
      <EdType x={636} y={150} text="THE 90-DAY" size={44} spacing={0.2} color={GRAPHITE} />
      <EdType x={636} y={200} text="INSPECTION-READY PLAN" size={26} spacing={0.18} color={INKBLUE} />
      <rect x={520} y={222} width={232} height={2.4} fill={EMERALD} />
      <EdType x={636} y={252} text="DIAGNOSE · BUILD · OPERATIONALISE" size={11} spacing={0.2} font={MONO} color={STONE_DEEP} />

      {/* a figure walking the plan's direction */}
      <Fig x={860} y={438} s={0.8} pose="walk" />
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fHatch)" opacity={0.5} />
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fVign)" />
    </svg>
  );
}
