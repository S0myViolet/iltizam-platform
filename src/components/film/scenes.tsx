// ─────────────────────────────────────────────────────────────────────────────
// scenes.tsx — "After Submit" · the six scenes of the Iltizam brand film.
//
// One woman (Mariam), one company, one request. No voiceover until the very
// end; the interface appears in exactly two brief glimpses. Every scene is a
// pure function of (p, t):
//   p — scene progress 0…1 as mapped by the active cut's window table
//   t — scene-local master seconds (p × scene duration), used for beat logic
// No hooks, no state, no randomness: these components render identically on
// the server (poster) and in the rAF loop (player).
//
// Visual vocabulary
//   · Figure       — soft warm-black human silhouettes (seated/standing/walk/
//                    bust), with a head that can turn, shoulders that can ease
//   · PaperDoc     — a small paper rect with a folded corner: THE repeated
//                    shape of the film. foldT animates the corner growing and
//                    the rect collapsing closed.
//   · ReflectionLine — the motif: a fine warm 1px reflection that slides
//                    across physical surfaces, following the document. Never
//                    a glowing network line.
// Palette: warm daylight. Window light #e8dcc4→#f0e8d8, warm interior greys
// #2a2723/#3a352e, wood #4a3f33, paper #efeadf. Teal #0d6f64 is reserved for
// Iltizam's card and the resolution; soft amber #b0762a only ever tints a
// document copy. No system-box diagrams, no black-void networks.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactElement, ReactNode } from "react";
import { clamp01, easeInOut, easeOut, envelope, mix, sub } from "./math";

export const STAGE_W = 960;
export const STAGE_H = 540;

/* Palette */
const INK = "#171310"; // warm near-black silhouette
const WALL_A = "#2a2723";
const WALL_B = "#211e1a";
const WALL_DAY_A = "#3a352e";
const WALL_DAY_B = "#2c2822";
const FLOOR = "#1b1713";
const WOOD = "#4a3f33";
const PAPER = "#efeadf";
const PAPER_DIM = "#e6e1d1";
const LIGHT_A = "#e8dcc4";
const TEAL = "#0d6f64";
const TEAL_DEEP = "#0a5850";
const AMBER = "#b0762a";
const QUIET = "#cfc4a8"; // quiet warm text on dark surfaces
const BRAND = "#141927"; // the ink brand frame
const GOLD = "#d3b464";

const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

export type SceneProps = { p: number; t: number };

/* ── Shared defs ────────────────────────────────────────────────────────── */

export function FilmDefs(): ReactElement {
  return (
    <defs>
      <linearGradient id="fWindowMorning" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0e8d8" />
        <stop offset="1" stopColor="#e8dcc4" />
      </linearGradient>
      <linearGradient id="fWindowEvening" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e6c18a" />
        <stop offset="1" stopColor="#b07a42" />
      </linearGradient>
      <linearGradient id="fWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={WALL_A} />
        <stop offset="1" stopColor={WALL_B} />
      </linearGradient>
      <linearGradient id="fWallDay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={WALL_DAY_A} />
        <stop offset="1" stopColor={WALL_DAY_B} />
      </linearGradient>
      {/* the motif: a reflection, brightest at its head, trailing off behind */}
      <linearGradient id="fMotif" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={LIGHT_A} stopOpacity="0" />
        <stop offset="0.8" stopColor={LIGHT_A} stopOpacity="1" />
        <stop offset="1" stopColor={LIGHT_A} stopOpacity="0" />
      </linearGradient>
      <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.6" />
      </filter>
      <filter id="fBlur4" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <filter id="fBlur10" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
      <filter id="fCard" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={BRAND} floodOpacity="0.3" />
      </filter>
    </defs>
  );
}

/* ── The motif ──────────────────────────────────────────────────────────── */

/**
 * A fine warm reflection line (1px) sliding along a surface from x=from to
 * x=to as t01 runs 0→1. Hidden outside (0,1).
 */
function ReflectionLine({
  from,
  to,
  y,
  t01,
  opacity = 0.42,
  length = 130,
}: {
  from: number;
  to: number;
  y: number;
  t01: number;
  opacity?: number;
  length?: number;
}): ReactElement | null {
  if (t01 <= 0 || t01 >= 1) return null;
  const head = mix(from, to, easeInOut(t01));
  const dir = to >= from ? 1 : -1;
  const x = dir === 1 ? head - length : head;
  return (
    <rect
      x={x}
      y={y}
      width={length}
      height={1}
      fill="url(#fMotif)"
      opacity={opacity}
      /* moving leftward: mirror the gradient so the bright head leads */
      transform={dir === -1 ? `translate(${2 * head + length} 0) scale(-1 1)` : undefined}
    />
  );
}

/* ── The repeated shape: a paper document with a folded corner ──────────── */

function PaperDoc({
  x,
  y,
  w = 40,
  h = 52,
  fold = 9,
  tint = 0,
  opacity = 1,
  foldT = 0,
  rotate = 0,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fold?: number;
  /** 0..1 — the faint amber tint that marks a copy. */
  tint?: number;
  opacity?: number;
  /** 0..1 — the fold animates closed: corner grows, then the rect collapses. */
  foldT?: number;
  rotate?: number;
}): ReactElement | null {
  const grow = easeInOut(sub(foldT, 0, 0.55));
  const collapse = easeInOut(sub(foldT, 0.45, 1));
  const c = Math.min(mix(fold, Math.min(w, h) * 0.92, grow), Math.min(w, h) * 0.95);
  const o = opacity * (1 - 0.95 * collapse);
  if (o <= 0.01) return null;
  const sy = 1 - 0.85 * collapse;
  return (
    <g
      opacity={o}
      transform={`translate(${x + w / 2} ${y + h}) scale(1 ${sy}) rotate(${rotate}) translate(${-(x + w / 2)} ${-(y + h)})`}
    >
      <path
        d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`}
        fill={PAPER}
      />
      {tint > 0 ? (
        <path
          d={`M ${x} ${y} H ${x + w - c} L ${x + w} ${y + c} V ${y + h} H ${x} Z`}
          fill={AMBER}
          opacity={0.16 * tint}
        />
      ) : null}
      <path
        d={`M ${x + w - c} ${y} L ${x + w} ${y + c} L ${x + w - c} ${y + c} Z`}
        fill="#ddd5c2"
      />
      {w >= 30 && collapse < 0.2 ? (
        <g fill="#d8d1bd">
          <rect x={x + 6} y={y + h * 0.38} width={w * 0.62} height={2} />
          <rect x={x + 6} y={y + h * 0.55} width={w * 0.5} height={2} />
          <rect x={x + 6} y={y + h * 0.72} width={w * 0.56} height={2} />
        </g>
      ) : null}
    </g>
  );
}

/* ── Human silhouettes ──────────────────────────────────────────────────── */

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
 * A soft warm-black silhouette. Faces +x; flip mirrors it. `headTurn`
 * rotates the head (a small nose wedge makes the turn read), `lean` tips the
 * whole figure toward its facing direction, `shoulderDrop` eases the torso
 * down by whole pixels, `bun` gives Mariam her low bun.
 */
function Figure({
  x,
  y,
  s = 1,
  pose = "standing",
  flip = false,
  color = INK,
  opacity = 1,
  headTurn = 0,
  lean = 0,
  shoulderDrop = 0,
  bun = false,
}: {
  x: number;
  y: number;
  s?: number;
  pose?: Pose;
  flip?: boolean;
  color?: string;
  opacity?: number;
  headTurn?: number;
  lean?: number;
  shoulderDrop?: number;
  bun?: boolean;
}): ReactElement {
  const head = POSE_HEAD[pose];
  return (
    <g
      opacity={opacity}
      filter="url(#fSoft)"
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${lean})`}
    >
      <g transform={`translate(0 ${shoulderDrop})`} fill={color}>
        <path d={POSE_BODY[pose]} />
        <g transform={`rotate(${headTurn} ${head.cx} ${head.cy + 12})`}>
          <circle cx={head.cx} cy={head.cy} r={head.r} />
          {/* nose — the hint that lets a turn read on a silhouette */}
          <path
            d={`M ${head.cx + head.r - 2} ${head.cy - 3} l 6 3.4 l -6 3.4 Z`}
          />
          {bun ? <circle cx={head.cx - head.r + 3} cy={head.cy - 7} r={5.5} /> : null}
        </g>
      </g>
    </g>
  );
}

/* ── Small props ────────────────────────────────────────────────────────── */

/** A laptop on a surface. lidT: 0 open → 1 closed (rotates flat). */
function Laptop({
  x,
  y,
  lidT = 0,
  glow = 1,
}: {
  x: number;
  y: number;
  lidT?: number;
  glow?: number;
}): ReactElement {
  const hx = x + 58;
  const hy = y - 6;
  const angle = 78 * (1 - easeInOut(lidT));
  return (
    <g>
      {/* base — a visible slab with a lit top edge */}
      <rect x={x - 62} y={y - 7} width={124} height={7} rx={2} fill="#1c1712" />
      <rect x={x - 62} y={y - 7} width={124} height={2} rx={1} fill={LIGHT_A} opacity={0.18} />
      <g transform={`rotate(${angle} ${hx} ${hy})`}>
        <rect x={hx - 112} y={hy - 9} width={112} height={9} rx={2} fill="#211c17" />
        <rect x={hx - 112} y={hy - 9} width={112} height={1.5} fill={LIGHT_A} opacity={0.22} />
        {lidT < 0.6 ? (
          <rect
            x={hx - 106}
            y={hy - 8}
            width={100}
            height={7}
            fill={PAPER}
            opacity={0.16 * glow * (1 - lidT)}
          />
        ) : null}
      </g>
    </g>
  );
}

function Cursor({
  x,
  y,
  color = PAPER,
  opacity = 1,
  press = 0,
}: {
  x: number;
  y: number;
  color?: string;
  opacity?: number;
  press?: number;
}): ReactElement {
  return (
    <g
      opacity={opacity}
      transform={`translate(${x} ${y}) scale(${1 - 0.15 * press})`}
    >
      <path
        d="M0 0 L0 13 L3.6 9.9 L6 14.6 L8 13.6 L5.6 9 L9.6 8.6 Z"
        fill={color}
        stroke={color === PAPER ? INK : PAPER}
        strokeWidth={0.6}
      />
    </g>
  );
}

/* ── S1 · "Submit" · 0–8s ───────────────────────────────────────────────── */
// A warm room breathing. Window right, morning pool, Mariam seated at a
// laptop. The tiny diegetic panel, the click at 3.2, the birth of the motif,
// the long hold, the lid closing.

export const S1_DUR = 8;

export function S1Submit({ t }: SceneProps): ReactElement {
  const dim = 0.05 * easeInOut(sub(t, 7.2, 8)); // light dims 5%
  const lidT = sub(t, 7.15, 7.9);
  const headTurn = 9 * easeInOut(sub(t, 5.2, 6.6));
  const reach = easeInOut(sub(t, 6.85, 7.35));
  const press = sub(t, 3.05, 3.2) * (1 - sub(t, 3.3, 3.5));
  const panelO = t < 3.3 ? sub(t, 0.3, 1.0) : 1 - sub(t, 3.35, 3.95);
  const submittedO = Math.min(sub(t, 3.7, 4.2), 1 - sub(t, 6.5, 7.2));
  const motif = sub(t, 3.4, 4.6);
  const curMove = easeInOut(sub(t, 2.45, 3.1));
  const curX = mix(540, 500, curMove);
  const curY = mix(322, 283, curMove);
  const curO = Math.min(sub(t, 2.35, 2.6), 1 - sub(t, 3.35, 3.7));

  return (
    <g>
      {/* room */}
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
      <rect y={408} width={STAGE_W} height={132} fill={FLOOR} />

      {/* window, right — morning */}
      <rect x={628} y={38} width={224} height={364} fill="#16120e" filter="url(#fBlur10)" opacity={0.55} />
      <rect x={640} y={50} width={200} height={340} fill="url(#fWindowMorning)" opacity={0.94} />
      <g stroke="#1b1815" strokeWidth={6}>
        <rect x={640} y={50} width={200} height={340} fill="none" />
        <line x1={740} y1={50} x2={740} y2={390} />
        <line x1={640} y1={220} x2={840} y2={220} />
      </g>
      {/* light pool, falling left toward Mariam */}
      <polygon
        points="648,388 836,388 700,474 340,474"
        fill={LIGHT_A}
        opacity={0.09}
        filter="url(#fBlur4)"
      />

      {/* Mariam, seated behind the desk — off-center left, 3/4 by composition */}
      <rect x={282} y={318} width={10} height={62} fill="#14110e" />
      <Figure x={330} y={400} pose="seated" bun headTurn={headTurn} />
      {/* reaching arm as the lid closes */}
      {reach > 0 ? (
        <line
          x1={344}
          y1={306}
          x2={mix(360, 442, reach)}
          y2={mix(320, 344, reach)}
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
          filter="url(#fSoft)"
        />
      ) : null}

      {/* desk */}
      <rect x={150} y={352} width={720} height={10} fill={WOOD} />
      <rect x={150} y={362} width={720} height={58} fill="#352c22" opacity={0.95} />
      {/* desk catches the window light */}
      <rect x={560} y={352} width={310} height={10} fill={LIGHT_A} opacity={0.04} />

      <Laptop x={470} y={350} lidT={lidT} />

      {/* the tiny diegetic panel — ≤180px wide, paper, two chips, Submit */}
      <g opacity={panelO}>
        <rect x={386} y={208} width={172} height={102} rx={6} fill={PAPER} opacity={0.97} />
        <rect x={386} y={208} width={172} height={102} rx={6} fill="none" stroke="#d8d1bd" />
        <text x={396} y={221} fontFamily={SANS} fontSize={8.5} fill="#5d6270">
          {"Your application"}
        </text>
        {[
          { y: 227, label: "CV_Mariam_Hassan.pdf" },
          { y: 250, label: "ID_scan.jpg" },
        ].map((c) => (
          <g key={c.label}>
            <rect x={396} y={c.y} width={152} height={17} rx={3} fill={PAPER_DIM} />
            <circle cx={405} cy={c.y + 8.5} r={2.4} fill="none" stroke="#5d6270" strokeWidth={1} />
            <text x={413} y={c.y + 11.5} fontFamily={MONO} fontSize={8} fill="#191e2a">
              {c.label}
            </text>
          </g>
        ))}
        <g transform={`translate(0 ${1.4 * press})`}>
          <rect
            x={466}
            y={276}
            width={80}
            height={20}
            rx={4}
            fill={press > 0.3 ? "#1f1b17" : "#2a2723"}
          />
          <text
            x={506}
            y={289.5}
            textAnchor="middle"
            fontFamily={SANS}
            fontSize={10}
            fill={PAPER}
          >
            {"Submit"}
          </text>
        </g>
      </g>
      <Cursor x={curX} y={curY} color={INK} opacity={curO} press={press} />

      {/* quiet confirmation */}
      <text
        x={470}
        y={334}
        textAnchor="middle"
        fontFamily={SANS}
        fontSize={13}
        fill={QUIET}
        opacity={submittedO}
      >
        {"Application submitted"}
      </text>

      {/* THE MOTIF IS BORN — off the laptop lid, across the desk, out right */}
      <ReflectionLine from={470} to={1000} y={349.5} t01={motif} opacity={0.6} length={150} />

      {/* foreground: plant / shelf plane obstructing frame left */}
      <g filter="url(#fBlur4)">
        <rect x={-24} y={0} width={116} height={STAGE_H} fill="#14110d" opacity={0.94} />
        <path d="M 70 540 C 62 430 84 380 76 330 C 110 372 104 448 96 540 Z" fill="#100e0b" />
        <path d="M 96 540 C 104 460 128 428 122 386 C 148 430 138 490 128 540 Z" fill="#0e0c09" />
      </g>

      {/* the 5% dim as the lid closes */}
      <rect width={STAGE_W} height={STAGE_H} fill="#000" opacity={dim} />
    </g>
  );
}

/* ── S2 · "Time moves" · 8–19s ──────────────────────────────────────────── */
// Quick uneven fragments — 1.5 / 2.5 / 1 / 2 / 1.5+2.5 — each its own
// composition, crossfaded on motion. The quiet counterpoint: the document
// duplicating into a drawer and out of frame, each move preceded by the motif.

export const S2_DUR = 11;

function Frag({
  o,
  drift = 0,
  children,
}: {
  o: number;
  drift?: number;
  children: ReactNode;
}): ReactElement | null {
  if (o <= 0.01) return null;
  return (
    <g opacity={o} transform={`translate(${drift * (1 - easeOut(o))} 0)`}>
      {children}
    </g>
  );
}

export function S2Fragments({ t }: SceneProps): ReactElement {
  const oA = envelope(t, 0, 1.55, 0.3);
  const oB = Math.min(sub(t, 1.3, 1.7), 1 - sub(t, 3.6, 3.95));
  const oC = Math.min(sub(t, 3.75, 4.05), 1 - sub(t, 4.8, 5.1));
  const oD = Math.min(sub(t, 4.9, 5.2), 1 - sub(t, 6.7, 7.05));
  const oE = sub(t, 6.85, 7.25);

  /* (b) internals */
  const badgeIn = easeOut(sub(t, 1.5, 2.2));
  const flashO = Math.min(sub(t, 2.4, 2.5), 1 - sub(t, 2.52, 2.9)) * 0.9;
  const afterFlash = sub(t, 2.55, 2.8);

  /* (c) pen — already moving as the fragment lands */
  const draw = easeInOut(sub(t, 3.9, 4.75));

  /* (e) counterpoint */
  const m1 = sub(t, 7.05, 7.7);
  const dup1 = easeInOut(sub(t, 7.75, 8.55));
  const drawerClose = easeInOut(sub(t, 8.55, 9.0));
  const m2 = sub(t, 8.85, 9.4);
  const dup2 = easeInOut(sub(t, 9.45, 10.7));

  return (
    <g>
      <rect width={STAGE_W} height={STAGE_H} fill={WALL_B} />

      {/* (a) interview — wide, two silhouettes across a table, one nods */}
      <Frag o={oA} drift={-18}>
        <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
        <rect y={430} width={STAGE_W} height={110} fill={FLOOR} />
        <g transform="translate(-60 0)">
          <rect x={330} y={352} width={300} height={10} fill={WOOD} />
          <rect x={330} y={362} width={300} height={70} fill="#332a20" opacity={0.9} />
          <Figure x={392} y={402} pose="seated" s={0.94} bun />
          <Figure
            x={572}
            y={402}
            pose="seated"
            s={0.94}
            flip
            headTurn={
              7 * easeInOut(sub(t, 0.55, 0.85)) - 7 * easeInOut(sub(t, 0.95, 1.3))
            }
          />
        </g>
        <rect x={700} y={90} width={170} height={310} fill={LIGHT_A} opacity={0.05} filter="url(#fBlur10)" />
      </Frag>

      {/* (b) first day — badge card, then the white flash of the access photo */}
      <Frag o={oB} drift={22}>
        <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
        <g transform={`translate(${mix(48, 0, badgeIn)} 0)`} opacity={badgeIn}>
          <rect x={200} y={190} width={176} height={104} rx={8} fill={PAPER} filter="url(#fCard)" />
          <circle cx={224} cy={214} r={4.5} fill="#ab8434" />
          <text x={216} y={244} fontFamily={SERIF} fontSize={14} fill="#191e2a">
            {"Welcome to the team"}
          </text>
          <text x={216} y={264} fontFamily={SANS} fontSize={10} fill="#5d6270">
            {"Mariam Hassan"}
          </text>
        </g>
        {/* after the flash — Mariam holds her badge */}
        <g opacity={afterFlash}>
          <Figure x={660} y={486} pose="bust" s={1.5} bun />
          <line x1={660} y1={412} x2={655} y2={436} stroke={PAPER} strokeWidth={1} opacity={0.35} />
          <rect x={641} y={436} width={28} height={38} rx={3} fill={PAPER} opacity={0.92} />
          <rect x={646} y={444} width={18} height={3} fill="#d8d1bd" />
          <rect x={646} y={452} width={13} height={3} fill="#d8d1bd" />
        </g>
      </Frag>

      {/* (c) a pen line draws across a form */}
      <Frag o={oC} drift={-14}>
        <rect width={STAGE_W} height={STAGE_H} fill="#26211c" />
        <g transform="rotate(-2 480 270)">
          <rect x={140} y={80} width={680} height={380} fill={PAPER} filter="url(#fCard)" />
          <g fill="#ddd5c2">
            <rect x={200} y={150} width={430} height={3} />
            <rect x={200} y={195} width={520} height={3} />
            <rect x={200} y={240} width={470} height={3} />
          </g>
          <path
            d="M 300 332 C 360 300 420 352 470 322 C 520 294 560 338 620 312"
            fill="none"
            stroke={INK}
            strokeWidth={2.4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
          {draw > 0 && draw < 1 ? (
            /* the pen itself — nib at the line's head, barrel angled away */
            <g
              transform={`translate(${mix(300, 620, draw)} ${mix(330, 314, draw) + 9 * Math.sin(draw * 9)}) rotate(28)`}
            >
              <path d="M 0 0 l 5 -12 l 5 2 Z" fill={INK} />
              <rect x={3} y={-64} width={9} height={54} rx={3} fill={INK} transform="rotate(-4)" />
            </g>
          ) : null}
        </g>
      </Frag>

      {/* (d) payroll — keystroke dots on a screen slab, no readable numbers */}
      <Frag o={oD} drift={18}>
        <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
        <rect x={470} y={150} width={340} height={230} rx={10} fill="#201c18" />
        <rect x={486} y={166} width={308} height={198} rx={6} fill={PAPER} opacity={0.05} />
        <g fill={PAPER} opacity={0.08}>
          <rect x={504} y={196} width={240} height={7} />
          <rect x={504} y={224} width={190} height={7} />
          <rect x={504} y={300} width={220} height={7} />
        </g>
        {Array.from({ length: 10 }, (_, i) => (
          <circle
            key={i}
            cx={504 + i * 24}
            cy={264}
            r={3}
            fill={PAPER}
            opacity={0.8 * sub(t, 5.35 + i * 0.13, 5.47 + i * 0.13)}
          />
        ))}
        <rect x={0} y={430} width={STAGE_W} height={110} fill="#120f0c" filter="url(#fBlur4)" />
      </Frag>

      {/* (e) THE QUIET COUNTERPOINT — the document duplicates */}
      <Frag o={oE}>
        <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
        <rect y={380} width={STAGE_W} height={160} fill="#2c2823" />
        {/* HR tray */}
        <g>
          <rect x={380} y={318} width={150} height={8} fill="#3a352e" />
          <rect x={380} y={296} width={6} height={30} fill="#3a352e" />
          <rect x={524} y={296} width={6} height={30} fill="#3a352e" />
        </g>
        {/* the original */}
        <PaperDoc x={430} y={258} w={46} h={60} />
        {/* motif precedes each movement */}
        <ReflectionLine from={200} to={780} y={316} t01={m1} />
        {/* copy 1 → down-left into the drawer */}
        {dup1 > 0 ? (
          <PaperDoc
            x={mix(430, 168, dup1)}
            y={mix(258, 404, dup1)}
            w={46}
            h={60}
            tint={1}
            rotate={-8 * dup1}
            opacity={1 - sub(dup1, 0.82, 1)}
          />
        ) : null}
        {/* drawer slab that closes */}
        <rect x={120} y={400} width={140} height={82} fill="#262019" />
        <rect x={128} y={412} width={124} height={30} fill="#0f0c09" opacity={0.8 * (1 - drawerClose)} />
        <rect
          x={128}
          y={mix(438, 412, drawerClose)}
          width={124}
          height={mix(38, 62, drawerClose)}
          fill="#33291f"
        />
        <ReflectionLine from={260} to={820} y={316} t01={m2} length={100} opacity={0.36} />
        {/* copy 2 → drifts right, exits frame (vendor — no label) */}
        {dup2 > 0 ? (
          <PaperDoc
            x={mix(430, 985, dup2)}
            y={mix(258, 276, dup2)}
            w={46}
            h={60}
            tint={1}
            rotate={9 * dup2}
          />
        ) : null}
        {/* foreground plane partially obscuring */}
        <rect x={800} y={0} width={180} height={STAGE_H} fill="#12100c" opacity={0.85} filter="url(#fBlur4)" />
      </Frag>

      {/* the soft white flash — the access-card photo */}
      {flashO > 0.01 ? (
        <rect width={STAGE_W} height={STAGE_H} fill="#fff" opacity={flashO} />
      ) : null}
    </g>
  );
}

/* ── S3 · "Months later" · 19–26s ───────────────────────────────────────── */
// The same office, wider and busier. Four figures, neutral midday. Four faint
// folded rects resting where they were left. A slow push-in. Nothing happens.

export const S3_DUR = 7;

export function S3MonthsLater({ t }: SceneProps): ReactElement {
  const k = 1 + 0.06 * (t / S3_DUR); // slow push-in 1.00 → 1.06
  const dust = 0.3 - 0.08 * (t / S3_DUR); // one copy slowly dust-settles
  const microTurn =
    4 * (easeInOut(sub(t, 3.0, 3.5)) - easeInOut(sub(t, 4.2, 4.8)));
  return (
    <g transform={`translate(480 300) scale(${k}) translate(-480 -300)`}>
      <rect x={-40} y={-30} width={STAGE_W + 80} height={STAGE_H + 60} fill="url(#fWallDay)" />
      <rect x={-40} y={428} width={STAGE_W + 80} height={142} fill="#221d18" />
      {/* neutral midday wash */}
      <rect x={-40} y={-30} width={STAGE_W + 80} height={STAGE_H + 60} fill="#f0e8d8" opacity={0.04} />

      {/* far window, left — neutral */}
      <rect x={60} y={70} width={150} height={260} fill="#f0e8d8" opacity={0.5} />
      <g stroke="#231f1a" strokeWidth={5}>
        <rect x={60} y={70} width={150} height={260} fill="none" />
        <line x1={135} y1={70} x2={135} y2={330} />
      </g>

      {/* furniture planes */}
      <rect x={250} y={236} width={8} height={170} fill={WALL_DAY_B} />
      <rect x={700} y={150} width={220} height={8} fill={WOOD} />
      <rect x={700} y={214} width={220} height={8} fill={WOOD} />
      <rect x={80} y={380} width={160} height={92} fill="#2a241d" />
      {/* drawer slightly open */}
      <rect x={88} y={398} width={128} height={26} fill="#362c21" />
      <rect x={88} y={424} width={136} height={8} fill="#1d1812" />

      {/* desks and four figures */}
      {[
        { dx: 180, dy: 372, w: 200, fx: 240, fy: 412, s: 0.6, flip: false },
        { dx: 430, dy: 360, w: 220, fx: 500, fy: 400, s: 0.64, flip: true },
        { dx: 430, dy: 360, w: 0, fx: 610, fy: 404, s: 0.56, flip: false },
        { dx: 690, dy: 372, w: 200, fx: 764, fy: 412, s: 0.6, flip: true },
      ].map((d, i) => (
        <g key={i}>
          {d.w > 0 ? (
            <g>
              <rect x={d.dx} y={d.dy} width={d.w} height={9} fill={WOOD} />
              <rect x={d.dx} y={d.dy + 9} width={d.w} height={46} fill="#31291f" opacity={0.9} />
              <rect x={d.dx + 30} y={d.dy - 44} width={62} height={42} rx={3} fill="#221d18" />
            </g>
          ) : null}
          <Figure
            x={d.fx}
            y={d.fy}
            s={d.s}
            pose="seated"
            flip={d.flip}
            bun={i === 1}
            headTurn={i === 2 ? microTurn : 0}
            opacity={0.94}
          />
        </g>
      ))}

      {/* FOUR faint folded-corner rects, resting where they were left */}
      <PaperDoc x={770} y={106} w={34} h={44} opacity={0.32} /> {/* shelf */}
      <PaperDoc x={120} y={382} w={36} h={40} opacity={0.3} rotate={-5} /> {/* open drawer */}
      <g>
        {/* broad open tray on the first desk */}
        <rect x={290} y={366} width={96} height={6} fill="#3a352e" />
        <rect x={290} y={348} width={5} height={24} fill="#3a352e" />
        <rect x={381} y={348} width={5} height={24} fill="#3a352e" />
        <PaperDoc x={312} y={314} w={44} h={54} opacity={0.32} />
      </g>
      {/* far right edge, half out of frame — dust settling */}
      <PaperDoc x={936} y={296} w={44} h={54} opacity={clamp01(dust)} />

      {/* foreground partial obstruction */}
      <rect x={-40} y={470} width={STAGE_W + 80} height={100} fill="#15110d" opacity={0.75} filter="url(#fBlur4)" />
    </g>
  );
}

/* ── S4 · "The request" · 26–33s ────────────────────────────────────────── */
// The turning point. A message types itself out. Two copies are found, a
// third slab opens on nothing certain. Two people lean toward one screen.

export const S4_DUR = 7;

const S4_MSG_LINES = [
  "Could you please delete the",
  "ID copy I submitted when",
  "I applied?",
];

export function S4Request({ t }: SceneProps): ReactElement {
  const threadO = 1 - sub(t, 3.3, 3.6);
  const deskO = sub(t, 3.4, 3.7);

  /* typing — character by character */
  const total = S4_MSG_LINES.reduce((n, l) => n + l.length, 0);
  const chars = Math.floor(mix(0, total, easeInOut(sub(t, 0.25, 2.75))));
  let remaining = chars;
  const typed = S4_MSG_LINES.map((l) => {
    const take = Math.max(0, Math.min(l.length, remaining));
    remaining -= take;
    return l.slice(0, take);
  });
  const linesShown = typed.filter((l, i) => l.length > 0 || i === 0).length;

  /* HR beat */
  const open1 = easeInOut(sub(t, 3.7, 4.3));
  const open2 = easeInOut(sub(t, 4.5, 5.1));
  const open3 = easeInOut(sub(t, 5.4, 6.0));
  const headTurn = -8 * easeInOut(sub(t, 6.0, 6.4));
  const walkIn = easeInOut(sub(t, 6.0, 6.6));
  const leanT = easeInOut(sub(t, 6.5, 7.0));

  return (
    <g>
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />

      {/* the message thread — diegetic, paper-toned */}
      {threadO > 0 ? (
        <g opacity={threadO}>
          <rect x={250} y={88} width={460} height={364} rx={12} fill="#221e1a" />
          <rect x={266} y={104} width={428} height={332} rx={7} fill={PAPER} opacity={0.95} />
          {/* header */}
          <circle cx={292} cy={130} r={10} fill={PAPER_DIM} />
          <rect x={310} y={125} width={72} height={9} rx={2} fill="#d8d1bd" />
          <line x1={266} y1={148} x2={694} y2={148} stroke="#d8d1bd" />
          {/* notification tick dot */}
          <circle cx={676} cy={130} r={3.5} fill={TEAL} opacity={Math.min(sub(t, 0.2, 0.35), 1 - sub(t, 1.6, 2.2))} />
          {/* incoming bubble */}
          {chars > 0 ? (
            <g>
              <rect
                x={288}
                y={176}
                width={236}
                height={20 * linesShown + 18}
                rx={10}
                fill={PAPER_DIM}
              />
              {typed.map((l, i) =>
                l ? (
                  <text
                    key={i}
                    x={302}
                    y={200 + i * 20}
                    fontFamily={SANS}
                    fontSize={12.5}
                    fill="#191e2a"
                  >
                    {l}
                  </text>
                ) : null,
              )}
              <text x={290} y={20 * linesShown + 210} fontFamily={SANS} fontSize={8.5} fill="#5d6270">
                {"9:42"}
              </text>
            </g>
          ) : null}
        </g>
      ) : null}

      {/* the HR desk — copies 1 and 2 found; the third slab holds only shadow */}
      {deskO > 0 ? (
        <g opacity={deskO}>
          <rect y={420} width={STAGE_W} height={120} fill={FLOOR} />
          <rect x={160} y={370} width={640} height={11} fill={WOOD} />
          <rect x={160} y={381} width={640} height={52} fill="#342b21" opacity={0.92} />
          <Figure x={236} y={418} pose="seated" s={0.92} headTurn={headTurn} lean={5 * leanT} />
          {/* the shared screen */}
          <rect x={640} y={268} width={130} height={102} rx={6} fill="#201c18" />
          <rect x={650} y={278} width={110} height={82} rx={3} fill={PAPER} opacity={0.07} />

          {/* folder slabs */}
          {[
            { x: 310, y: 322, openT: open1, empty: false },
            { x: 430, y: 328, openT: open2, empty: false },
            { x: 545, y: 322, openT: open3, empty: true },
          ].map((f, i) => (
            <g key={i}>
              {/* revealed contents */}
              {f.empty ? (
                <rect
                  x={f.x + 10}
                  y={f.y + 8}
                  width={66}
                  height={36}
                  fill="#0e0b08"
                  opacity={0.75 * f.openT}
                />
              ) : (
                <PaperDoc
                  x={f.x + 22}
                  y={f.y + 5}
                  w={40}
                  h={40}
                  tint={1}
                  opacity={f.openT}
                />
              )}
              {/* cover flips up */}
              <g transform={`translate(${f.x} ${f.y}) scale(1 ${1 - 1.85 * f.openT}) `}>
                <rect width={86} height={48} rx={3} fill={f.openT > 0.5 ? "#cfc7b0" : "#d9d2be"} />
                <rect x={6} y={-7} width={30} height={8} rx={2} fill="#d9d2be" />
              </g>
            </g>
          ))}

          {/* a second silhouette walks in; both lean toward one screen */}
          <Figure
            x={mix(920, 756, walkIn)}
            y={470 + 1.6 * Math.abs(Math.sin(walkIn * 9))}
            pose={walkIn < 1 ? "walk" : "standing"}
            flip
            s={1.05}
            lean={9 * leanT}
            opacity={sub(t, 5.9, 6.15)}
          />
        </g>
      ) : null}
    </g>
  );
}

/* ── S5 · "Seen" · 33–41.5s ─────────────────────────────────────────────── */
// The earned reveal — the ONLY product UI. A calm parchment card, four rows,
// one finding, and a human decision given time. The room answers: three
// copies fold closed, one settles into a drawer, the motif retracts home.

export const S5_DUR = 8.5;

const S5_ROWS = ["HR folder", "Onboarding archive", "External processor", "Recruitment duplicate"];

export function S5Seen({ t }: SceneProps): ReactElement {
  const cardO = sub(t, 0, 0.7);
  const cardRise = mix(12, 0, easeOut(sub(t, 0, 0.8)));
  const findingO = sub(t, 3.5, 4.1);
  const lean = 6 * easeInOut(sub(t, 4.5, 4.9)); // then 4.9–5.6: nothing moves
  const click1 = sub(t, 5.55, 5.62);
  const tealRail = easeOut(sub(t, 5.6, 5.95));
  const ownerO = sub(t, 5.7, 6.1);
  const click2 = sub(t, 6.75, 6.82);
  const confirmed = sub(t, 6.8, 7.1);
  const retract = easeInOut(sub(t, 6.9, 7.9));
  const doneO = sub(t, 7.8, 8.2);

  /* deliberate cursor, card-local coordinates */
  const c1 = easeInOut(sub(t, 5.0, 5.55));
  const c2 = easeInOut(sub(t, 6.2, 6.7));
  const curX = c2 > 0 ? mix(170, 276, c2) : mix(322, 170, c1);
  const curY = c2 > 0 ? mix(243, 284, c2) : mix(140, 243, c1);
  const curO = sub(t, 4.9, 5.1);
  const press = Math.max(click1 * (1 - sub(t, 5.72, 5.9)), click2 * (1 - sub(t, 6.92, 7.1)));

  /* the room responds */
  const drawerOpen = easeInOut(sub(t, 6.9, 7.2));
  const settle = easeInOut(sub(t, 7.15, 7.9));
  const drawerClose = easeInOut(sub(t, 7.9, 8.25));

  return (
    <g>
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
      <rect y={430} width={STAGE_W} height={110} fill={FLOOR} />

      {/* left column of the room — where the copies rest */}
      <rect x={110} y={150} width={190} height={7} fill={WOOD} />
      <rect x={170} y={296} width={110} height={8} fill="#3a352e" />
      <rect x={170} y={278} width={5} height={26} fill="#3a352e" />
      <rect x={275} y={278} width={5} height={26} fill="#3a352e" />
      <rect x={80} y={388} width={140} height={92} fill="#2a241d" />
      {/* drawer cavity + front */}
      <rect x={88} y={404} width={124} height={30} fill="#0f0c09" opacity={0.8 * drawerOpen * (1 - drawerClose)} />
      <rect
        x={88}
        y={mix(404, mix(410, 404, drawerClose), drawerOpen)}
        width={124}
        height={28}
        fill="#362c21"
      />

      {/* the four scattered copies */}
      <PaperDoc x={150} y={104} w={36} h={46} opacity={0.34} foldT={sub(t, 6.9, 7.6)} />
      <PaperDoc x={196} y={246} w={40} h={50} opacity={0.36} foldT={sub(t, 7.15, 7.85)} />
      <PaperDoc x={936} y={210} w={44} h={52} opacity={0.3} foldT={sub(t, 7.4, 8.1)} />
      {/* the one that settles into a proper drawer */}
      {settle < 1 ? (
        <PaperDoc
          x={mix(112, 146, settle)}
          y={mix(340, 408, settle)}
          w={38}
          h={46}
          opacity={0.4 * (1 - sub(settle, 0.8, 1))}
          rotate={-4 * settle}
        />
      ) : null}

      {/* the compliance manager at the desk, right */}
      <rect x={610} y={382} width={300} height={12} fill={WOOD} />
      <rect x={610} y={394} width={300} height={50} fill="#342b21" opacity={0.92} />
      <rect x={660} y={300} width={120} height={84} rx={6} fill="#201c18" />
      <rect x={669} y={308} width={102} height={68} rx={3} fill={PAPER} opacity={0.06} />
      <Figure x={758} y={430} pose="seated" s={0.95} flip lean={lean} />

      {/* the motif retracts toward one point */}
      <ReflectionLine from={900} to={300} y={348} t01={retract} opacity={0.34} />
      <ReflectionLine from={60} to={280} y={470} t01={retract} opacity={0.3} length={100} />
      <ReflectionLine from={930} to={330} y={160} t01={retract} opacity={0.26} length={100} />

      {/* THE ILTIZAM GLIMPSE — a calm parchment card, ~36% frame width */}
      <g
        opacity={cardO}
        transform={`translate(300 ${115 + cardRise}) rotate(-1.4)`}
        filter="url(#fCard)"
      >
        <rect width={350} height={330} rx={8} fill={PAPER} stroke="#d8d1bd" />
        <text x={20} y={38} fontFamily={SERIF} fontSize={21} fill="#191e2a">
          {"Mariam Hassan"}
        </text>
        <text x={20} y={58} fontFamily={MONO} fontSize={10} letterSpacing="0.06em" fill="#5d6270">
          {"Recruitment identity record"}
        </text>
        <line x1={20} y1={70} x2={330} y2={70} stroke="#d8d1bd" />
        <text x={20} y={92} fontFamily={SANS} fontSize={13} fontWeight={600} fill="#191e2a">
          {"4 locations identified"}
        </text>

        {S5_ROWS.map((r, i) => {
          const rowO = sub(t, 1.3 + i * 0.5, 1.75 + i * 0.5);
          const y0 = 104 + i * 27;
          return (
            <g key={r}>
              <rect x={20} y={y0} width={310} height={23} rx={4} fill={PAPER_DIM} opacity={0.55 * rowO} />
              <circle cx={31} cy={y0 + 11.5} r={3} fill={TEAL} opacity={rowO} />
              <text
                x={44}
                y={y0 + 15.5}
                fontFamily={SANS}
                fontSize={11.5}
                fill="#191e2a"
                opacity={mix(0.22, 1, rowO)}
              >
                {r}
              </text>
            </g>
          );
        })}

        {/* the finding — amber rail, then the human decision */}
        <g opacity={findingO}>
          <rect x={20} y={220} width={3} height={46} fill={AMBER} />
          <rect x={20} y={220} width={3} height={46 * tealRail} fill={TEAL} />
          <text x={30} y={236} fontFamily={SANS} fontSize={11.5} fill="#191e2a">
            {"Identity record retained beyond recruitment purpose"}
          </text>
          <text x={30} y={253} fontFamily={SANS} fontSize={10.5} fill="#5d6270">
            {"Human review required"}
          </text>
        </g>
        <text x={30} y={289} fontFamily={SANS} fontSize={11} fill={TEAL_DEEP} opacity={ownerO}>
          {"Owner assigned"}
        </text>
        <g opacity={ownerO} transform={`translate(0 ${1.4 * press * (c2 > 0.5 ? 1 : 0)})`}>
          <rect
            x={246}
            y={272}
            width={84}
            height={22}
            rx={4}
            fill={confirmed > 0 ? TEAL : "none"}
            stroke={confirmed > 0 ? TEAL : "#b4ad97"}
          />
          <text
            x={288}
            y={286.5}
            textAnchor="middle"
            fontFamily={SANS}
            fontSize={10.5}
            fill={confirmed > 0 ? "#ffffff" : "#494e5b"}
          >
            {confirmed > 0 ? "Confirmed" : "Confirm"}
          </text>
        </g>
        <text x={20} y={318} fontFamily={SANS} fontSize={10.5} fill={TEAL_DEEP} opacity={doneO}>
          {"Request completed"}
        </text>

        <Cursor x={curX} y={curY} color={INK} opacity={curO} press={press} />
      </g>
    </g>
  );
}

/* ── S6 · "Evening" · 41.5–48s ──────────────────────────────────────────── */
// The S1 room at evening. Mariam by the window, phone in hand, shoulders
// easing two pixels. The window darkens into the ink brand frame.

export const S6_DUR = 6.5;

export function S6Evening({ t }: SceneProps): ReactElement {
  const msgO = sub(t, 0.9, 1.4);
  const shoulder = 2 * easeInOut(sub(t, 1.2, 2.0));
  const cut = easeInOut(sub(t, 4.0, 4.9)); // window → ink frame match cut
  const o1 = sub(t, 4.75, 5.2);
  const o2 = sub(t, 5.0, 5.45);
  const o3 = sub(t, 5.2, 5.6);
  const o4 = sub(t, 5.5, 5.9);

  /* the darkening window grows to the full frame */
  const fx = mix(640, 0, cut);
  const fy = mix(50, 0, cut);
  const fw = mix(200, STAGE_W, cut);
  const fh = mix(340, STAGE_H, cut);

  return (
    <g>
      {/* the same room, evening */}
      <rect width={STAGE_W} height={STAGE_H} fill="url(#fWall)" />
      <rect width={STAGE_W} height={STAGE_H} fill="#000" opacity={0.16} />
      <rect y={408} width={STAGE_W} height={132} fill={FLOOR} />

      <rect x={628} y={38} width={224} height={364} fill="#0f0b07" filter="url(#fBlur10)" opacity={0.6} />
      <rect x={640} y={50} width={200} height={340} fill="url(#fWindowEvening)" opacity={0.85} />
      <g stroke="#161210" strokeWidth={6}>
        <rect x={640} y={50} width={200} height={340} fill="none" />
        <line x1={740} y1={50} x2={740} y2={390} />
        <line x1={640} y1={220} x2={840} y2={220} />
      </g>
      {/* the pool falls the other way now */}
      <polygon
        points="656,388 844,388 948,474 758,474"
        fill="#d9a76a"
        opacity={0.07}
        filter="url(#fBlur4)"
      />

      {/* the desk, the laptop closed since morning */}
      <rect x={150} y={352} width={380} height={10} fill={WOOD} />
      <rect x={150} y={362} width={380} height={58} fill="#31281f" opacity={0.95} />
      <rect x={408} y={344} width={124} height={6} rx={2} fill="#211c17" />

      {/* Mariam, standing at the window — contre-jour */}
      <Figure x={600} y={470} pose="standing" bun shoulderDrop={shoulder} />
      <line x1={614} y1={358} x2={636} y2={380} stroke={INK} strokeWidth={8} strokeLinecap="round" filter="url(#fSoft)" />
      <rect x={630} y={368} width={22} height={40} rx={4} fill="#0f0c0a" />
      <rect x={633} y={372} width={16} height={32} rx={2} fill={PAPER} opacity={0.14} />

      <g opacity={msgO}>
        <text x={560} y={330} textAnchor="end" fontFamily={SANS} fontSize={10.5} fill={QUIET}>
          {"Your request has been"}
        </text>
        <text x={560} y={345} textAnchor="end" fontFamily={SANS} fontSize={10.5} fill={QUIET}>
          {"completed."}
        </text>
      </g>

      {/* foreground plant, matching S1 */}
      <g filter="url(#fBlur4)">
        <rect x={-24} y={0} width={100} height={STAGE_H} fill="#100d0a" opacity={0.94} />
        <path d="M 62 540 C 54 440 74 392 66 348 C 98 388 94 456 86 540 Z" fill="#0c0a08" />
      </g>

      {/* window-to-frame match cut → the ink brand frame */}
      {cut > 0 ? <rect x={fx} y={fy} width={fw} height={fh} fill={BRAND} opacity={0.25 + 0.75 * cut} /> : null}

      {cut >= 1 ? <rect width={STAGE_W} height={STAGE_H} fill={BRAND} /> : null}

      {/* the brand frame */}
      <g opacity={o1}>
        <text x={480} y={202} textAnchor="middle" fontFamily={SERIF} fontSize={15} fill="#a6abba">
          {"What happens after “Submit” matters."}
        </text>
      </g>
      <g opacity={o2}>
        {/* the certificate tile, gold on ink */}
        <g transform="translate(452 232) scale(1.4)">
          <rect x={0.75} y={0.75} width={38.5} height={38.5} rx={8} fill="#1f2636" stroke="#2e364a" />
          <rect x={5.5} y={5.5} width={29} height={29} rx={4.5} fill="none" stroke="#ab8434" strokeWidth={1} opacity={0.55} />
          <path d="M13 10.5 h14 v3.2 h-5.1 v12.6 H27 v3.2 H13 v-3.2 h5.1 V13.7 H13 Z" fill={GOLD} />
        </g>
        <text
          x={487}
          y={330}
          textAnchor="middle"
          fontFamily={SERIF}
          fontSize={24}
          letterSpacing="0.3em"
          fill="#f0ecdf"
        >
          {"ILTZAM"}
        </text>
      </g>
      <g opacity={o3}>
        <text x={480} y={372} textAnchor="middle" fontFamily={SERIF} fontSize={16.5} fill="#f0ecdf">
          {"See the responsibility."}
        </text>
        <text x={480} y={398} textAnchor="middle" fontFamily={SERIF} fontSize={16.5} fill="#f0ecdf">
          {"Protect the trust."}
        </text>
      </g>
      <g opacity={o4}>
        <text x={480} y={434} textAnchor="middle" fontFamily={SANS} fontSize={10} fill="#8f95a6">
          {"Automated data protection monitoring, guided by human review."}
        </text>
      </g>
    </g>
  );
}

/* ── Scene registry ─────────────────────────────────────────────────────── */

export type SceneId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6";

export const SCENES: Record<
  SceneId,
  { C: (sp: SceneProps) => ReactElement; dur: number }
> = {
  s1: { C: S1Submit, dur: S1_DUR },
  s2: { C: S2Fragments, dur: S2_DUR },
  s3: { C: S3MonthsLater, dur: S3_DUR },
  s4: { C: S4Request, dur: S4_DUR },
  s5: { C: S5Seen, dur: S5_DUR },
  s6: { C: S6Evening, dur: S6_DUR },
};

/* ── Poster ─────────────────────────────────────────────────────────────── */

/**
 * The film's poster: Mariam at the warm window, light pool, the tiny submit
 * panel still open (S1 at 2.7s). Server-renderable — no hooks, no state.
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
      <S1Submit p={2.7 / S1_DUR} t={2.7} />
    </svg>
  );
}
