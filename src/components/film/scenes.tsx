// ─────────────────────────────────────────────────────────────────────────────
// scenes.tsx — "From Exposure to Control", the Iltizam brand film.
//
// One continuous 2.5D world: a single publicly listed company, crossed left to
// right by the 90-day inspection-ready plan. The master timeline IS the
// recorded narration's timeline (the trimmed voiceover at public/film/
// narration.m4a, 74.7s; the film holds the brand cover to 78s) — every beat
// constant below is a word timestamp measured from the recording.
//
// The film is a pure function of time: FilmStage(t) renders the exact frame
// for second t, on the server or in the browser. No component keeps state.
// The same purity powers the review stills (?filmt=), the MP4 export
// pipeline (scripts/export-film.ts renders frames through /film/frame), the
// poster and the reduced-motion fallback.
//
// Visual system: warm ivory world, graphite people with a warm rim light,
// ink-blue institutional surfaces, muted emerald for what is under control,
// restrained amber for risk, controlled red only inside the breach
// simulation. Depth comes from a slow-parallax backdrop, soft contact
// shadows, dimensional editorial type and occasional foreground occluders —
// never from glow, particles or networks.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactElement, ReactNode } from "react";
import { easeInOut, easeOut, envelope, mix, sub } from "./math";

/* ── Palette ────────────────────────────────────────────────────────────── */

const BG = "#efeadf"; // warm ivory air
const BG_FAR = "#e6e0d2"; // backdrop wash
const GROUND = "#e2dbcb"; // floor plane
const PAPER = "#f8f4ea";
const PAPER_EDGE = "#c9c1af";
const GRAPHITE = "#26292e";
const GRAPHITE_SOFT = "#3a3e44";
const INK = "#1c2740"; // dark ink blue — institutional surfaces
const INK_SOFT = "#2a3854";
const EMERALD = "#0d6f64";
const EMERALD_SOFT = "#1a8577";
const STONE = "#b9b2a6";
const STONE_DEEP = "#8a8375";
const AMBER = "#b0762a";
const RED = "#a53b2a"; // controlled red — breach simulation only
const RIM = "#f3e9d2";
const ROOM = "#f6f1e6";
const ROOM_DEEP = "#efe8d9";

const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/* ── Stage & layouts ────────────────────────────────────────────────────── */

export const STAGE_W = 960;
export const STAGE_H = 540;

export type Orientation = "16:9" | "9:16";

export const LAYOUTS: Record<
  Orientation,
  { w: number; h: number; scale: number; dy: number }
> = {
  // 9:16 renders the SAME world, scaled up and vertically centred; the
  // backdrop and ground run full-bleed so both crops stay covered.
  "16:9": { w: 960, h: 540, scale: 1, dy: 0 },
  "9:16": { w: 900, h: 1600, scale: 1.5, dy: 395 },
};

const GY = 442; // ground line
const PATH_Y = 452; // the 90-day plan boardwalk top surface
const FILM_END = 78;

/* ── Narration beats (word timestamps in the trimmed recording) ─────────── */
// Sentence starts/ends; see BrandFilm.tsx NARRATION for the caption table.
const B = {
  data: 0.36, exposure: 2.73, inspection: 5.07, scattered: 8.37,
  weak: 10.26, unanswered: 11.85, picture: 14.43, thousands: 16.62,
  valuable: 23.55, unprotected: 24.5, plan: 26.31, phase1: 29.79,
  gaps: 31.32, phase2: 35.13, policies: 36.51, dpo: 42.54,
  phase3: 45.84, paper: 47.94, teams: 50.64, controls: 51.78,
  breach: 53.19, day90: 56.31, defensible: 59.49, structured: 60.33,
  builtToLast: 61.29, noDelays: 62.94, noSurprises: 63.93,
  clarity: 65.25, echo: 66.63, becomes: 69.51, controlled: 69.99,
  organised: 70.89, protected: 71.97, brand: 73.4,
} as const;

/* ── Keyframe track ─────────────────────────────────────────────────────── */

type Key = readonly [number, number] | readonly [number, number, "io" | "o" | "i"];

function track(t: number, keys: readonly Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const x = sub(t, a[0], b[0]);
      const ease = b[2] === "io" ? easeInOut(x) : b[2] === "o" ? easeOut(x) : b[2] === "i" ? x * x : x;
      return mix(a[1], b[1], ease);
    }
  }
  return keys[keys.length - 1][1];
}

/* ── Camera ─────────────────────────────────────────────────────────────────
 * Focus-based: (fx, fy) is the world point held at frame centre, zoom the
 * magnification about it. One monotonic move rightward, no cuts back — the
 * "return" at the echo is the company itself reappearing in the world. */

const FX_KEYS: readonly Key[] = [
  [0, 330],
  [B.exposure, 420, "io"], // the record leaves the form
  [B.inspection, 900, "io"], // into the passage of layers
  [13.9, 2040, "io"], // exports → permissions → vendor duct
  [B.picture + 0.9, 2920, "io"], // wide on the company
  [B.thousands + 0.6, 2960],
  [23.0, 3520, "io"], // drift across the departments
  [B.valuable + 0.2, 3940, "io"], // basement + provider bay
  [B.plan, 4620, "io"], // the record unfolds into the plan
  [B.phase1, 5060, "io"], // Phase gate one
  [B.gaps + 0.2, 5540, "io"],
  [34.9, 6180, "io"], // findings reviewed
  [B.phase2, 6320, "io"], // Phase gate two
  [B.policies + 0.4, 6560, "io"],
  [41.9, 6900, "io"], // registers built → the table
  [45.4, 7180, "io"], // DPO table held
  [B.phase3, 7440, "io"], // Phase gate three
  [B.paper + 0.3, 7740, "io"],
  [B.teams, 8080, "io"], // practice stations
  [B.breach, 8420, "io"], // the simulation room
  [B.day90, 8760, "io"], // the halt
  [B.defensible, 9160, "io"], // the evidence pack
  [B.noDelays, 9660, "io"], // clarity strip
  [B.clarity, 9980, "io"],
  [B.echo, 10480, "io"], // the company again
  [B.becomes, 10560, "o"],
  [72.6, 10620],
  [B.brand + 0.8, 11520, "io"], // into the brand plate
  [76.4, 11540],
  [FILM_END, 11544],
];

const FY_KEYS: readonly Key[] = [
  [0, 352], // desk height for the close-up
  [B.exposure + 0.6, 340],
  [B.inspection, 336, "io"], // ground band of the passage
  [B.picture, 300, "io"],
  [B.picture + 1.0, 272, "io"], // whole building in frame
  [B.valuable, 330, "io"], // down to the basement beat
  [B.plan, 320, "io"],
  [B.day90, 300, "io"],
  [B.echo, 272, "io"],
  [B.brand, 262, "io"],
  [FILM_END, 262],
];

const ZOOM_KEYS: readonly Key[] = [
  [0, 1.5], // close on the form
  [B.exposure + 0.4, 1.5],
  [B.inspection, 1.16, "io"],
  [B.picture, 1.04, "io"],
  [B.picture + 1.0, 0.78, "io"], // the full company
  [B.thousands + 1.0, 0.84],
  [B.valuable, 1.1, "io"], // closer for the quiet beat
  [B.plan, 0.98, "io"],
  [B.gaps, 1.06],
  [B.dpo, 1.0, "io"],
  [B.breach, 1.08, "io"],
  [B.day90, 0.94, "io"],
  [B.echo, 0.9, "io"],
  [B.becomes + 1.2, 0.78, "io"], // the whole transformed company
  [B.brand, 1.02, "io"],
  [FILM_END, 1.02],
];

export const camAt = (t: number): number => track(t, FX_KEYS);
const fyAt = (t: number): number => track(t, FY_KEYS);
const zoomAt = (t: number): number => track(t, ZOOM_KEYS);

/* ── Defs: lighting, shadows, grain ─────────────────────────────────────── */

export function FilmDefs(): ReactElement {
  return (
    <defs>
      <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2ecdf" />
        <stop offset="0.7" stopColor={BG} />
        <stop offset="1" stopColor="#eae4d5" />
      </linearGradient>
      <linearGradient id="fRoom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ROOM} />
        <stop offset="1" stopColor={ROOM_DEEP} />
      </linearGradient>
      <linearGradient id="fInk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={INK_SOFT} />
        <stop offset="1" stopColor={INK} />
      </linearGradient>
      <linearGradient id="fPath" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f1e4" />
        <stop offset="1" stopColor="#e9e2d0" />
      </linearGradient>
      <radialGradient id="fPool" cx="0.5" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#f7f2e6" stopOpacity="0.9" />
        <stop offset="1" stopColor="#f7f2e6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="fVin" cx="0.5" cy="0.44" r="0.78">
        <stop offset="0.62" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#241f16" stopOpacity="0.26" />
      </radialGradient>
      <filter id="fSoft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter id="fSoft2" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <pattern id="fGrain" width="72" height="72" patternUnits="userSpaceOnUse">
        <rect width="72" height="72" fill="none" />
        <circle cx="10" cy="16" r="0.7" fill="#5d5344" opacity="0.05" />
        <circle cx="40" cy="8" r="0.5" fill="#5d5344" opacity="0.04" />
        <circle cx="61" cy="30" r="0.6" fill="#5d5344" opacity="0.05" />
        <circle cx="24" cy="47" r="0.6" fill="#5d5344" opacity="0.04" />
        <circle cx="52" cy="60" r="0.7" fill="#5d5344" opacity="0.05" />
        <circle cx="8" cy="64" r="0.5" fill="#5d5344" opacity="0.04" />
      </pattern>
    </defs>
  );
}

/* ── Editorial dimensional type ─────────────────────────────────────────── */

function EdType({
  x, y, text, size, o = 1, color = GRAPHITE, spacing = 0.14, anchor = "middle", rise = 6,
}: {
  x: number; y: number; text: string; size: number; o?: number;
  color?: string; spacing?: number; anchor?: "start" | "middle"; rise?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const dy = (1 - easeOut(o)) * rise;
  return (
    <g opacity={Math.min(1, o * 1.15)} transform={`translate(0 ${dy})`}>
      <text x={x + size * 0.045} y={y + size * 0.05} fontFamily={SERIF} fontSize={size}
        fontWeight={620} letterSpacing={`${spacing}em`} textAnchor={anchor}
        fill="#9a8f79" opacity={0.55}>{text}</text>
      <text x={x} y={y} fontFamily={SERIF} fontSize={size} fontWeight={620}
        letterSpacing={`${spacing}em`} textAnchor={anchor} fill={color}>{text}</text>
    </g>
  );
}

function MonoTag({
  x, y, text, o = 1, tone = "ink", anchor = "start", size = 9,
}: {
  x: number; y: number; text: string; o?: number;
  tone?: "ink" | "risk" | "ok" | "red" | "muted"; anchor?: "start" | "middle"; size?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const col = tone === "risk" ? AMBER : tone === "ok" ? EMERALD : tone === "red" ? RED : tone === "muted" ? STONE_DEEP : INK;
  const w = text.length * size * 0.62 + 14;
  const ax = anchor === "middle" ? x - w / 2 : x;
  return (
    <g opacity={o}>
      <rect x={ax} y={y - size - 4} width={w} height={size + 9} rx={3.2}
        fill={PAPER} stroke={col} strokeOpacity={0.75} strokeWidth={0.9} />
      <circle cx={ax + 7.4} cy={y - size / 2 - 0.2} r={2} fill={col} />
      <text x={ax + 13.6} y={y - 1.4} fontFamily={MONO} fontSize={size}
        letterSpacing="0.06em" fill={col} fontWeight={600}>{text}</text>
    </g>
  );
}

/* ── Paper: records, documents, folders ─────────────────────────────────── */

function Sheet({
  x, y, w = 26, h = 34, tilt = 0, o = 1, tone = "paper", lines = 3,
}: {
  x: number; y: number; w?: number; h?: number; tilt?: number; o?: number;
  tone?: "paper" | "ink" | "old"; lines?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const face = tone === "ink" ? "#e9edf4" : tone === "old" ? "#efe7d2" : PAPER;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} opacity={o}>
      <rect x={1.6} y={2.2} width={w} height={h} rx={2} fill="#8d8471" opacity={0.28} filter="url(#fSoft2)" />
      <rect width={w} height={h} rx={2} fill={face} stroke={PAPER_EDGE} strokeWidth={0.8} />
      <path d={`M ${w - 7} 0 L ${w} 7 L ${w - 7} 7 Z`} fill={PAPER_EDGE} opacity={0.7} />
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} x={4.4} y={7.5 + i * 5.4} width={w - (i === 0 ? 14 : 9)} height={1.7}
          rx={0.85} fill={GRAPHITE} opacity={i === 0 ? 0.62 : 0.3} />
      ))}
    </g>
  );
}

/** A travelling record chip — one customer record moving through the company. */
function Record({
  x, y, o = 1, s = 1, tone = "paper", shadow = true,
}: { x: number; y: number; o?: number; s?: number; tone?: "paper" | "risk" | "ok"; shadow?: boolean }): ReactElement | null {
  if (o <= 0.004) return null;
  const edge = tone === "risk" ? AMBER : tone === "ok" ? EMERALD : PAPER_EDGE;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {shadow ? <ellipse cx={0} cy={13} rx={12} ry={2.6} fill="#8d8471" opacity={0.3} filter="url(#fSoft2)" /> : null}
      <rect x={-11} y={-9} width={22} height={17} rx={1.8} fill={PAPER} stroke={edge} strokeWidth={1} />
      <rect x={-7.6} y={-5.4} width={12} height={1.6} rx={0.8} fill={GRAPHITE} opacity={0.6} />
      <rect x={-7.6} y={-1.8} width={15} height={1.4} rx={0.7} fill={GRAPHITE} opacity={0.3} />
      <rect x={-7.6} y={1.6} width={9} height={1.4} rx={0.7} fill={GRAPHITE} opacity={0.3} />
    </g>
  );
}

/* ── People: refined articulated silhouettes ──────────────────────────────
 * Rounded graphite figures with a warm rim light and a role accent. Poses
 * are parametric in t so people genuinely work: typing hands, carried
 * records, turned heads, walking legs. No faces — dignity through posture. */

type PoseName = "sit" | "type" | "stand" | "walk" | "carry" | "present" | "review";

function Person({
  x, y, t, pose, face = 1, accent, badge = false, s = 1, o = 1, phase = 0,
}: {
  x: number; y: number; t: number; pose: PoseName; face?: 1 | -1;
  accent?: string; badge?: boolean; s?: number; o?: number; phase?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const w = Math.sin(t * 2.1 + phase); // idle sway
  const typing = Math.sin(t * 9 + phase);
  const step = Math.sin(t * 5.2 + phase);
  const seated = pose === "sit" || pose === "type";
  const headY = seated ? -47 : -64;
  const headTilt = pose === "review" ? 7 : pose === "type" ? 4 : 0;
  const armF = // forward arm path per pose
    pose === "type" ? `M -2 ${-34} C 8 ${-31} 13 ${-28 + typing * 1.2} 17 ${-26 + typing * 1.6}` :
    pose === "carry" ? `M -2 -36 C 9 -34 15 -33 19 -33` :
    pose === "present" ? `M -2 -38 C 10 -40 17 -44 22 -49` :
    pose === "review" ? `M -2 -36 C 7 -33 12 -30 15 -27` :
    pose === "walk" ? `M -2 -38 C 5 ${-34 + step * 2} 9 ${-30 + step * 3} 11 ${-26 + step * 3.4}` :
    `M -2 -38 C 4 -33 6 -28 6 -23`;
  const armB =
    pose === "type" ? `M -4 ${-34} C -10 ${-31} -13 ${-28 - typing * 1.2} -16 ${-26 - typing * 1.5}` :
    pose === "carry" ? `M -4 -36 C -10 -33 -14 -32 -17 -32.6` :
    pose === "walk" ? `M -4 -38 C -8 ${-33 - step * 2} -10 ${-29 - step * 3} -11 ${-25 - step * 3.2}` :
    `M -4 -38 C -9 -33 -11 -28 -11 -23`;
  const legs = seated
    ? `M -6 -18 C 2 -16 8 -13 10 -8 L 10 0 M 10 -8 L -2 -8 L -2 0`
    : pose === "walk"
      ? `M -1 -20 C ${1 + step * 5} -12 ${2 + step * 7} -6 ${3 + step * 8} 0 M -1 -20 C ${-1 - step * 5} -12 ${-2 - step * 7} -6 ${-3 - step * 8} 0`
      : `M -1 -20 C 0 -12 2 -6 2.5 0 M -1 -20 C -2 -12 -3.4 -6 -4 0`;
  return (
    <g transform={`translate(${x} ${y}) scale(${face * s} ${s})`} opacity={o}>
      <ellipse cx={0} cy={2} rx={15} ry={3.4} fill="#877e6b" opacity={0.32} filter="url(#fSoft2)" />
      <path d={legs} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" fill="none" />
      {/* torso */}
      <path
        d={seated
          ? `M -10 -18 C -12 -32 -10 -42 -3 -46 C 4 -49 10 -44 10 -34 C 10 -27 8 -21 7 -18 Z`
          : `M -9 -20 C -12 -38 -10 -52 -2 -57 C 6 -61 12 -52 11 -40 C 10.5 -31 9 -24 8 -20 Z`}
        fill={GRAPHITE}
      />
      {/* warm rim light on the back edge */}
      <path
        d={seated
          ? `M -10 -18 C -12 -32 -10 -42 -3 -46`
          : `M -9 -20 C -12 -38 -10 -52 -2 -57`}
        stroke={RIM} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.8}
      />
      {accent ? (
        <path d={seated ? `M -8 -40 C -4 -44 2 -46 6 -43` : `M -7 -52 C -3 -56 3 -58 8 -54`}
          stroke={accent} strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.95} />
      ) : null}
      {badge ? <circle cx={4.5} cy={seated ? -38 : -47} r={2.6} fill={EMERALD} stroke={RIM} strokeWidth={0.7} /> : null}
      {/* arms */}
      <path d={armB} stroke={GRAPHITE_SOFT} strokeWidth={5.4} strokeLinecap="round" fill="none" />
      <path d={armF} stroke={GRAPHITE} strokeWidth={5.6} strokeLinecap="round" fill="none" />
      {pose === "carry" ? <g transform="translate(18 -38)"><Sheet x={-8} y={0} w={17} h={22} tilt={-6} lines={2} /></g> : null}
      {/* head */}
      <g transform={`translate(0 ${headY + w * 0.7}) rotate(${headTilt})`}>
        <circle cx={2} cy={0} r={8.6} fill={GRAPHITE} />
        <path d="M -5 -5 A 8.6 8.6 0 0 1 6 -8" stroke={RIM} strokeWidth={1.3} fill="none" opacity={0.85} />
        <path d="M -6.5 -1 C -8.5 2 -8 5.5 -5.5 7" stroke={GRAPHITE} strokeWidth={3} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

/* role accents */
const ACC = {
  customer: STONE,
  support: EMERALD_SOFT,
  hr: "#7a6c8f",
  marketing: "#3f7d8c",
  it: "#41597e",
  compliance: INK_SOFT,
  dpo: EMERALD,
  leader: "#4a4136",
};

/* ── Furniture ──────────────────────────────────────────────────────────── */

function Desk({ x, y, w = 86, o = 1, screen = true, flip = false }: {
  x: number; y: number; w?: number; o?: number; screen?: boolean; flip?: boolean;
}): ReactElement | null {
  if (o <= 0.004) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} opacity={o}>
      <rect x={2} y={2.4} width={w} height={5} fill="#877e6b" opacity={0.3} filter="url(#fSoft2)" />
      <rect x={0} y={-4} width={w} height={5.5} rx={2} fill={GRAPHITE} />
      <rect x={5} y={1.5} width={5} height={26} fill={GRAPHITE_SOFT} />
      <rect x={w - 10} y={1.5} width={5} height={26} fill={GRAPHITE_SOFT} />
      {screen ? (
        <g transform={`translate(${w * 0.62} -26)`}>
          <rect x={-16} y={-11} width={33} height={22} rx={2.4} fill={GRAPHITE} />
          <rect x={-13.4} y={-8.4} width={28} height={17} rx={1.4} fill="#f1ecdd" />
          <rect x={-10.4} y={-5} width={14} height={1.7} rx={0.8} fill={GRAPHITE} opacity={0.55} />
          <rect x={-10.4} y={-1.4} width={20} height={1.5} rx={0.75} fill={GRAPHITE} opacity={0.3} />
          <rect x={-10.4} y={2} width={17} height={1.5} rx={0.75} fill={GRAPHITE} opacity={0.3} />
          <rect x={0} y={11} width={4} height={5} fill={GRAPHITE_SOFT} />
        </g>
      ) : null}
    </g>
  );
}

function Cabinet({ x, y, label, o = 1, h = 74, w = 58, tone = "ink", open = 0 }: {
  x: number; y: number; label?: string; o?: number; h?: number; w?: number;
  tone?: "ink" | "old"; open?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const face = tone === "old" ? "#d8cfb8" : "url(#fInk)";
  const text = tone === "old" ? STONE_DEEP : RIM;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x={3} y={3} width={w} height={h} fill="#877e6b" opacity={0.3} filter="url(#fSoft)" />
      <rect width={w} height={h} rx={2.5} fill={face} stroke={tone === "old" ? PAPER_EDGE : INK} strokeWidth={1} />
      {label ? (
        <text x={w / 2} y={13.5} textAnchor="middle" fontFamily={MONO} fontSize={7.4}
          letterSpacing="0.12em" fill={text} fontWeight={620}>{label}</text>
      ) : null}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(5 ${21 + i * ((h - 26) / 2)}) translate(${i === 0 ? open * 9 : 0} 0)`}>
          <rect width={w - 10} height={(h - 32) / 2} rx={1.6} fill={tone === "old" ? "#cfc5aa" : INK_SOFT}
            stroke={tone === "old" ? PAPER_EDGE : "#0f1729"} strokeWidth={0.7} />
          <rect x={(w - 10) / 2 - 7} y={(h - 32) / 4 - 1.2} width={14} height={2.4} rx={1.2} fill={text} opacity={0.75} />
        </g>
      ))}
    </g>
  );
}

/** A register drawer with a label plate and an owner slot. */
function RegisterDrawer({ x, y, label, owner, o = 1, seat = 1, ownerOn = 0, w = 176 }: {
  x: number; y: number; label: string; owner?: string; o?: number; seat?: number; ownerOn?: number; w?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const dy = (1 - easeOut(seat)) * -26;
  return (
    <g transform={`translate(${x} ${y + dy})`} opacity={o}>
      <rect x={2.4} y={3} width={w} height={26} fill="#877e6b" opacity={0.28} filter="url(#fSoft2)" />
      <rect width={w} height={26} rx={2.4} fill="url(#fInk)" stroke="#101a2e" strokeWidth={0.8} />
      <text x={9} y={16.6} fontFamily={MONO} fontSize={8.2} letterSpacing="0.08em" fill={RIM} fontWeight={620}>{label}</text>
      {owner ? (
        <g opacity={ownerOn}>
          <rect x={w - 52} y={5} width={46} height={16} rx={2} fill={PAPER} stroke={EMERALD} strokeWidth={0.9} />
          <circle cx={w - 45} cy={13} r={2} fill={EMERALD} />
          <text x={w - 39.4} y={16.2} fontFamily={MONO} fontSize={7} fill={EMERALD} fontWeight={640}>{owner}</text>
        </g>
      ) : null}
    </g>
  );
}

/* ── The company cutaway ──────────────────────────────────────────────────
 * One building, reused twice: scattered at the reveal, and again at the end
 * where `order` morphs it into the controlled state. Departments are real
 * rooms; people keep working in both states. */

function Room({ x, y, w, h, name, children }: {
  x: number; y: number; w: number; h: number; name?: string; children?: ReactNode;
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} fill="url(#fRoom)" stroke="#d5cdba" strokeWidth={1} />
      <rect x={0} y={h - 4} width={w} height={4} fill="#e3dcc9" />
      {name ? (
        <text x={9} y={14} fontFamily={MONO} fontSize={7.6} letterSpacing="0.14em" fill={STONE_DEEP} fontWeight={640}>{name}</text>
      ) : null}
      {children}
    </g>
  );
}

function Company({ x, t, order = 0, o = 1, ghost = 0 }: {
  x: number; t: number; order?: number; o?: number; ghost?: number;
}): ReactElement | null {
  if (o <= 0.004) return null;
  const W = 940;
  const disorder = 1 - order;
  // scattered record chips drifting between rooms; under `order` they settle
  // into the basement rails.
  const chips = [
    { sx: 150, sy: 118, ex: 348, ey: 342, ph: 0 }, { sx: 420, sy: 96, ex: 384, ey: 342, ph: 1.4 },
    { sx: 610, sy: 128, ex: 420, ey: 342, ph: 2.6 }, { sx: 260, sy: 212, ex: 456, ey: 342, ph: 3.4 },
    { sx: 705, sy: 214, ex: 492, ey: 342, ph: 4.4 }, { sx: 508, sy: 208, ex: 528, ey: 342, ph: 5.2 },
    { sx: 350, sy: 120, ex: 564, ey: 342, ph: 6.1 },
  ];
  return (
    <g transform={`translate(${x} 0)`} opacity={o}>
      {/* shell */}
      <rect x={-6} y={78} width={W + 12} height={GY - 78} fill="none" />
      <rect x={2} y={86} width={W} height={GY - 86} fill="#8d8471" opacity={0.22} filter="url(#fSoft)" />
      <rect x={0} y={80} width={W} height={GY - 80} fill="#efe9db" stroke={GRAPHITE} strokeWidth={2} />
      <rect x={0} y={74} width={W} height={9} fill={GRAPHITE} />
      {/* upper floor — room-local floor sits at h−4 (= y 116 for h 120) */}
      <Room x={12} y={95} w={168} h={120} name="RECEPTION">
        <Person x={44} y={116} t={t} pose="stand" accent={ACC.customer} s={0.62} />
        <Desk x={66} y={88} w={58} />
        <Person x={124} y={116} t={t} pose="type" face={-1} accent={ACC.support} s={0.62} phase={2} />
      </Room>
      <Room x={186} y={95} w={190} h={120} name="CUSTOMER SERVICE">
        <Desk x={22} y={88} w={70} />
        <Person x={44} y={116} t={t} pose="type" accent={ACC.support} s={0.62} phase={1} />
        <Person x={140} y={116} t={t} pose="carry" face={-1} accent={ACC.support} s={0.6} phase={3} />
        <Sheet x={104} y={62} w={20} h={26} tilt={7 * disorder} lines={2} />
      </Room>
      <Room x={382} y={95} w={186} h={120} name="MARKETING">
        <Desk x={18} y={88} w={66} />
        <Person x={40} y={116} t={t} pose="type" accent={ACC.marketing} s={0.62} phase={4} />
        <Sheet x={112} y={64} w={22} h={28} tilt={8 * disorder} lines={2} />
        <Sheet x={140} y={70} w={22} h={28} tilt={-10 * disorder} lines={2} />
      </Room>
      <Room x={574} y={95} w={176} h={120} name="HR">
        <Desk x={16} y={88} w={62} />
        <Person x={38} y={116} t={t} pose="type" accent={ACC.hr} s={0.62} phase={5} />
        <Cabinet x={106} y={46} w={48} h={66} label="FILES" tone={order > 0.5 ? "ink" : "old"} />
      </Room>
      <Room x={754} y={95} w={174} h={120} name="MANAGEMENT">
        <rect x={34} y={92} width={108} height={5} rx={2.5} fill={GRAPHITE} />
        <rect x={44} y={97} width={6} height={19} fill={GRAPHITE_SOFT} />
        <rect x={124} y={97} width={6} height={19} fill={GRAPHITE_SOFT} />
        <Person x={30} y={116} t={t} pose="present" accent={ACC.leader} s={0.62} />
        <Person x={96} y={116} t={t} pose="sit" face={-1} accent={ACC.compliance} s={0.6} phase={2.4} />
        <Person x={140} y={116} t={t} pose="sit" face={-1} accent={ACC.marketing} s={0.6} phase={3.2} />
      </Room>
      {/* lower floor — floor at y 108 for h 112 */}
      <Room x={12} y={219} w={220} h={112} name="IT & SECURITY">
        <Desk x={26} y={80} w={74} />
        <Person x={50} y={108} t={t} pose="type" accent={ACC.it} s={0.62} phase={0.7} />
        <rect x={132} y={40} width={64} height={46} rx={2.5} fill="url(#fInk)" />
        <rect x={140} y={50} width={20} height={2.2} fill="#8fa2c4" />
        <rect x={140} y={57} width={30} height={2.2} fill="#8fa2c4" opacity={0.7} />
        <rect x={140} y={64} width={24} height={2.2} fill="#8fa2c4" opacity={0.5} />
        <g opacity={order}>
          <circle cx={140} cy={76} r={2.4} fill={EMERALD} />
          <text x={147} y={79} fontFamily={MONO} fontSize={6.8} fill={RIM}>ACCESS</text>
        </g>
      </Room>
      <Room x={238} y={219} w={200} h={112} name="FINANCE">
        <Desk x={20} y={80} w={68} />
        <Person x={42} y={108} t={t} pose="type" accent={ACC.customer} s={0.62} phase={2.8} />
        <Sheet x={122} y={52} w={24} h={30} tilt={-7 * disorder} lines={3} />
        <Sheet x={152} y={58} w={22} h={28} tilt={9 * disorder} lines={2} />
      </Room>
      <Room x={444} y={219} w={190} h={112} name="COMPLIANCE">
        <Desk x={18} y={80} w={66} />
        <Person x={40} y={108} t={t} pose="review" accent={ACC.compliance} s={0.62} phase={1.8} />
        <Sheet x={116} y={50} w={24} h={32} tilt={5 * disorder} lines={3} />
      </Room>
      <Room x={640} y={219} w={140} h={112} name="DPO">
        {/* empty at the start; occupied when ordered */}
        <Desk x={20} y={80} w={58} screen={false} />
        <Person x={72} y={108} t={t} pose="review" accent={ACC.dpo} badge s={0.64} o={order} />
        <text x={70} y={62} textAnchor="middle" fontFamily={MONO} fontSize={7}
          letterSpacing="0.1em" fill={disorder > 0.5 ? STONE_DEEP : EMERALD} fontWeight={640}
          opacity={0.9}>{disorder > 0.5 ? "VACANT" : "APPOINTED"}</text>
      </Room>
      <Room x={784} y={219} w={144} h={112} name="STORAGE">
        <Cabinet x={14} y={40} w={50} h={66} label="ARCHIVE" tone={order > 0.5 ? "ink" : "old"} />
        <Cabinet x={76} y={40} w={50} h={66} label="2016–24" tone={order > 0.5 ? "ink" : "old"} />
      </Room>
      {/* basement records rail */}
      <g>
        <rect x={330} y={334} width={280} height={22} rx={2} fill={order > 0.01 ? "url(#fInk)" : "#ddd5c2"}
          stroke={order > 0.01 ? "#101a2e" : PAPER_EDGE} opacity={0.001 + Math.max(order, 0.9)} />
        <text x={470} y={348.6} textAnchor="middle" fontFamily={MONO} fontSize={7.4}
          letterSpacing="0.14em" fill={order > 0.5 ? RIM : STONE_DEEP} fontWeight={640}>
          {order > 0.5 ? "CUSTOMER RECORDS — CONTROLLED" : "RECORDS — UNTRACKED"}
        </text>
      </g>
      {/* drifting / settling record chips */}
      {chips.map((c, i) => {
        const drift = Math.sin(t * 0.9 + c.ph) * 10 * disorder;
        const cx = mix(c.sx + drift, c.ex, easeInOut(order));
        const cy = mix(c.sy + Math.cos(t * 0.8 + c.ph) * 6 * disorder, c.ey, easeInOut(order));
        return <Record key={i} x={cx} y={cy} s={0.8} tone={order > 0.6 ? "ok" : "paper"} shadow={false} o={0.92} />;
      })}
      {/* external provider bay */}
      <g transform={`translate(${W + 26} 250)`}>
        <rect x={2.4} y={3} width={128} height={106} fill="#877e6b" opacity={0.25} filter="url(#fSoft)" />
        <rect width={128} height={106} rx={3} fill="#e7e0cf" stroke={GRAPHITE} strokeWidth={1.6} />
        <text x={64} y={17} textAnchor="middle" fontFamily={MONO} fontSize={7.4} letterSpacing="0.12em"
          fill={STONE_DEEP} fontWeight={640}>EXTERNAL PROVIDERS</text>
        <Cabinet x={14} y={28} w={44} h={62} tone={order > 0.5 ? "ink" : "old"} label="CLOUD" />
        <Cabinet x={68} y={28} w={44} h={62} tone={order > 0.5 ? "ink" : "old"} label="PAYROLL" />
        <g opacity={order}>
          <rect x={24} y={94 - 62} width={80} height={0} fill="none" />
          <MonoTag x={64} y={104} text="AGREEMENT ON FILE" tone="ok" anchor="middle" size={7} o={order} />
        </g>
      </g>
      {/* the duct that carries records out to the providers */}
      <g>
        <rect x={W - 6} y={286} width={36} height={9} fill={disorder > 0.5 ? "#cfc5aa" : INK} />
        <Record x={W + 12} y={282} s={0.6} o={disorder * (0.5 + 0.5 * Math.sin(t * 2.2))} shadow={false} />
      </g>
      {/* ghost overlay for the echo beat */}
      {ghost > 0.004 ? (
        <g opacity={ghost * 0.85}>
          <rect x={0} y={74} width={W} height={GY - 74} fill="#d8cdb4" opacity={0.35} />
          {chips.map((c, i) => (
            <Record key={i} x={c.sx + Math.sin(t * 1.3 + c.ph) * 14} y={c.sy + Math.cos(t + c.ph) * 9}
              s={0.85} shadow={false} o={0.8} />
          ))}
        </g>
      ) : null}
    </g>
  );
}

/* ── The 90-day path ──────────────────────────────────────────────────────
 * A raised boardwalk that begins where the record unfolds (x≈4340) and runs
 * to the DAY 90 cap (x≈8460). Phase gates arch over it; day tiles print on
 * its face. It is the film's structural spine. */

const PATH_X0 = 4340;
const DAY90_X = 8770;

function PlanPath({ t }: { t: number }): ReactElement {
  const unfold = easeInOut(sub(t, B.plan, B.plan + 1.9));
  const reach = track(t, [
    [B.plan + 0.6, PATH_X0 + 60],
    [B.phase1 + 0.4, 5240, "o"], // races ahead through the Diagnose gate
    [B.phase2 + 0.4, 6800, "io"], // under the Build scaffold before drawers seat
    [45.6, 7520, "io"], // through the Operationalise gate
    [B.day90 + 0.3, DAY90_X, "io"], // and halts exactly at Day 90
  ]);
  const halt = easeOut(sub(t, B.day90, B.day90 + 0.9));
  const days: Array<[number, string, number]> = [
    [PATH_X0 + 60, "DAY 1", B.plan + 1.0],
    [5060, "DAY 20", B.phase1 + 0.6],
    [7060, "DAY 60", 44.9],
    [DAY90_X - 130, "DAY 90", B.day90],
  ];
  if (unfold <= 0.004) return <g />;
  const w = Math.max(0, reach - PATH_X0);
  return (
    <g>
      {/* deck: a raised boardwalk with real thickness and footing */}
      <rect x={PATH_X0 + 6} y={PATH_Y + 24} width={w} height={7} fill="#8d8471" opacity={0.25} filter="url(#fSoft2)" />
      {Array.from({ length: Math.floor(w / 260) + 1 }, (_, i) => (
        <rect key={i} x={PATH_X0 + 40 + i * 260} y={PATH_Y + 20} width={7}
          height={GY - PATH_Y - 18} fill="#c4bba2" />
      ))}
      <rect x={PATH_X0} y={PATH_Y} width={w} height={20}
        fill="url(#fPath)" stroke={PAPER_EDGE} strokeWidth={1} />
      <rect x={PATH_X0} y={PATH_Y + 20} width={w} height={5} fill="#cfc6ae" />
      {/* unfolding leading flap */}
      <g transform={`translate(${reach} ${PATH_Y})`} opacity={t < B.day90 + 0.4 ? 1 : 0}>
        <path d={`M 0 0 L ${34 - 24 * halt} ${-18 + 13 * halt} L ${40 - 27 * halt} 0 Z`} fill="#efe8d6" stroke={PAPER_EDGE} strokeWidth={0.8} />
      </g>
      {/* day tiles */}
      {days.map(([dx, label, at]) => (
        <g key={label} opacity={envelope(t, at, FILM_END, 0.7)}>
          <text x={dx} y={PATH_Y + 14.2} fontFamily={SERIF} fontSize={11.4} fontWeight={640}
            letterSpacing="0.2em" fill={GRAPHITE}>{label}</text>
        </g>
      ))}
      {/* the DAY 90 cap — the plan stops exactly here */}
      <g opacity={sub(t, B.day90 - 0.4, B.day90 + 0.5)} transform={`translate(${DAY90_X} 0)`}>
        <rect x={-3} y={PATH_Y - 46} width={7} height={46 + 21} fill={GRAPHITE} />
        <rect x={-42} y={PATH_Y - 66} width={116} height={30} rx={2.6} fill="url(#fInk)" stroke="#101a2e" />
        <text x={16} y={PATH_Y - 46} textAnchor="middle" fontFamily={SERIF} fontSize={15}
          fontWeight={640} letterSpacing="0.18em" fill={RIM}>DAY 90</text>
        {/* beyond the cap: the external, unpromised timeline */}
        <g opacity={0.8}>
          <path d={`M 10 ${PATH_Y + 8} L 150 ${PATH_Y + 8}`} stroke={STONE_DEEP} strokeWidth={1.4} strokeDasharray="5 6" />
          <text x={80} y={PATH_Y + 24} textAnchor="middle" fontFamily={MONO} fontSize={7}
            letterSpacing="0.08em" fill={STONE_DEEP}>Regulator review — external timeline</text>
        </g>
      </g>
    </g>
  );
}

function PhaseGate({ x, title, dayRange, at, t }: {
  x: number; title: string; dayRange: string; at: number; t: number;
}): ReactElement | null {
  const o = sub(t, at - 0.35, at + 0.55);
  if (o <= 0.004) return null;
  const rise = easeOut(o);
  return (
    <g transform={`translate(${x} 0)`} opacity={o}>
      <rect x={-4} y={PATH_Y - 108 * rise} width={5} height={108 * rise} fill={GRAPHITE} />
      <rect x={126} y={PATH_Y - 108 * rise} width={5} height={108 * rise} fill={GRAPHITE} />
      <g opacity={sub(t, at - 0.1, at + 0.5)}>
        <rect x={-14} y={PATH_Y - 134} width={155} height={34} rx={2.6} fill="url(#fInk)" stroke="#101a2e" />
        <text x={63} y={PATH_Y - 120.5} textAnchor="middle" fontFamily={MONO} fontSize={7.2}
          letterSpacing="0.22em" fill="#b9c2d4">{dayRange}</text>
        <text x={63} y={PATH_Y - 107.5} textAnchor="middle" fontFamily={SERIF} fontSize={14.6}
          fontWeight={640} letterSpacing="0.2em" fill={RIM}>{title}</text>
      </g>
    </g>
  );
}

/* ── Act I: the form, the exposure, the passage ─────────────────────────── */

function OpeningDesk({ t }: { t: number }): ReactElement {
  const press = sub(t, 1.62, 1.86); // the Submit press ("just" → "information")
  const fly = easeInOut(sub(t, 2.1, 4.6)); // the record leaves into the company
  const morph = easeInOut(sub(t, B.exposure, B.exposure + 1.1));
  return (
    <g>
      {/* the customer's table, warm pool of light */}
      <ellipse cx={330} cy={GY + 8} rx={330} ry={60} fill="url(#fPool)" />
      {/* set dressing: shelf of binders + a framed panel on the wall */}
      <g opacity={0.9}>
        <rect x={64} y={GY - 168} width={190} height={5} fill={STONE} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={78 + i * 30} y={GY - 196} width={19} height={28} rx={1.5}
            fill={i % 2 ? "#d9d1bd" : "#cec5ae"} stroke={PAPER_EDGE} strokeWidth={0.7} />
        ))}
        <rect x={476} y={182} width={128} height={86} rx={3} fill="none" stroke={STONE} strokeWidth={2.4} />
        <rect x={492} y={198} width={96} height={54} fill="#e9e3d3" />
        <rect x={560} y={GY - 130} width={70} height={130} rx={3} fill="#e6dfcd" stroke={PAPER_EDGE} />
        <text x={595} y={GY - 112} textAnchor="middle" fontFamily={MONO} fontSize={6.6}
          letterSpacing="0.1em" fill={STONE_DEEP}>RECORDS</text>
      </g>
      <Desk x={150} y={GY - 44} w={210} screen={false} />
      <Person x={130} y={GY} t={t} pose="type" accent={ACC.customer} s={1.06} />
      {/* the form, large in frame */}
      <g transform="translate(268 316)">
        <rect x={4} y={5} width={168} height={104} fill="#8d8471" opacity={0.3} filter="url(#fSoft)" />
        <rect width={168} height={104} rx={4} fill={PAPER} stroke={PAPER_EDGE} strokeWidth={1.2} />
        <text x={13} y={20} fontFamily={MONO} fontSize={8} letterSpacing="0.12em" fill={STONE_DEEP} fontWeight={640}>NEW CUSTOMER</text>
        {["FULL NAME", "NATIONAL ID", "PHONE"].map((f, i) => (
          <g key={f} transform={`translate(13 ${31 + i * 19})`}>
            <text y={6.4} fontFamily={MONO} fontSize={6.4} fill={STONE_DEEP}>{f}</text>
            <rect x={52} y={-1} width={92} height={10.6} rx={2} fill="#fdfbf4" stroke={PAPER_EDGE} strokeWidth={0.8} />
            <rect x={55} y={2} width={mix(0, 78 - i * 16, easeOut(sub(t, 0.15 + i * 0.42, 0.75 + i * 0.42)))}
              height={4.4} rx={2.2} fill={GRAPHITE} opacity={0.65} />
          </g>
        ))}
        {/* submit */}
        <g transform={`translate(112 ${86 + press * 1.6})`}>
          <rect width={44} height={13} rx={3} fill={press > 0.9 ? EMERALD : INK} />
          <text x={22} y={9.4} textAnchor="middle" fontFamily={MONO} fontSize={7.2} letterSpacing="0.08em" fill={RIM}>SUBMIT</text>
        </g>
      </g>
      {/* DATA → EXPOSURE, elegant and unsettling: the serif word re-weights */}
      <g>
        <EdType x={352} y={228} text="DATA" size={40} spacing={0.34} o={envelope(t, 0.7, B.exposure + 0.35, 0.4)} />
        <EdType x={392} y={228} text="EXPOSURE" size={40} spacing={0.3} color={INK}
          o={sub(t, B.exposure + 0.25, B.exposure + 1.0) * envelope(t, B.exposure, 6.4, 0.5)} />
        {/* a thin amber underline arrives with EXPOSURE — the only warning */}
        <rect x={252} y={238} width={280 * morph * envelope(t, B.exposure, 6.4, 0.5)} height={2} fill={AMBER} opacity={0.85} />
      </g>
      {/* the record leaves the form into the building */}
      <Record x={mix(352, 900, fly)} y={mix(368, 300, fly) + Math.sin(fly * Math.PI) * -60}
        s={mix(1.15, 0.9, fly)} o={fly > 0.02 ? 1 : 0} />
    </g>
  );
}

function Passage({ t }: { t: number }): ReactElement {
  // the inspection reveal: layers that normally stay hidden
  const stations: Array<{ x: number; el: ReactElement }> = [
    {
      x: 980,
      el: (
        <g>
          <Cabinet x={0} y={GY - 96} w={62} h={92} tone="old" label="EXPORTS" open={sub(t, 5.4, 6.2)} />
          <Sheet x={70} y={GY - 46} w={24} h={30} tilt={9} tone="old" />
          <MonoTag x={4} y={GY - 106} text="2019–2023 · unreviewed" tone="muted" size={7.6} o={sub(t, 5.6, 6.3)} />
        </g>
      ),
    },
    {
      x: 1210,
      el: (
        <g>
          {/* shared folder: the same record, copied and copied */}
          <rect x={0} y={GY - 60} width={96} height={56} rx={3} fill="#e7e0cf" stroke={PAPER_EDGE} />
          <text x={48} y={GY - 46} textAnchor="middle" fontFamily={MONO} fontSize={7.2} fill={STONE_DEEP} letterSpacing="0.1em">SHARED DRIVE</text>
          {[0, 1, 2, 3].map((i) => (
            <Record key={i} x={20 + i * 20} y={GY - 22 - (i % 2) * 8} s={0.72} shadow={false}
              o={sub(t, 6.6 + i * 0.28, 7.0 + i * 0.28)} />
          ))}
          <MonoTag x={2} y={GY - 70} text="ACCESS: ALL STAFF" tone="risk" size={7.6} o={sub(t, 7.4, 8.0)} />
        </g>
      ),
    },
    {
      x: 1470,
      el: (
        <g>
          {/* the unfinished register: empty owner column */}
          <rect x={0} y={GY - 92} width={120} height={88} rx={3} fill={PAPER} stroke={PAPER_EDGE} strokeWidth={1} />
          <text x={9} y={GY - 78} fontFamily={MONO} fontSize={7.4} fill={STONE_DEEP} letterSpacing="0.1em">PROCESSING REGISTER</text>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(9 ${GY - 66 + i * 17})`}>
              <rect width={62} height={11} rx={1.6} fill="#efe9d8" stroke={PAPER_EDGE} strokeWidth={0.6} />
              <rect x={68} y={0} width={34} height={11} rx={1.6} fill="none" stroke={AMBER} strokeWidth={0.9} strokeDasharray="3 2.4" />
            </g>
          ))}
          <MonoTag x={2} y={GY - 100} text="OWNER: —" tone="risk" size={7.6} o={sub(t, 9.4, 10.0)} />
        </g>
      ),
    },
    {
      x: 1720,
      el: (
        <g>
          <Cabinet x={0} y={GY - 90} w={58} h={86} tone="old" label="ARCHIVE" />
          <MonoTag x={-4} y={GY - 100} text="RETENTION: EXPIRED 2024" tone="risk" size={7.6} o={sub(t, 10.7, 11.4)} />
        </g>
      ),
    },
    {
      x: 1950,
      el: (
        <g>
          {/* the vendor duct: a record leaving the walls */}
          <rect x={0} y={GY - 58} width={110} height={10} fill="#cfc5aa" />
          <rect x={104} y={GY - 74} width={78} height={44} rx={3} fill="#e7e0cf" stroke={GRAPHITE} strokeWidth={1.2} />
          <text x={143} y={GY - 58} textAnchor="middle" fontFamily={MONO} fontSize={6.8} fill={STONE_DEEP} letterSpacing="0.08em">EXTERNAL</text>
          <text x={143} y={GY - 48} textAnchor="middle" fontFamily={MONO} fontSize={6.8} fill={STONE_DEEP} letterSpacing="0.08em">PROVIDER</text>
          <Record x={30 + ((t * 34) % 92)} y={GY - 62} s={0.66} shadow={false} o={envelope(t, 11.6, 14.4, 0.4)} />
          <MonoTag x={0} y={GY - 84} text="TRANSFER: UNDOCUMENTED" tone="risk" size={7.6} o={sub(t, 12.2, 12.9)} />
        </g>
      ),
    },
  ];
  return (
    <g>
      {/* inspection light sweeping ahead of the camera */}
      <rect x={camAt(t) + 250} y={90} width={340} height={GY - 90} fill="url(#fPool)"
        opacity={envelope(t, B.inspection, B.picture, 0.8) * 0.7} />
      {stations.map((s, i) => (
        <g key={i} transform={`translate(${s.x} 0)`}>{s.el}</g>
      ))}
      {/* a continuous ledge of stored paper above the stations */}
      <g opacity={0.85}>
        <rect x={940} y={GY - 190} width={1240} height={5} fill={STONE} opacity={0.7} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={962 + i * 76 + (i % 3) * 9} y={GY - 216} width={17} height={26} rx={1.4}
            fill={i % 2 ? "#d9d1bd" : "#cfc6af"} stroke={PAPER_EDGE} strokeWidth={0.6} />
        ))}
      </g>
      {/* the three phrases, printed in the air as the layers pass */}
      <EdType x={1290} y={166} text="SCATTERED RECORDS" size={23} o={envelope(t, B.scattered, 11.2, 0.5)} />
      <EdType x={1610} y={144} text="WEAK CONTROLS" size={23} o={envelope(t, B.weak, 12.9, 0.5)} />
      <EdType x={1870} y={168} text="UNANSWERED RISKS" size={23} color={INK} o={envelope(t, B.unanswered, 14.3, 0.5)} />
    </g>
  );
}

/* ── Act II: the company, the scatter, the quiet exposure ───────────────── */

function ActCompany({ t }: { t: number }): ReactElement {
  const on = envelope(t, 13.4, B.plan + 1.6, 0.8);
  if (on <= 0.004) return <g />;
  // travelling records during "thousands of customer records…"
  const moves = [
    { x0: 2600, y0: 200, x1: 3010, y1: 208, at: 16.8, d: 2.0 },
    { x0: 3010, y0: 208, x1: 3320, y1: 300, at: 17.6, d: 1.8 },
    { x0: 2760, y0: 300, x1: 3390, y1: 300, at: 18.6, d: 2.2 },
    { x0: 3160, y0: 200, x1: 3620, y1: 292, at: 19.4, d: 2.0 },
    { x0: 2930, y0: 208, x1: 3410, y1: 336, at: 20.4, d: 2.2 },
    { x0: 3320, y0: 300, x1: 3700, y1: 288, at: 21.2, d: 1.8 },
  ];
  return (
    <g opacity={on}>
      <Company x={2440} t={t} order={0} />
      {moves.map((m, i) => {
        const p = easeInOut(sub(t, m.at, m.at + m.d));
        const vis = envelope(t, m.at, m.at + m.d + 0.2, 0.25);
        return (
          <Record key={i} x={mix(m.x0, m.x1, p)} y={mix(m.y0, m.y1, p) - Math.sin(p * Math.PI) * 34}
            s={0.78} o={vis} shadow={false} />
        );
      })}
      {/* counts, printed with restraint */}
      <EdType x={2905} y={62} text="THOUSANDS OF RECORDS" size={24} o={envelope(t, 17.0, 20.4, 0.5)} />
      <EdType x={3260} y={62} text="ONE BUSINESS · MANY LOCATIONS" size={19} o={envelope(t, 20.8, B.valuable + 0.4, 0.5)} />
      {/* the quiet beat: one record, an old archive, a cross-border duct */}
      <g opacity={envelope(t, B.valuable - 0.4, B.plan + 0.4, 0.4)}>
        <ellipse cx={3830} cy={GY + 6} rx={260} ry={46} fill="url(#fPool)" opacity={0.8} />
        <Cabinet x={3684} y={GY - 92} w={56} h={88} tone="old" label="ARCHIVE" />
        <text x={3712} y={GY - 100} textAnchor="middle" fontFamily={MONO} fontSize={6.8}
          fill={STONE_DEEP} letterSpacing="0.08em">HELD SINCE 2016</text>
        {/* the record on its stand, access wide open */}
        <rect x={3800} y={GY - 58} width={64} height={58} rx={2.5} fill="#e7e0cf" stroke={PAPER_EDGE} />
        <Record x={3832} y={GY - 68} s={1.05} />
        <rect x={3796} y={GY - 92} width={72} height={98} rx={3} fill="none" stroke={AMBER} strokeWidth={1.2}
          strokeDasharray="6 5" opacity={0.75 + 0.25 * Math.sin(t * 3)} />
        <MonoTag x={3832} y={GY - 98} text="ACCESS: ALL STAFF" tone="risk" anchor="middle" size={7.2}
          o={sub(t, B.valuable + 0.3, B.valuable + 0.8)} />
        {/* a copy leaving for the cross-border provider */}
        <rect x={3880} y={GY - 40} width={130} height={9} fill="#cfc5aa" />
        <Record x={3900 + ((t * 26) % 110)} y={GY - 44} s={0.62} shadow={false}
          o={envelope(t, B.valuable, B.plan + 0.2, 0.3)} />
        <text x={3998} y={GY - 48} textAnchor="middle" fontFamily={MONO} fontSize={6.6}
          fill={STONE_DEEP} letterSpacing="0.06em">CROSS-BORDER</text>
        <EdType x={3830} y={210} text="VALUABLE" size={26} o={envelope(t, B.valuable, B.unprotected + 0.7, 0.35)} />
        <EdType x={3830} y={244} text="UNPROTECTED" size={26} color={AMBER}
          o={envelope(t, B.unprotected + 0.35, B.plan + 0.5, 0.35)} />
      </g>
      {/* the record that will become the plan: carried forward off its stand */}
      <Record x={mix(3832, 4310, easeInOut(sub(t, B.plan - 0.6, B.plan + 0.5)))}
        y={mix(GY - 68, PATH_Y - 10, easeInOut(sub(t, B.plan - 0.6, B.plan + 0.5)))}
        s={1} o={sub(t, B.plan - 0.8, B.plan - 0.5)} />
    </g>
  );
}

/* ── Act III: the plan, diagnose, build, operationalise ─────────────────── */

function ActPlan({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.plan - 0.5, 33.4 + 3, 0.6);
  return (
    <g>
      <PlanPath t={t} />
      {/* the title, integrated above the unfolding path */}
      <g opacity={envelope(t, B.plan + 0.5, B.phase1 + 0.7, 0.5) * (on > 0 ? 1 : 1)}>
        <EdType x={4620} y={158} text="THE 90-DAY" size={30} spacing={0.24} />
        <EdType x={4620} y={196} text="INSPECTION-READY PLAN" size={30} spacing={0.2} color={INK} />
      </g>
      <PhaseGate x={4960} title="DIAGNOSE" dayRange="PHASE ONE · DAY 1 TO DAY 20" at={B.phase1} t={t} />
      <PhaseGate x={6010} title="BUILD" dayRange="PHASE TWO · DAY 21 TO DAY 60" at={B.phase2} t={t} />
      <PhaseGate x={7140} title="OPERATIONALISE" dayRange="PHASE THREE · DAY 61 TO DAY 90" at={B.phase3} t={t} />
    </g>
  );
}

function ActDiagnose({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.phase1 - 0.6, B.phase2 + 1.2, 0.7);
  if (on <= 0.004) return <g />;
  const gapItems: Array<{ x: number; y: number; label: string; at: number; src: ReactElement }> = [
    {
      x: 5330, y: GY - 96, label: "ACCESS TOO BROAD", at: 31.6,
      src: <Record x={26} y={64} s={0.9} />,
    },
    {
      x: 5495, y: GY - 118, label: "CONSENT EVIDENCE MISSING", at: 32.3,
      src: <Sheet x={12} y={44} w={26} h={34} lines={3} />,
    },
    {
      x: 5665, y: GY - 96, label: "TRANSFER REVIEW REQUIRED", at: 33.0,
      src: (
        <g>
          <rect x={0} y={58} width={54} height={8} fill="#cfc5aa" />
          <Record x={26} y={54} s={0.7} shadow={false} />
        </g>
      ),
    },
    {
      x: 5830, y: GY - 118, label: "RETENTION UNDEFINED", at: 33.7,
      src: <g transform="translate(6 34)"><Cabinet x={0} y={0} w={44} h={56} tone="old" label="BOX" /></g>,
    },
  ];
  return (
    <g opacity={on}>
      {/* the light of "brought into the light" — a warm pool BEHIND the work */}
      <ellipse cx={5600} cy={GY - 60} rx={470} ry={150} fill="url(#fPool)"
        opacity={envelope(t, B.gaps, 35.2, 0.7) * 0.4} />
      {/* measured inspection frames over real sources */}
      {gapItems.map((g1) => {
        const o = sub(t, g1.at, g1.at + 0.5);
        return (
          <g key={g1.label} transform={`translate(${g1.x} ${g1.y})`} opacity={o}>
            {g1.src}
            <path d="M -6 22 L -6 12 L 4 12 M 48 12 L 58 12 L 58 22 M 58 66 L 58 76 L 48 76 M 4 76 L -6 76 L -6 66"
              stroke={GRAPHITE} strokeWidth={1.6} fill="none" />
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={-6 + i * 10.6} y={6.4} width={1.2} height={i % 2 ? 2.6 : 4.2} fill={GRAPHITE} opacity={0.6} />
            ))}
            <MonoTag x={26} y={2} text={g1.label} tone="risk" anchor="middle" size={7.4} o={o} />
          </g>
        );
      })}
      {/* compliance + IT review the findings together */}
      <g opacity={sub(t, 33.6, 34.3)}>
        <Desk x={5760} y={GY - 44} w={92} />
        <Person x={5748} y={GY} t={t} pose="review" accent={ACC.compliance} s={0.94} />
        <Person x={5892} y={GY} t={t} pose="review" face={-1} accent={ACC.it} s={0.94} phase={2} />
        <Sheet x={5806} y={GY - 74} w={26} h={30} tilt={-4} />
      </g>
      {/* the phase's closing account, printed on the path as the camera passes */}
      <g opacity={envelope(t, 34.2, B.policies + 1.2, 0.4)}>
        <text x={6060} y={PATH_Y + 12.4} fontFamily={MONO} fontSize={8.6} letterSpacing="0.18em"
          fill={GRAPHITE} opacity={0.85} textAnchor="middle">
          DATA MAPPED · GAPS IDENTIFIED · REQUIREMENTS DEFINED
        </text>
      </g>
    </g>
  );
}

function ActBuild({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.phase2 - 0.7, B.phase3 + 1.4, 0.7);
  if (on <= 0.004) return <g />;
  // the diagnosed record unfolds into structure
  const unfold = easeInOut(sub(t, B.phase2 - 0.5, B.phase2 + 0.9));
  const registers: Array<[string, string, number]> = [
    ["PRIVACY POLICY", "HASSAN", 36.9],
    ["PROCESSING REGISTER", "SAID", 37.7],
    ["CONSENT REGISTER", "NABIL", 38.5],
    ["BREACH LOG", "IT DUTY", 39.3],
    ["RETENTION SCHEDULE", "FATHY", 40.1],
    ["PROCESSOR AGREEMENTS", "LEGAL", 40.9],
  ];
  const dpoOn = sub(t, B.dpo - 0.3, B.dpo + 0.6);
  return (
    <g opacity={on}>
      {/* the compliance specialist places the record onto the path */}
      <Person x={6380} y={GY} t={t} pose="carry" accent={ACC.compliance} s={0.96}
        o={envelope(t, B.phase2 - 1.0, B.phase2 + 1.6, 0.4)} />
      {/* scaffold rising from the record */}
      <g transform="translate(6520 0)">
        <rect x={0} y={PATH_Y - 182 * unfold} width={4.5} height={182 * unfold} fill={GRAPHITE} />
        <rect x={218} y={PATH_Y - 182 * unfold} width={4.5} height={182 * unfold} fill={GRAPHITE} />
        <rect x={-6} y={PATH_Y - 182 * unfold} width={234} height={4.5} fill={GRAPHITE} />
        {/* register drawers slot into the frame */}
        {registers.map(([label, owner, at], i) => (
          <RegisterDrawer key={label} x={23} y={PATH_Y - 166 + i * 27} label={label} owner={owner}
            o={sub(t, at - 0.15, at + 0.25)} seat={sub(t, at - 0.15, at + 0.45)}
            ownerOn={sub(t, at + 0.7, at + 1.1)} />
        ))}
      </g>
      {/* builders at work — the company stays active while structure rises */}
      <Person x={6488} y={GY} t={t} pose="present" face={-1} accent={ACC.it} s={0.92} phase={1.2}
        o={envelope(t, B.policies, B.dpo + 1.4, 0.5)} />
      <Person x={6800} y={GY} t={t} pose="carry" accent={ACC.hr} s={0.92} phase={2.6}
        o={envelope(t, B.policies + 0.6, B.dpo + 1.6, 0.5)} />
      {/* vendor record connects to its agreement */}
      <g opacity={envelope(t, 41.3, 45.4, 0.4)}>
        <Record x={6860} y={GY - 120} s={0.86} />
        <Sheet x={6900} y={GY - 142} w={26} h={34} lines={4} />
        <path d={`M 6871 ${GY - 120} C 6888 ${GY - 128} 6892 ${GY - 128} 6901 ${GY - 124}`}
          stroke={EMERALD} strokeWidth={1.6} fill="none"
          strokeDasharray="34" strokeDashoffset={34 - 34 * sub(t, 41.5, 42.2)} />
        <MonoTag x={6900} y={GY - 150} text="AGREEMENT LINKED" tone="ok" size={7.2} o={sub(t, 42.0, 42.5)} />
      </g>
      {/* the DPO table: the team gathers, oversight is formally taken */}
      <g opacity={dpoOn}>
        <rect x={7040} y={GY - 42} width={216} height={6.5} rx={3} fill={GRAPHITE} />
        <rect x={7058} y={GY - 36} width={7} height={36} fill={GRAPHITE_SOFT} />
        <rect x={7228} y={GY - 36} width={7} height={36} fill={GRAPHITE_SOFT} />
        <Person x={7010} y={GY} t={t} pose="sit" accent={ACC.hr} s={1} phase={0.4} />
        <Person x={7086} y={GY} t={t} pose="sit" accent={ACC.marketing} s={1} phase={1.3} />
        <Person x={7212} y={GY} t={t} pose="sit" face={-1} accent={ACC.it} s={1} phase={2.2} />
        <Person x={7284} y={GY} t={t} pose="sit" face={-1} accent={ACC.compliance} s={1} phase={3.1} />
        {/* the named DPO stands to take oversight */}
        <Person x={7150} y={GY} t={t} pose="present" accent={ACC.dpo} badge s={1.04} phase={0} />
        <Sheet x={7126} y={GY - 68} w={24} h={30} tilt={-3} />
        <g opacity={sub(t, B.dpo + 0.5, B.dpo + 1.1)}>
          <EdType x={7150} y={186} text="DATA PROTECTION OFFICER" size={21} spacing={0.2} color={INK} />
          <EdType x={7150} y={212} text="APPOINTED" size={15} spacing={0.34} color={EMERALD} />
        </g>
      </g>
      {/* build account line printed on the path */}
      <g opacity={envelope(t, 41.0, B.phase3 + 1.2, 0.5)}>
        <text x={6990} y={PATH_Y + 14.2} fontFamily={MONO} fontSize={8.6} letterSpacing="0.18em"
          fill={GRAPHITE} opacity={0.85} textAnchor="middle">
          POLICIES ESTABLISHED · LOGS CREATED · ACCOUNTABILITY ASSIGNED
        </text>
      </g>
    </g>
  );
}

function ActOperate({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.phase3 - 0.7, B.day90 + 1.0, 0.7);
  if (on <= 0.004) return <g />;
  // the page that turns: policy text becomes floor markings
  const turn = easeInOut(sub(t, B.paper - 0.2, B.paper + 1.0));
  const sim = sub(t, B.breach, B.breach + 0.4); // amber rises
  const contained = sub(t, 54.6, 55.2);
  const verified = sub(t, 55.4, 55.9);
  const amber = Math.max(0, sim * (1 - contained * 0.85));
  return (
    <g opacity={on}>
      {/* the turning policy page */}
      <g transform={`translate(7460 ${GY - 88})`} opacity={envelope(t, B.paper - 0.5, 50.6, 0.4)}>
        <Sheet x={0} y={0} w={40} h={52} lines={5} />
        <path d={`M 40 0 C ${40 - 34 * turn} ${-16 * turn} ${40 - 40 * turn} ${52 * 0.4} ${40 - 40 * turn} ${52 * (1 - 0.2 * turn)}`}
          fill="#efe8d6" stroke={PAPER_EDGE} strokeWidth={0.8} opacity={turn > 0.02 ? 1 : 0} />
      </g>
      <g opacity={envelope(t, B.paper, 50.9, 0.4)}>
        <EdType x={7660} y={158} text="FROM PAPER" size={22} spacing={0.26} />
        <EdType x={7660} y={186} text="TO PRACTICE" size={22} spacing={0.26} color={EMERALD} />
      </g>
      {/* practice stations: policy lines become real actions */}
      <g opacity={envelope(t, B.paper + 0.3, B.breach + 1.2, 0.5)}>
        {/* access policy → restricted permission */}
        <g transform="translate(7555 0)">
          <rect x={0} y={GY - 92} width={4} height={92} fill={GRAPHITE} />
          <rect x={54} y={GY - 92} width={4} height={92} fill={GRAPHITE} />
          <rect x={-2} y={GY - 96} width={62} height={5} fill={GRAPHITE} />
          <Person x={29} y={GY} t={t} pose="walk" accent={ACC.support} s={0.88} phase={1} />
          <MonoTag x={29} y={GY - 102} text="ACCESS — RESTRICTED" tone="ok" anchor="middle" size={7.2}
            o={sub(t, 48.5, 49.1)} />
        </g>
        {/* retention rule → archive decision */}
        <g transform="translate(7690 0)">
          <Cabinet x={0} y={GY - 70} w={48} h={66} label="ARCHIVE" open={sub(t, 49.0, 49.6)} />
          <Record x={24} y={GY - 84 + 16 * sub(t, 49.2, 49.9)} s={0.72} shadow={false}
            o={envelope(t, 48.9, 50.4, 0.25)} />
          <MonoTag x={24} y={GY - 86} text="RETENTION MET" tone="ok" anchor="middle" size={7.2}
            o={sub(t, 49.8, 50.3)} />
        </g>
        {/* consent rule → marketing approval check */}
        <g transform="translate(7800 0)">
          <Desk x={0} y={GY - 44} w={70} />
          <Person x={22} y={GY} t={t} pose="type" accent={ACC.marketing} s={0.9} phase={2.4} />
          <MonoTag x={40} y={GY - 80} text="CONSENT VERIFIED" tone="ok" anchor="middle" size={7.2}
            o={sub(t, 50.1, 50.6)} />
        </g>
      </g>
      {/* training vignettes: teams are trained, controls are lived */}
      <g opacity={envelope(t, B.teams - 0.2, B.breach + 0.6, 0.4)}>
        <g transform="translate(7950 0)">
          <Desk x={0} y={GY - 44} w={78} flip />
          <Person x={54} y={GY} t={t} pose="review" face={-1} accent={ACC.hr} s={0.9} phase={0.8} />
          <Person x={10} y={GY} t={t} pose="carry" accent={ACC.dpo} badge s={0.9} phase={1.7} />
          <Sheet x={26} y={GY - 72} w={24} h={30} tilt={4} />
        </g>
        <g transform="translate(8090 0)">
          <Person x={16} y={GY} t={t} pose="present" accent={ACC.compliance} s={0.9} phase={2.9} />
          <Person x={64} y={GY} t={t} pose="stand" face={-1} accent={ACC.support} s={0.88} phase={3.7} />
        </g>
        <text x={8020} y={PATH_Y + 14.2} fontFamily={MONO} fontSize={8.6} letterSpacing="0.18em"
          fill={GRAPHITE} opacity={0.85 * envelope(t, B.teams, B.breach + 0.9, 0.3)} textAnchor="middle">
          TEAMS TRAINED · CONTROLS ACTIVE
        </text>
      </g>
      {/* the controlled breach simulation */}
      <g transform="translate(8330 0)">
        {/* room */}
        <rect x={0} y={GY - 148} width={250} height={148} fill="url(#fRoom)" stroke="#d5cdba" strokeWidth={1} />
        <rect x={0} y={GY - 148} width={250} height={148} fill={AMBER} opacity={amber * 0.16} />
        <rect x={0} y={GY - 148} width={250} height={4} fill={amber > 0.4 ? AMBER : GRAPHITE} />
        {/* the records system under test */}
        <g transform="translate(24 0)">
          <rect x={0} y={GY - 118} width={86} height={92} rx={3} fill={PAPER}
            stroke={verified > 0.5 ? EMERALD : amber > 0.25 ? AMBER : PAPER_EDGE} strokeWidth={1.6} />
          <text x={43} y={GY - 104} textAnchor="middle" fontFamily={MONO} fontSize={6.8}
            letterSpacing="0.08em" fill={STONE_DEEP}>CUSTOMER RECORDS</text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Record key={i} x={20 + (i % 3) * 23} y={GY - 82 + Math.floor(i / 3) * 26} s={0.6} shadow={false} />
          ))}
          {/* the single red pulse — the simulated incident itself */}
          <circle cx={74} cy={GY - 110} r={3.4} fill={RED}
            opacity={sim > 0.2 ? (0.45 + 0.55 * Math.sin(t * 7)) * (1 - contained) : 0} />
        </g>
        {/* IT isolates; the DPO is notified; the log updates */}
        <Person x={140} y={GY} t={t} pose="type" accent={ACC.it} s={0.92} phase={0.6} />
        <Desk x={118} y={GY - 44} w={64} />
        <Person x={214} y={GY} t={t} pose="review" face={-1} accent={ACC.dpo} badge s={0.94} phase={1.4}
          o={sub(t, 53.9, 54.4)} />
        <g opacity={sub(t, 54.3, 54.8)}>
          <RegisterDrawer x={128} y={GY - 104} label="BREACH LOG" o={1} seat={1} w={112} />
          <circle cx={128 + 100} cy={GY - 91} r={2.6} fill={RED} opacity={0.9 * (1 - verified)} />
        </g>
        {/* status line above the room, never a dashboard */}
        <text x={125} y={GY - 160} textAnchor="middle" fontFamily={MONO} fontSize={8.4} letterSpacing="0.16em"
          fill={verified > 0.5 ? EMERALD : amber > 0.3 ? AMBER : STONE_DEEP} fontWeight={640}>
          {verified > 0.5 ? "RESPONSE VERIFIED" : contained > 0.5 ? "INCIDENT CONTAINED" : sim > 0.3 ? "SIMULATION STARTED" : "SYSTEMS NOMINAL"}
        </text>
      </g>
    </g>
  );
}

/* ── Act IV: day 90, the evidence pack, clarity ─────────────────────────── */

const PACK_TABS = [
  "GAP ASSESSMENT", "DATA INVENTORY", "CONTROL REGISTER", "CONSENT REGISTER",
  "BREACH LOG", "DPO APPOINTMENT", "TRAINING RECORDS", "PROCESSOR AGREEMENTS",
  "SIMULATION RESULTS", "AUDIT TRAIL",
];

function ActDay90({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.day90 - 0.8, B.echo + 1.2, 0.7);
  if (on <= 0.004) return <g />;
  const packOn = sub(t, 57.0, 57.5);
  return (
    <g opacity={on}>
      <EdType x={8890} y={140} text="INSPECTION-READY" size={26} spacing={0.24} color={INK}
        o={envelope(t, 57.2, B.defensible + 1.6, 0.5)} />
      {/* the company continues behind, small and alive */}
      <g transform="translate(8520 262) scale(0.3)" opacity={0.5 * envelope(t, B.day90, B.noDelays, 0.8)}>
        <Company x={0} t={t} order={0.8} />
      </g>
      {/* the evidence pack assembles from every phase */}
      <g transform="translate(8920 0)" opacity={packOn}>
        <rect x={4} y={GY - 206} width={16} height={206} fill={INK} />
        <rect x={20} y={GY - 200} width={128} height={200} rx={2.5} fill={PAPER} stroke={PAPER_EDGE} strokeWidth={1.2} />
        <text x={84} y={GY - 180} textAnchor="middle" fontFamily={SERIF} fontSize={10.4} fontWeight={640}
          letterSpacing="0.12em" fill={GRAPHITE}>EVIDENCE PACK</text>
        <text x={84} y={GY - 168} textAnchor="middle" fontFamily={MONO} fontSize={6.6}
          letterSpacing="0.1em" fill={STONE_DEEP}>ASSEMBLED · DAY 71 — DAY 90</text>
        <rect x={34} y={GY - 158} width={100} height={1.4} fill={PAPER_EDGE} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={34} y={GY - 146 + i * 12} width={100 - i * 14} height={2.2} rx={1.1}
            fill={GRAPHITE} opacity={0.28} />
        ))}
        <text x={84} y={GY - 26} textAnchor="middle" fontFamily={MONO} fontSize={6.4}
          letterSpacing="0.16em" fill={EMERALD} fontWeight={640}>INDEXED · TRACEABLE</text>
        {PACK_TABS.map((tab, i) => {
          const at = 57.4 + i * 0.24;
          const oT = sub(t, at, at + 0.3);
          return (
            <g key={tab} opacity={oT} transform={`translate(${148} ${GY - 158 + i * 15.2})`}>
              <rect x={0} y={0} width={13 + 4.4 * (i % 3)} height={11} rx={1.4} fill={i % 2 ? EMERALD : INK} />
              <text x={20 + 4.4 * (i % 3)} y={8.6} fontFamily={MONO} fontSize={7} letterSpacing="0.05em" fill={GRAPHITE} opacity={0.85}>{tab}</text>
            </g>
          );
        })}
      </g>
      {/* defensible / structured / built to last — index threads draw */}
      <g opacity={envelope(t, B.defensible - 0.2, B.noDelays + 0.2, 0.35)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i}
            d={`M 9088 ${GY - 150 + i * 30} C 9170 ${GY - 160 + i * 26} 9220 ${GY - 190 + i * 34} 9280 ${GY - 176 + i * 30}`}
            stroke={i % 2 ? EMERALD : INK} strokeWidth={1.3} fill="none" opacity={0.7}
            strokeDasharray="220" strokeDashoffset={220 - 220 * sub(t, B.defensible + i * 0.14, B.defensible + 0.9 + i * 0.14)} />
        ))}
        {["RECORDS", "CONTROLS", "OWNERS", "EVIDENCE", "REVIEW DATES"].map((lbl, i) => (
          <MonoTag key={lbl} x={9288} y={GY - 168 + i * 30} text={lbl} tone={i % 2 ? "ok" : "ink"} size={7}
            o={sub(t, B.defensible + 0.3 + i * 0.14, B.defensible + 0.7 + i * 0.14)} />
        ))}
        <EdType x={9170} y={128} text="DEFENSIBLE" size={24} o={envelope(t, B.defensible, 62.9, 0.4)} />
        <EdType x={9370} y={128} text="STRUCTURED" size={24} o={envelope(t, B.structured, 62.9, 0.4)} />
        <EdType x={9270} y={162} text="BUILT TO LAST" size={24} color={INK} o={envelope(t, B.builtToLast, 63.2, 0.4)} />
      </g>
    </g>
  );
}

function ActClarity({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.noDelays - 0.6, B.echo + 0.8, 0.5);
  if (on <= 0.004) return <g />;
  const route = sub(t, B.noDelays, B.noDelays + 0.7);
  return (
    <g opacity={on}>
      {/* no delays: one clean route from a control to its evidence */}
      <g opacity={envelope(t, B.noDelays - 0.2, B.noSurprises + 0.3, 0.3)}>
        <MonoTag x={9450} y={GY - 150} text="CONTROL — ACCESS POLICY" tone="ink" size={7.4} o={1} />
        <path d={`M 9470 ${GY - 144} C 9530 ${GY - 118} 9580 ${GY - 116} 9640 ${GY - 128}`}
          stroke={EMERALD} strokeWidth={2} fill="none"
          strokeDasharray="220" strokeDashoffset={220 - 220 * route} />
        <Sheet x={9640} y={GY - 148} w={26} h={32} lines={3} o={1} />
        <MonoTag x={9636} y={GY - 154} text="EVIDENCE" tone="ok" size={7.4} o={sub(t, B.noDelays + 0.5, B.noDelays + 0.8)} />
        <EdType x={9570} y={182} text="NO DELAYS" size={25} o={envelope(t, B.noDelays, B.noSurprises + 0.15, 0.3)} />
      </g>
      {/* no surprises: leadership + DPO at one small, current status ledger */}
      <g opacity={envelope(t, B.noSurprises - 0.15, B.clarity + 0.4, 0.3)}>
        <Person x={9770} y={GY} t={t} pose="stand" accent={ACC.leader} s={0.98} />
        <Person x={9946} y={GY} t={t} pose="present" face={-1} accent={ACC.dpo} badge s={0.96} phase={1.2} />
        <g transform="translate(9822 0)">
          <rect x={0} y={GY - 138} width={82} height={92} rx={2.6} fill={PAPER} stroke={PAPER_EDGE} strokeWidth={1} />
          <text x={41} y={GY - 124} textAnchor="middle" fontFamily={MONO} fontSize={6.8} letterSpacing="0.1em" fill={STONE_DEEP}>READINESS</text>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(11 ${GY - 112 + i * 19})`}>
              <rect width={44} height={9.5} rx={1.4} fill="#efe9d8" />
              <circle cx={54} cy={4.7} r={3.1} fill={EMERALD} opacity={sub(t, B.noSurprises + 0.2 + i * 0.16, B.noSurprises + 0.45 + i * 0.16)} />
            </g>
          ))}
        </g>
        <EdType x={9880} y={182} text="NO SURPRISES" size={25} o={envelope(t, B.noSurprises, B.clarity + 0.15, 0.3)} />
      </g>
      {/* just clarity: the noise thins away */}
      <EdType x={10120} y={226} text="JUST CLARITY" size={28} color={INK}
        o={envelope(t, B.clarity, B.echo + 0.3, 0.35)} />
    </g>
  );
}

/* ── Act V: the echo and the transformation ─────────────────────────────── */

function ActTransform({ t }: { t: number }): ReactElement {
  const on = envelope(t, B.echo - 0.8, FILM_END, 0.7);
  if (on <= 0.004) return <g />;
  const order = easeInOut(sub(t, B.becomes, B.becomes + 2.6));
  const ghost = envelope(t, B.echo, B.becomes + 0.6, 0.6);
  return (
    <g opacity={on}>
      <Company x={10060} t={t} order={order} ghost={ghost} />
      <EdType x={10530} y={56} text="CONTROLLED" size={25} o={envelope(t, B.controlled, B.brand + 0.8, 0.4)} />
      <EdType x={10530 + 210} y={56} text="ORGANISED" size={25} o={envelope(t, B.organised, B.brand + 0.8, 0.4)} />
      <EdType x={10530 + 400} y={56} text="PROTECTED" size={25} color={EMERALD} o={envelope(t, B.protected, B.brand + 0.9, 0.4)} />
    </g>
  );
}

function BrandPlate({ t }: { t: number }): ReactElement {
  const o = sub(t, B.brand + 0.7, B.brand + 1.7);
  if (o <= 0.004) return <g />;
  const settle = easeOut(sub(t, B.brand + 1.0, B.brand + 2.2));
  return (
    <g transform="translate(11240 0)" opacity={o}>
      {/* the pack's spine folds forward into the wordmark plate */}
      <rect x={0} y={92} width={560} height={330} rx={5} fill={PAPER} stroke={PAPER_EDGE} strokeWidth={1.4} />
      <rect x={0} y={92} width={17} height={330} fill={INK} />
      <text x={280} y={236} textAnchor="middle" fontFamily={SERIF} fontSize={64} fontWeight={650}
        letterSpacing="0.14em" fill={GRAPHITE}>ILTIZAM</text>
      <rect x={170} y={252} width={mix(0, 220, settle)} height={3} fill={EMERALD} />
      <text x={280} y={290} textAnchor="middle" fontFamily={SERIF} fontSize={16.5} fill={GRAPHITE_SOFT}
        opacity={settle}>From exposure to control in 90 days.</text>
      <text x={280} y={318} textAnchor="middle" fontFamily={MONO} fontSize={10} letterSpacing="0.22em"
        fill={EMERALD} opacity={settle}>DIAGNOSE. BUILD. OPERATIONALISE.</text>
      <text x={280} y={352} textAnchor="middle" fontFamily={MONO} fontSize={7.8} letterSpacing="0.06em"
        fill={STONE_DEEP} opacity={settle * 0.9}>
        Inspection readiness built around evidence, accountability and active controls.
      </text>
      <text x={280} y={404} textAnchor="middle" fontFamily={MONO} fontSize={7.2} letterSpacing="0.3em"
        fill={STONE_DEEP} opacity={settle * 0.7}>AN ILTIZAM FILM</text>
    </g>
  );
}

/* ── The stage ──────────────────────────────────────────────────────────── */

function Backdrop({ cam }: { cam: number }): ReactElement {
  // slow-parallax skyline: a low architectural band far behind the action
  const shift = cam * 0.14; // backdrop moves at 0.86× camera speed
  const blocks = Array.from({ length: 34 }, (_, i) => ({
    x: i * 380, w: 200 + (i % 3) * 70, h: 92 + (i % 4) * 34,
  }));
  return (
    <g transform={`translate(${shift} 0)`} opacity={0.55}>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={GY - b.h} width={b.w} height={b.h}
            fill={i % 2 ? "#e7e1d1" : BG_FAR} />
          <rect x={b.x} y={GY - b.h} width={b.w} height={3} fill="#d8d1bf" />
          {Array.from({ length: Math.floor(b.w / 46) }, (_, k) => (
            <rect key={k} x={b.x + 16 + k * 46} y={GY - b.h + 14} width={7}
              height={b.h - 34} fill="#ded7c4" opacity={0.8} />
          ))}
        </g>
      ))}
    </g>
  );
}

export function FilmStage({ t, orientation = "16:9" }: {
  t: number; orientation?: Orientation;
}): ReactElement {
  const layout = LAYOUTS[orientation];
  const fx = camAt(t);
  const fy = fyAt(t);
  const zoom = zoomAt(t) * layout.scale;
  const cx = layout.w / 2;
  const cy = layout.h / 2;
  return (
    <g>
      <rect x={0} y={0} width={layout.w} height={layout.h} fill="url(#fSky)" />
      <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-fx} ${-fy})`}>
        <Backdrop cam={fx} />
        {/* ground */}
        <rect x={fx - 1400} y={GY} width={2800} height={800} fill={GROUND} />
        <rect x={fx - 1400} y={GY} width={2800} height={2.4} fill="#cdc4ad" />
        <OpeningDesk t={t} />
        <Passage t={t} />
        <ActCompany t={t} />
        <ActPlan t={t} />
        <ActDiagnose t={t} />
        <ActBuild t={t} />
        <ActOperate t={t} />
        <ActDay90 t={t} />
        <ActClarity t={t} />
        <ActTransform t={t} />
        <BrandPlate t={t} />
      </g>
      {/* grade: grain + vignette, in screen space */}
      <rect x={0} y={0} width={layout.w} height={layout.h} fill="url(#fGrain)" />
      <rect x={0} y={0} width={layout.w} height={layout.h} fill="url(#fVin)" />
    </g>
  );
}

/* ── The poster ─────────────────────────────────────────────────────────── */

export function FilmPoster({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 960 540" className={className} role="img"
      aria-label="From Exposure to Control — an Iltizam film poster" preserveAspectRatio="xMidYMid slice">
      <FilmDefs />
      <g>
        <rect width={960} height={540} fill="url(#fSky)" />
        <g transform="translate(-2400 0) scale(1)">
          {/* the company at the reveal, with the path arriving */}
        </g>
        <g transform="translate(-40 40) scale(0.94)">
          <rect x={-400} y={GY} width={2400} height={200} fill={GROUND} />
          <Company x={40} t={2.2} order={0.35} />
          <rect x={-60} y={PATH_Y} width={1080} height={16} fill="url(#fPath)" stroke={PAPER_EDGE} strokeWidth={1} />
          <text x={120} y={PATH_Y + 12} fontFamily={SERIF} fontSize={11} fontWeight={640} letterSpacing="0.2em" fill={GRAPHITE}>DAY 1</text>
          <text x={820} y={PATH_Y + 12} fontFamily={SERIF} fontSize={11} fontWeight={640} letterSpacing="0.2em" fill={GRAPHITE}>DAY 90</text>
        </g>
        <rect x={0} y={0} width={960} height={540} fill="url(#fVin)" />
        <EdType x={480} y={92} text="FROM EXPOSURE" size={45} spacing={0.24} />
        <EdType x={480} y={144} text="TO CONTROL" size={45} spacing={0.28} color={INK} />
        <text x={480} y={176} textAnchor="middle" fontFamily={MONO} fontSize={10.4} letterSpacing="0.3em" fill={EMERALD} fontWeight={640}>
          DIAGNOSE. BUILD. OPERATIONALISE.
        </text>
      </g>
    </svg>
  );
}
