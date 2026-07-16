"use client";

/**
 * "What You Don't See" — the seven scenes.
 *
 * Every scene is a pure function of (p, t): p is the scene-local progress
 * 0→1 (mapped by the cut tables in BrandFilm), t is the absolute film clock
 * used only for continuous motion (thread flow, breathing, steam). Beat
 * timings are expressed in scene-local seconds of the 60s cut, so compressed
 * cuts replay the same choreography faster with no scene changes.
 */

import type { ReactElement, ReactNode } from "react";

import { clamp01, easeInOut, easeOut, mix, seg } from "./engine";

export type SceneProps = { p: number; t: number };

/* ── Palette / typography (locked visual language) ──────────────────────── */

export const SERIF = 'var(--font-display, Georgia), Georgia, "Times New Roman", serif';
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const FIG = "#0e1013";
const RIM = "#8d867a";
const SAFE = "#6fa39c";
const RISK = "#b0762a";
const PLANE1 = "#23262c";
const PLANE2 = "#2c3038";
const PLANE3 = "#343943";
const BOXLINE = "#3a3f47";
const LABEL = "#6b6f76";
const DAWN = "#e8dcc4";
const PARCH = "#efeadf";
const CARD_INK = "#141927";
const GOLD = "#ab8434";
const TEAL = "#0d6f64";
const INKBRAND = "#141927";

/* ── Shared defs (mounted once by BrandFilm inside the <svg>) ───────────── */

export function FilmDefs() {
  return (
    <defs>
      <linearGradient id="filmBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#131518" />
        <stop offset="1" stopColor="#1c1f24" />
      </linearGradient>
      <linearGradient id="filmSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={TEAL} stopOpacity="0" />
        <stop offset="0.5" stopColor={TEAL} stopOpacity="0.08" />
        <stop offset="1" stopColor={TEAL} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="filmDawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={DAWN} stopOpacity="0.9" />
        <stop offset="1" stopColor={DAWN} stopOpacity="0.15" />
      </linearGradient>
    </defs>
  );
}

/* ── Primitives ─────────────────────────────────────────────────────────── */

type Pose = "standing" | "walking" | "seated" | "leaning";

const TORSO: Record<Pose, { d: string; hy: number; hr: number; lean: number }> = {
  standing: { d: "M-22 0 C-23 -68 -16 -106 0 -111 C16 -106 23 -68 22 0 Z", hy: -126, hr: 14, lean: 0 },
  walking: { d: "M-26 0 C-20 -66 -16 -104 0 -110 C16 -104 20 -66 26 0 Z", hy: -125, hr: 14, lean: 2 },
  seated: { d: "M-20 0 C-22 -44 -13 -70 0 -74 C13 -70 22 -44 20 0 Z", hy: -89, hr: 13, lean: 0 },
  leaning: { d: "M-22 0 C-23 -68 -16 -106 0 -111 C16 -106 23 -68 22 0 Z", hy: -126, hr: 14, lean: -9 },
};

/** Elegant silhouette: head circle + smooth torso path, faint stone rim-light. */
export function Figure({
  x,
  y,
  s = 1,
  pose = "standing",
  opacity = 1,
  t = 0,
  turn = 0,
  flip = false,
}: {
  x: number;
  y: number;
  s?: number;
  pose?: Pose;
  opacity?: number;
  t?: number;
  turn?: number;
  flip?: boolean;
}) {
  if (opacity <= 0) return null;
  const b = TORSO[pose];
  const breathe = 1 + Math.sin(t * 0.9 + x * 0.013) * 0.004;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s * breathe}) rotate(${b.lean})`}
      opacity={opacity}
    >
      <path d={b.d} fill={FIG} stroke={RIM} strokeOpacity={0.25} strokeWidth={1} />
      <circle cx={turn * 5} cy={b.hy} r={b.hr} fill={FIG} stroke={RIM} strokeOpacity={0.25} strokeWidth={1} />
    </g>
  );
}

/** A data thread: a quiet body line that draws on, plus a flowing dash layer. */
export function Thread({
  d,
  t,
  risk = false,
  color,
  opacity = 1,
  width = 1.6,
  flow = 1,
  draw = 1,
  phase,
}: {
  d: string;
  t: number;
  risk?: boolean;
  color?: string;
  opacity?: number;
  width?: number;
  flow?: number;
  draw?: number;
  /** Explicit dash phase (time-like). Use when flow DECAYS over time, so the
      offset stays monotonic instead of reversing (offset = ∫flow, not t·flow). */
  phase?: number;
}) {
  if (opacity <= 0 || draw <= 0) return null;
  const stroke = color ?? (risk ? RISK : SAFE);
  const dw = clamp01(draw);
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={opacity * 0.42}
        pathLength={1}
        strokeDasharray={`${Math.max(dw, 0.001)} 1`}
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={opacity * 0.9 * clamp01((dw - 0.7) / 0.3)}
        strokeDasharray="2 14"
        strokeDashoffset={-(phase ?? t * flow) * 26}
      />
    </g>
  );
}

/** A quiet system: rounded-rect outline + tiny mono label. Never an icon. */
export function SystemBox({
  x,
  y,
  w,
  h,
  label,
  opacity = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  opacity?: number;
}) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke={BOXLINE} strokeWidth={1} />
      <text
        x={x + 12}
        y={y + 22}
        fontSize={11}
        fill={LABEL}
        fontFamily={MONO}
        letterSpacing="0.08em"
      >
        {label}
      </text>
    </g>
  );
}

/** Diegetic parchment glimpse card, floating at slight perspective. */
export function GlimpseCard({
  x,
  y,
  w,
  title,
  code,
  rail = "teal",
  opacity = 1,
  rise = 0,
  check = 0,
  extra,
  extraOpacity = 0,
  dx = 0,
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  code?: string;
  rail?: "gold" | "teal";
  opacity?: number;
  rise?: number;
  check?: number;
  extra?: string;
  extraOpacity?: number;
  dx?: number;
}) {
  if (opacity <= 0) return null;
  const h = 40 + (extra ? extraOpacity * 20 : 0);
  const railColor = rail === "gold" ? GOLD : TEAL;
  return (
    <g transform={`translate(${x + dx} ${y + rise}) skewY(-2) scale(0.9)`} opacity={opacity}>
      <rect width={w} height={h} rx={5} fill={PARCH} stroke="#d8d1bd" strokeWidth={0.6} />
      <rect x={1} y={1} width={3} height={h - 2} rx={1.5} fill={railColor} />
      {check > 0 ? <rect x={1} y={1} width={3} height={(h - 2) * clamp01(check)} rx={1.5} fill={TEAL} /> : null}
      <text x={18} y={25} fontSize={12.5} fill={CARD_INK}>
        {title}
        {code ? (
          <tspan fontFamily={MONO} fontSize={11.5} fill="#494e5b">
            {"  ·  "}
            {code}
          </tspan>
        ) : null}
      </text>
      {extra && extraOpacity > 0 ? (
        <text x={18} y={45} fontSize={11.5} fill="#494e5b" opacity={extraOpacity} fontFamily={MONO}>
          {extra}
        </text>
      ) : null}
    </g>
  );
}

/* ── The office set (scenes 1, 2, 4, 7) ─────────────────────────────────── */

function Desk({ x, monitor = false }: { x: number; monitor?: boolean }) {
  return (
    <g>
      <rect x={x} y={590} width={170} height={10} fill={PLANE2} />
      <rect x={x + 10} y={600} width={6} height={100} fill={PLANE1} />
      <rect x={x + 154} y={600} width={6} height={100} fill={PLANE1} />
      {monitor ? (
        <rect x={x + 52} y={540} width={72} height={48} rx={3} fill={PLANE1} stroke={PLANE3} strokeWidth={1} />
      ) : null}
    </g>
  );
}

/** The charcoal office elevation: reception slab, desks, tall windows right. */
function Office({
  t,
  light = 0,
  dot1 = 0,
  dot2 = 0,
  children,
}: {
  t: number;
  light?: number;
  dot1?: number;
  dot2?: number;
  children?: ReactNode;
}) {
  return (
    <g>
      {/* back wall + architectural planes */}
      <rect x={40} y={150} width={1520} height={550} fill={PLANE1} />
      <rect x={120} y={150} width={1360} height={16} fill={PLANE2} />
      <rect x={700} y={166} width={24} height={534} fill={PLANE2} />
      {/* floor */}
      <rect x={0} y={700} width={1600} height={200} fill="#1c1f24" />
      <line x1={0} y1={700} x2={1600} y2={700} stroke={PLANE3} strokeWidth={1} />
      {/* tall windows, right */}
      {[1200, 1352].map((wx) => (
        <g key={wx}>
          <rect x={wx} y={210} width={120} height={430} fill="#181b20" stroke={PLANE3} strokeWidth={1.5} />
          <line x1={wx} y1={425} x2={wx + 120} y2={425} stroke={PLANE3} strokeWidth={1} />
          <line x1={wx + 60} y1={210} x2={wx + 60} y2={640} stroke={PLANE3} strokeWidth={1} />
        </g>
      ))}
      {/* dawn window light */}
      {light > 0 ? (
        <g>
          <rect x={1196} y={206} width={280} height={438} fill={DAWN} opacity={light * 0.35} />
          <polygon points="1200,640 1476,640 1330,838 1010,838" fill="url(#filmDawn)" opacity={light} />
        </g>
      ) : null}
      {/* ceiling light dots */}
      <circle cx={450} cy={174} r={3.5} fill={DAWN} opacity={dot1} />
      <circle cx={850} cy={174} r={3.5} fill={DAWN} opacity={dot2} />
      {/* reception slab */}
      <rect x={120} y={560} width={170} height={140} fill={PLANE2} />
      <rect x={116} y={556} width={178} height={6} fill={PLANE3} />
      {/* three desks */}
      <Desk x={380} />
      <Desk x={640} monitor />
      <Desk x={900} />
      {children}
      {/* faint breathing of the room light (kept subliminal) */}
      <rect x={0} y={0} width={1600} height={900} fill={DAWN} opacity={0.006 + 0.004 * Math.sin(t * 0.4)} />
    </g>
  );
}

/* ── The invisible network (scenes 3, 4-overlay) ────────────────────────── */

const BOXES = [
  { x: 200, y: 280, w: 190, h: 92, label: "HR DRIVE" },
  { x: 520, y: 170, w: 190, h: 92, label: "PAYROLL" },
  { x: 610, y: 430, w: 200, h: 96, label: "SHARED" },
  { x: 330, y: 620, w: 180, h: 88, label: "MAIL" },
  { x: 950, y: 300, w: 200, h: 96, label: "CLOUD" },
  { x: 1430, y: 470, w: 230, h: 100, label: "VENDOR" },
];

const NET = [
  "M390 326 C460 300, 500 240, 520 216",
  "M390 340 C480 380, 540 420, 610 452",
  "M710 262 C740 320, 760 370, 800 430",
  "M710 216 C790 200, 860 240, 950 310",
  "M810 470 C860 420, 900 380, 950 348",
  "M510 664 C580 630, 620 560, 660 526",
  "M510 680 C700 700, 880 560, 950 390",
  "M1150 330 C1240 330, 1330 400, 1430 480",
  "M810 500 C1020 560, 1240 540, 1430 520",
  "M390 300 C560 230, 760 260, 950 320",
  "M330 660 C240 600, 220 470, 250 372",
  "M710 240 C820 320, 900 460, 810 486",
  "M1150 370 C1230 430, 1300 480, 1360 500",
  "M520 240 C420 260, 360 280, 300 280",
];

function spiralPath(cx: number, cy: number, turns: number, r0: number, r1: number): string {
  const steps = 56;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * turns * Math.PI * 2 - Math.PI / 2;
    const r = r0 + (r1 - r0) * (i / steps);
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d;
}

const COIL = spiralPath(846, 120, 2.5, 26, 4);

const FAN = [0, 1, 2, 3, 4].map((i) => {
  const a = (-64 + i * 23) * (Math.PI / 180);
  const ex = 1052 + Math.cos(a) * 92;
  const ey = 322 + Math.sin(a) * 92;
  const mx = 1052 + Math.cos(a) * 46;
  const my = 322 + Math.sin(a) * 46 - 6;
  return `M1052 322 Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
});

/**
 * The deep-space network. lt drives the S3 choreography (draw-on at 1–4s,
 * risk beats from 3s); pass lt >= 11 for the fully-formed tangle (scene 4).
 */
function Network({
  lt,
  t,
  flowScale = 1,
  showBoxes = true,
  borderLine = true,
  phase,
}: {
  lt: number;
  t: number;
  flowScale?: number;
  showBoxes?: boolean;
  borderLine?: boolean;
  /** Whole-net dash phase override (scene 4 slows the entire tangle). */
  phase?: number;
}) {
  // The coil decelerates 1→0 over lt 5.2–6.4: phase = ∫flow dt (monotonic).
  const cy = Math.min(Math.max(lt - 5.2, 0), 1.2);
  const coilPhase = phase ?? (Math.min(lt, 5.2) + cy - (cy * cy) / 2.4) * flowScale;
  const coilOpacity = mix(0.5, 0.25, seg(lt, 5.6, 6.8));
  return (
    <g>
      {borderLine ? (
        <line
          x1={1360}
          y1={120}
          x2={1360}
          y2={780}
          stroke={BOXLINE}
          strokeWidth={1}
          strokeDasharray="4 10"
          opacity={0.35 * seg(lt, 0.8, 2)}
        />
      ) : null}
      {showBoxes
        ? BOXES.map((b, i) => (
            <SystemBox key={b.label} {...b} opacity={seg(lt, 0.5 + i * 0.25, 1.5 + i * 0.25)} />
          ))
        : null}
      {/* the safe web */}
      {NET.map((d, i) => (
        <Thread
          key={i}
          d={d}
          t={t}
          opacity={0.5}
          width={1.4}
          flow={flowScale} phase={phase}
          draw={easeOut(seg(lt, 1 + i * 0.18, 2.3 + i * 0.18))}
        />
      ))}

      {/* 19s — exposure: a thread out of HR DRIVE escapes through a gap in SHARED */}
      <line x1={810} y1={455} x2={810} y2={483} stroke="#171a1f" strokeWidth={4} opacity={seg(lt, 2.6, 3)} />
      <Thread
        d="M390 336 C520 400, 560 470, 690 470 L812 468"
        t={t}
        risk
        opacity={0.5}
        flow={flowScale} phase={phase}
        draw={easeOut(seg(lt, 3, 4.2))}
      />
      {[
        "M812 468 C850 462, 880 450, 905 434",
        "M812 468 C852 470, 886 472, 912 478",
        "M812 468 C848 480, 878 496, 900 514",
      ].map((d, i) => (
        <Thread key={d} d={d} t={t} risk opacity={0.5} width={1.2} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 3.8 + i * 0.12, 4.8 + i * 0.12))} />
      ))}

      {/* 21s — staleness: the PAYROLL coil stops flowing and dims */}
      <Thread d="M640 170 C680 150, 760 130, 818 120" t={t} risk opacity={coilOpacity} width={1.3} phase={coilPhase} draw={easeOut(seg(lt, 4.6, 5.4))} />
      <Thread d={COIL} t={t} risk opacity={coilOpacity} width={1.3} phase={coilPhase} draw={seg(lt, 4.9, 6.2)} />

      {/* 22.5s — duplication: five ghost-doubled strands fan out of CLOUD */}
      {FAN.map((d, i) => (
        <g key={d}>
          <Thread d={d} t={t} risk opacity={0.45} width={1.2} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 6.5 + i * 0.1, 7.4 + i * 0.1))} />
          <g transform="translate(4 -4)">
            <Thread d={d} t={t} risk opacity={0.3 * 0.45} width={1.2} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 6.6 + i * 0.1, 7.5 + i * 0.1))} />
          </g>
        </g>
      ))}

      {/* 24s — distance: one thread crosses the border line and leaves frame */}
      <Thread d="M1150 350 C1250 320, 1420 330, 1680 352" t={t} risk opacity={0.5} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 8, 9.2))} />

      {/* 25.5s — missing agreement: the VENDOR thread has a gap in its middle */}
      <Thread d="M810 510 C950 542, 1080 540, 1180 532" t={t} risk opacity={0.5} width={1.4} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 9.5, 10.4))} />
      <Thread d="M1280 524 C1340 520, 1390 512, 1432 506" t={t} risk opacity={0.5} width={1.4} flow={flowScale} phase={phase} draw={easeOut(seg(lt, 9.9, 10.6))} />
    </g>
  );
}

/* ── Scene 1 · 0–7 · A normal beginning ─────────────────────────────────── */

function Scene1({ p, t }: SceneProps) {
  const lt = p * 7;
  const light = 0.32 * easeOut(seg(lt, 0.4, 4.5));
  const recIn = easeOut(seg(lt, 0.8, 2));
  const walkIn = easeInOut(seg(lt, 1.5, 5.2));
  const cupIn = seg(lt, 4.8, 5.6);
  return (
    <Office t={t} light={light} dot1={lt >= 1.2 ? 0.9 : 0} dot2={lt >= 2.1 ? 0.9 : 0}>
      <Figure x={205 - 14 * (1 - recIn)} y={648} pose="seated" opacity={recIn} t={t} s={0.95} />
      <Figure x={mix(-80, 260, walkIn)} y={700} pose="walking" opacity={seg(lt, 1.3, 2.2)} t={t} />
      {/* a cup placed at a desk, with a three-particle steam wisp */}
      <g opacity={cupIn}>
        <rect x={468} y={576} width={13} height={14} rx={2} fill={PLANE3} />
        {[0, 1, 2].map((i) => {
          const cy = ((t * 13 + i * 13) % 38);
          return (
            <circle
              key={i}
              cx={474.5 + Math.sin(t * 1.7 + i * 2.1) * 3}
              cy={572 - cy}
              r={1.5}
              fill={RIM}
              opacity={0.22 * (1 - cy / 38)}
            />
          );
        })}
      </g>
    </Office>
  );
}

/* ── Scene 2 · 7–16 · Ordinary actions ──────────────────────────────────── */

function Scene2({ p, t }: SceneProps) {
  const lt = p * 9;
  const camX = -350 * easeInOut(seg(lt, 0, 8.5));
  const cvIn = easeInOut(seg(lt, 0.3, 1.3));
  const gridIn = seg(lt, 2.8, 3.8);
  const dupOut = easeOut(seg(lt, 5.4, 6.6));
  const threadOpacity = mix(0.18, 0.4, seg(lt, 1, 8.6));
  return (
    <g transform={`translate(${camX} 0)`}>
      <Office t={t} light={0.3} dot1={0.9} dot2={0.9}>
        {/* extend the room rightward for the camera glide */}
        <rect x={1560} y={150} width={440} height={550} fill={PLANE1} />
        <rect x={1560} y={700} width={440} height={200} fill="#1c1f24" />
        <line x1={1560} y1={700} x2={2000} y2={700} stroke={PLANE3} strokeWidth={1} />
        <Desk x={1250} monitor />
        <Desk x={1520} />

        {/* (a) 7.5s — a CV slides into a slot across a desk */}
        <Figure x={1035} y={700} pose="standing" flip t={t} />
        <Figure x={930} y={662} pose="seated" t={t} s={0.95} />
        <rect x={953} y={584} width={7} height={18} rx={2} fill="#16181d" />
        <g transform={`translate(${mix(1030, 958, cvIn)} 566) rotate(${mix(-7, 0, cvIn)})`} opacity={seg(lt, 0.1, 0.5)}>
          <rect width={30} height={40} rx={2} fill={PLANE1} stroke={LABEL} strokeWidth={0.8} />
          <line x1={6} y1={10} x2={24} y2={10} stroke={LABEL} strokeWidth={1} opacity={0.7} />
          <line x1={6} y1={17} x2={24} y2={17} stroke={LABEL} strokeWidth={1} opacity={0.5} />
          <line x1={6} y1={24} x2={20} y2={24} stroke={LABEL} strokeWidth={1} opacity={0.5} />
        </g>
        <Thread d="M958 586 C1010 480, 1130 428, 1290 468 S1560 520, 1730 458" t={t} opacity={threadOpacity} width={1.2} draw={easeOut(seg(lt, 0.6, 3))} />

        {/* (b) 10s — a payroll sheet: a faint 5×3 grid on a monitor slab */}
        <Figure x={1275} y={662} pose="seated" t={t} s={0.95} />
        <g opacity={gridIn * 0.55} stroke={LABEL} strokeWidth={0.7}>
          {[1, 2, 3, 4].map((i) => (
            <line key={`v${i}`} x1={1302 + i * 14.4} y1={546} x2={1302 + i * 14.4} y2={582} />
          ))}
          {[1, 2].map((i) => (
            <line key={`h${i}`} x1={1302} y1={546 + i * 12} x2={1374} y2={546 + i * 12} />
          ))}
        </g>
        <Thread d="M1340 563 C1380 642, 1500 700, 1650 688 S1852 636, 1965 660" t={t} opacity={threadOpacity} width={1.2} draw={easeOut(seg(lt, 3.1, 5.2))} />

        {/* (c) 12.5s — a share: the document duplicates and the copy drifts away */}
        <Figure x={1545} y={700} pose="leaning" t={t} />
        <rect x={1560} y={556} width={32} height={42} rx={2} fill={PLANE1} stroke={LABEL} strokeWidth={0.8} opacity={seg(lt, 4.6, 5.2)} />
        <g transform={`translate(${1560 + 74 * dupOut} ${556 - 20 * dupOut})`} opacity={seg(lt, 5.3, 5.7) * (1 - seg(lt, 6.3, 7)) * 0.35}>
          <rect width={32} height={42} rx={2} fill="none" stroke={LABEL} strokeWidth={0.8} />
        </g>
        <Thread d="M1640 566 C1700 516, 1790 498, 1900 518 S1980 540, 2000 536" t={t} opacity={threadOpacity} width={1.2} draw={easeOut(seg(lt, 5.9, 8.2))} />
      </Office>
    </g>
  );
}

/* ── Scene 3 · 16–27 · The invisible system ─────────────────────────────── */

function Scene3({ p, t }: SceneProps) {
  const lt = p * 11;
  const recede = easeInOut(seg(lt, 0, 1.8));
  const sc = mix(1, 0.92, recede);
  return (
    <g>
      <g
        transform={`translate(${800 * (1 - sc)} ${450 * (1 - sc)}) scale(${sc})`}
        opacity={mix(1, 0.12, recede)}
      >
        <Office t={t} light={0.3} dot1={0.9} dot2={0.9} />
      </g>
      <Network lt={lt} t={t} flowScale={1} />
    </g>
  );
}

/* ── Scene 4 · 27–34 · No one notices ───────────────────────────────────── */

function Scene4({ p, t }: SceneProps) {
  const lt = p * 7;
  // All thread flow slows to near-stop: dash phase = ∫flow dt, with flow
  // easing 0.5→0.03 over the first 3s (monotonic — never reverses).
  const x = Math.min(lt, 3);
  const netPhase = 0.5 * x - (0.47 / 6) * x * x + 0.03 * Math.max(lt - 3, 0);
  const shuffle1 = Math.sin(Math.PI * seg(lt, 2, 2.6));
  const shuffle2 = Math.sin(Math.PI * seg(lt, 4, 4.6));
  const papers: Array<[number, number, number, number]> = [
    // x, y, base rotation, which shuffle beat moves it
    [612, 574, -8, 1],
    [660, 578, 5, 2],
    [706, 572, -3, 1],
    [752, 577, 10, 2],
  ];
  return (
    <g>
      <g opacity={0.6}>
        <Office t={t} light={0.26} dot1={0.9} dot2={0.9}>
          {papers.map(([x, y, r, beat], i) => (
            <g
              key={i}
              transform={`translate(${x} ${y}) rotate(${r + (beat === 1 ? shuffle1 : shuffle2) * 7})`}
            >
              <rect x={-15} y={-10} width={30} height={20} rx={1.5} fill={PLANE1} stroke="#4a4f57" strokeWidth={0.8} />
            </g>
          ))}
          <Figure x={700} y={668} pose="seated" t={t} turn={Math.sin(lt * 0.7) * 0.9} />
        </Office>
      </g>
      {/* the tangle hangs in the room air — the people cannot see it */}
      <g opacity={0.12}>
        <Network lt={11} t={t} phase={netPhase} showBoxes={false} borderLine={false} />
      </g>
    </g>
  );
}

/* ── Lanes machinery (scenes 5, 6) ──────────────────────────────────────── */

const LANE_Y = [300, 370, 440, 510, 580];

/** Two-segment cubic through 14 numbers: M(0,1) C(2..7) C(8..13). */
function cubicPath(pts: number[]): string {
  return (
    `M${pts[0].toFixed(1)} ${pts[1].toFixed(1)}` +
    ` C${pts[2].toFixed(1)} ${pts[3].toFixed(1)}, ${pts[4].toFixed(1)} ${pts[5].toFixed(1)}, ${pts[6].toFixed(1)} ${pts[7].toFixed(1)}` +
    ` C${pts[8].toFixed(1)} ${pts[9].toFixed(1)}, ${pts[10].toFixed(1)} ${pts[11].toFixed(1)}, ${pts[12].toFixed(1)} ${pts[13].toFixed(1)}`
  );
}

const TANGLED: number[][] = [
  [200, 340, 380, 220, 560, 460, 780, 300, 980, 180, 1180, 420, 1420, 330],
  [200, 420, 420, 540, 600, 260, 830, 420, 1040, 560, 1240, 300, 1420, 400],
  [200, 480, 400, 360, 620, 600, 820, 470, 1020, 340, 1240, 560, 1420, 470],
  [200, 560, 430, 640, 640, 420, 840, 580, 1060, 660, 1250, 460, 1420, 540],
  [200, 620, 410, 500, 650, 700, 850, 560, 1050, 700, 1260, 620, 1420, 600],
];

/** Interpolate a lane between its tangled and combed (ordered) shape. */
function lanePath(i: number, k: number, wave = 0): string {
  const y = LANE_Y[i];
  const tangled = TANGLED[i];
  const pts = tangled.map((v, j) => {
    const ordered = j % 2 === 0 ? mix(200, 1420, j / 12) : y;
    let o = mix(v, ordered, k);
    if (wave > 0 && j % 2 === 1 && j > 1 && j < 13) o += Math.sin(j * 2.1) * 6 * wave;
    return o;
  });
  return cubicPath(pts);
}

type CardSpec = {
  x: number;
  y: number;
  w: number;
  title: string;
  code?: string;
  rail: "gold" | "teal";
};

const CARDS: CardSpec[] = [
  { x: 240, y: 240, w: 210, title: "Nile Digital Services", rail: "gold" },
  { x: 500, y: 310, w: 235, title: "18 data sources reviewed", rail: "teal" },
  { x: 780, y: 462, w: 305, title: "Public sharing detected", code: "MON-ACCESS-001", rail: "gold" },
  { x: 1020, y: 532, w: 315, title: "Automated finding requiring human review.", rail: "teal" },
  { x: 560, y: 602, w: 280, title: "EG-PDPL control mapped", code: "EG-SEC-03", rail: "teal" },
];

/* ── Scene 5 · 34–44 · Iltizam enters ───────────────────────────────────── */

function Scene5({ p, t }: SceneProps) {
  const lt = p * 10;
  const sweepX = mix(-180, 1780, easeInOut(seg(lt, 0, 3)));
  const sweepOp = seg(lt, 0, 0.4) * (1 - seg(lt, 3.1, 3.7));
  const ks = LANE_Y.map((_, i) => easeInOut(seg(sweepX, 260 + i * 50, 980 + i * 50)));
  return (
    <g>
      {/* systems settle into the background */}
      <g opacity={mix(0.28, 0.1, seg(lt, 0, 3))}>
        {BOXES.map((b) => (
          <SystemBox key={b.label} {...b} opacity={1} />
        ))}
      </g>
      {/* the lanes comb as the light passes */}
      {LANE_Y.map((y, i) => (
        <Thread
          key={y}
          d={lanePath(i, ks[i])}
          t={t}
          risk={i === 2}
          opacity={i === 2 ? 0.55 : mix(0.35, 0.6, ks[i])}
          flow={mix(0.25, 1, ks[i])}
          width={1.5}
        />
      ))}
      {/* the frayed amber end gathers into a single contained strand */}
      <g opacity={1 - ks[2]}>
        {[
          "M1420 470 C1450 456, 1476 444, 1500 428",
          "M1420 470 C1452 470, 1482 472, 1508 476",
          "M1420 470 C1448 484, 1474 498, 1496 514",
        ].map((d) => (
          <Thread key={d} d={d} t={t} risk opacity={0.5} width={1.2} flow={0.3} />
        ))}
      </g>
      <rect
        x={1180}
        y={LANE_Y[2] - 13}
        width={150}
        height={26}
        rx={9}
        fill="none"
        stroke={BOXLINE}
        strokeWidth={1}
        opacity={ks[2] * 0.8}
      />
      {/* the calm teal light */}
      <rect x={sweepX - 130} y={60} width={260} height={780} fill="url(#filmSweep)" opacity={sweepOp} />
      {/* glimpse cards, 1.2s apart */}
      {CARDS.map((c, i) => {
        const o = seg(lt, 3.5 + i * 1.2, 4.1 + i * 1.2);
        return <GlimpseCard key={c.title} {...c} opacity={o} rise={(1 - easeOut(o)) * 8} />;
      })}
    </g>
  );
}

/* ── Scene 6 · 44–52 · Humans stay in control ───────────────────────────── */

function Scene6({ p, t }: SceneProps) {
  const lt = p * 8;
  const q = easeInOut(seg(lt, 3, 3.8)); // 47s — confirm: snap straight + recolor
  const cursorP = easeInOut(seg(lt, 0.5, 1.6));
  const press = Math.sin(Math.PI * seg(lt, 2.9, 3.3));
  const dismissP = easeInOut(seg(lt, 4.5, 5.4));
  const ownerIn = seg(lt, 5.5, 6.1);
  const finding = CARDS[2];
  const cx = mix(420, finding.x + 34, cursorP);
  const cy = mix(720, finding.y + 50, cursorP);
  return (
    <g>
      {/* ambient brightness rises ~5% */}
      <rect x={0} y={0} width={1600} height={900} fill={DAWN} opacity={0.05 * seg(lt, 3, 6)} />
      {LANE_Y.map((y, i) =>
        i === 2 ? null : <Thread key={y} d={lanePath(i, 1)} t={t} opacity={0.55} flow={1} width={1.5} />,
      )}
      {/* the amber lane, held contained — then confirmed */}
      <Thread d={lanePath(2, 1, 1 - q)} t={t} color={RISK} opacity={0.6 * (1 - q)} flow={0.5} width={1.5} />
      <Thread d={lanePath(2, 1, 1 - q)} t={t} color={SAFE} opacity={0.6 * q} flow={1} width={1.5} />
      <rect
        x={1180}
        y={LANE_Y[2] - 13}
        width={150}
        height={26}
        rx={9}
        fill="none"
        stroke={BOXLINE}
        strokeWidth={1}
        opacity={0.8 - 0.55 * q}
      />
      <GlimpseCard {...finding} opacity={1} check={seg(lt, 3, 3.6)} />
      <GlimpseCard {...CARDS[1]} opacity={1 - dismissP} dx={90 * dismissP} />
      <GlimpseCard {...CARDS[4]} opacity={1} extra="Owner assigned — Omar Fathy" extraOpacity={ownerIn} />
      {/* the reviewer, facing the lane space */}
      <Figure x={170} y={770} pose="standing" t={t} s={1.1} turn={0.7} />
      {/* a small cursor dot — the decision is a human hand */}
      <circle cx={cx} cy={cy} r={4 + press * 2.5} fill="#d9d5cb" opacity={0.9 * seg(lt, 0.3, 0.6)} />
    </g>
  );
}

/* ── Scene 7 · 52–60 · Return to trust ──────────────────────────────────── */

function Scene7({ p, t }: SceneProps) {
  const lt = p * 8;
  const light = mix(0.3, 0.44, easeOut(seg(lt, 0, 3)));
  const hand = easeInOut(seg(lt, 0.8, 1.8));
  const darken = seg(lt, 3.6, 4.4);
  const grow = easeInOut(seg(lt, 4.2, 5.2));
  const wmIn = seg(lt, 4.9, 5.7);
  const tag1 = seg(lt, 5.5, 6.1);
  const tag2 = seg(lt, 5.8, 6.4);
  const sec = seg(lt, 6.5, 7.1);
  // the window becomes the frame — match cut
  const fx = mix(1196, 0, grow);
  const fy = mix(206, 0, grow);
  const fw = mix(280, 1600, grow);
  const fh = mix(438, 900, grow);
  return (
    <g>
      <Office t={t} light={light} dot1={0.9} dot2={0.9}>
        {[
          "M-40 380 C400 340, 1150 366, 1640 336",
          "M-40 430 C420 396, 1180 420, 1640 392",
          "M-40 480 C430 452, 1200 476, 1640 450",
        ].map((d) => (
          <Thread key={d} d={d} t={t} opacity={0.2} width={1.4} flow={0.8} />
        ))}
        <Figure x={205} y={648} pose="seated" t={t} s={0.95} />
        <Figure x={430} y={700} pose="standing" t={t} />
        <Figure x={585} y={700} pose="standing" flip t={t} />
        {/* a document passes between two people */}
        <g
          transform={`translate(${mix(452, 542, hand)} ${596 - 12 * Math.sin(Math.PI * hand)}) rotate(${mix(-4, 4, hand)})`}
          opacity={seg(lt, 0.5, 0.9)}
        >
          <rect width={26} height={34} rx={2} fill={PLANE1} stroke={LABEL} strokeWidth={0.8} />
        </g>
      </Office>
      <rect x={fx} y={fy} width={fw} height={fh} fill={INKBRAND} opacity={darken} />
      {wmIn > 0 ? (
        <g
          opacity={wmIn}
          transform={`translate(800 450) scale(${mix(0.97, 1, easeOut(wmIn))}) translate(-800 -450)`}
        >
          {/* the certificate-tile mark — gold lives only in this frame */}
          <g transform="translate(762 292) scale(1.9)">
            <rect x={0.75} y={0.75} width={38.5} height={38.5} rx={8} fill="#1f2636" stroke="#2e364a" strokeWidth={1} />
            <rect x={5.5} y={5.5} width={29} height={29} rx={4.5} fill="none" stroke={GOLD} strokeWidth={1} opacity={0.55} />
            <path d="M13 10.5 h14 v3.2 h-5.1 v12.6 H27 v3.2 H13 v-3.2 h5.1 V13.7 H13 Z" fill="#d3b464" />
          </g>
          <text
            x={808}
            y={452}
            textAnchor="middle"
            fontSize={44}
            fontFamily={SERIF}
            fontWeight={600}
            letterSpacing="0.22em"
            fill="#e8e2d6"
          >
            ILTZAM
          </text>
          <text x={800} y={534} textAnchor="middle" fontSize={26} fontFamily={SERIF} fill="#e8e2d6" opacity={tag1}>
            See what matters.
          </text>
          <text x={800} y={574} textAnchor="middle" fontSize={26} fontFamily={SERIF} fill="#e8e2d6" opacity={tag2}>
            Act with confidence.
          </text>
          <text x={800} y={628} textAnchor="middle" fontSize={13.5} fill="#a6abba" letterSpacing="0.04em" opacity={sec}>
            Automated data protection monitoring, built around human review.
          </text>
        </g>
      ) : null}
    </g>
  );
}

/* ── Export ─────────────────────────────────────────────────────────────── */

export const SCENES: Array<(props: SceneProps) => ReactElement> = [
  Scene1,
  Scene2,
  Scene3,
  Scene4,
  Scene5,
  Scene6,
  Scene7,
];
