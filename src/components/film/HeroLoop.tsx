"use client";

// HeroLoop — a silent, self-contained 10-second looping vignette in the
// "What You Don't See" visual language. Deliberately independent of the film
// engine: one tiny rAF clock, every property a pure function of t (seconds),
// transform/opacity/dashoffset only. Freezes on the ordered-lanes frame
// (t = 5.5s) for prefers-reduced-motion or a hidden document, and pauses the
// clock entirely while offscreen.

import { useEffect, useRef } from "react";

/* ── timing helpers ─────────────────────────────────────────────────────── */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const LOOP = 10; // seconds
const FREEZE_T = 5.5; // ordered-lanes poster frame

/* ── thread geometry ────────────────────────────────────────────────────────
   Each thread is M + two cubics → 14 numbers. `from` is the scattered morning
   state; `to` is its ordered lane. Threads 1 & 5 merge into the top lane,
   2 & 4 into the middle, 3 into the low lane. */
type Pts = number[];
const d14 = (n: Pts) =>
  `M ${n[0]} ${n[1]} C ${n[2]} ${n[3]} ${n[4]} ${n[5]} ${n[6]} ${n[7]} C ${n[8]} ${n[9]} ${n[10]} ${n[11]} ${n[12]} ${n[13]}`;
const lerpPts = (a: Pts, b: Pts, p: number) => a.map((v, i) => lerp(v, b[i], p));

const laneA: Pts = [480, 462, 700, 396, 920, 366, 1090, 362, 1250, 358, 1430, 358, 1590, 358];
const laneB: Pts = [480, 462, 700, 452, 920, 446, 1090, 444, 1250, 442, 1430, 442, 1590, 442];
const laneC: Pts = [480, 470, 700, 508, 920, 528, 1090, 530, 1250, 530, 1430, 528, 1590, 528];

const THREADS: { from: Pts; to: Pts; op: number; born: [number, number] }[] = [
  { from: [480, 462, 640, 428, 780, 356, 940, 338, 1120, 318, 1340, 300, 1590, 286], to: laneA, op: 0.6, born: [0.3, 1.4] },
  { from: [480, 452, 660, 474, 820, 522, 1000, 470, 1180, 420, 1370, 432, 1590, 392], to: laneB, op: 0.45, born: [2.0, 2.8] },
  { from: [480, 472, 620, 532, 800, 608, 980, 560, 1180, 506, 1390, 542, 1590, 506], to: laneC, op: 0.4, born: [2.3, 3.1] },
  { from: [480, 468, 640, 500, 760, 434, 920, 430, 1100, 428, 1330, 382, 1590, 352], to: laneB, op: 0.55, born: [2.6, 3.4] }, // frays amber
  { from: [480, 458, 700, 382, 860, 302, 1020, 330, 1200, 362, 1410, 302, 1590, 262], to: laneA, op: 0.35, born: [2.9, 3.7] },
];
const AMBER = 3; // index of the fraying thread

const FRAY: Pts[] = [
  [920, 430, 1030, 416, 1170, 366, 1310, 332, 1400, 310, 1500, 296, 1590, 288],
  [920, 430, 1030, 448, 1160, 478, 1300, 486, 1390, 490, 1500, 486, 1590, 480],
];

type Nodes = {
  th: (SVGPathElement | null)[];
  twin: SVGPathElement | null;
  fray: (SVGPathElement | null)[];
  sweep: SVGRectElement | null;
  doc: SVGGElement | null;
  card: SVGGElement | null;
  breath: SVGGElement | null;
  head: SVGGElement | null;
};

/* Everything below is a pure function of loop-time t ∈ [0, 10). */
function update(t: number, n: Nodes) {
  const flow = -(t * 32); // dash "2 14" → period 16; 320 per loop is seamless

  for (let i = 0; i < THREADS.length; i++) {
    const el = n.th[i];
    if (!el) continue;
    const th = THREADS[i];
    // comb into lanes (staggered, settled by the 5.5s freeze frame),
    // then release back for the loop seam
    const combIn = easeInOut(seg(t, 4 + i * 0.08, 5.3 + i * 0.08));
    const combOut = 1 - easeInOut(seg(t, 8.6, 9.9));
    const morph = combIn * combOut;
    el.setAttribute("d", d14(lerpPts(th.from, th.to, morph)));
    el.setAttribute("stroke-dashoffset", String(flow));
    const born = easeOut(seg(t, th.born[0], th.born[1]));
    const gone = 1 - easeInOut(seg(t, 8.55 + i * 0.06, 9.55 + i * 0.06));
    let o = th.op * born * gone;
    if (i === AMBER) o *= 1 - easeInOut(seg(t, 4.4, 5.3)); // amber yields to its teal twin
    el.setAttribute("stroke-opacity", o.toFixed(3));
  }

  // teal twin of the frayed thread — same geometry, opposite crossfade
  if (n.twin) {
    const th = THREADS[AMBER];
    const morph =
      easeInOut(seg(t, 4 + AMBER * 0.08, 5.3 + AMBER * 0.08)) * (1 - easeInOut(seg(t, 8.6, 9.9)));
    n.twin.setAttribute("d", d14(lerpPts(th.from, th.to, morph)));
    n.twin.setAttribute("stroke-dashoffset", String(flow));
    const o = 0.5 * easeInOut(seg(t, 4.4, 5.3)) * (1 - easeInOut(seg(t, 8.6, 9.6)));
    n.twin.setAttribute("stroke-opacity", o.toFixed(3));
  }

  // fraying strands: appear with the amber thread, combed away by the sweep
  for (let i = 0; i < FRAY.length; i++) {
    const el = n.fray[i];
    if (!el) continue;
    el.setAttribute("stroke-dashoffset", String(flow));
    const o = 0.42 * easeOut(seg(t, 2.7 + i * 0.2, 3.9)) * (1 - easeInOut(seg(t, 4.4, 5.3)));
    el.setAttribute("stroke-opacity", o.toFixed(3));
  }

  // the sweep that combs the threads — clear of the frame by the 5.5s freeze,
  // leaving 5.5–6.5 as a rest beat of ordered, flowing lanes
  if (n.sweep) {
    const p = easeInOut(seg(t, 4, 5.5));
    n.sweep.setAttribute("transform", `translate(${lerp(300, 1700, p)} 0)`);
    const o = 0.9 * seg(t, 4, 4.4) * (1 - seg(t, 5.1, 5.5));
    n.sweep.setAttribute("opacity", o.toFixed(3));
  }

  // document slides from the figure to the shared drive, then rests
  if (n.doc) {
    const x = lerp(700, 476, easeInOut(seg(t, 0.3, 1.9)));
    n.doc.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
    const o = easeOut(seg(t, 0.15, 0.55)) * (1 - easeInOut(seg(t, 8.6, 9.4)));
    n.doc.setAttribute("opacity", o.toFixed(3));
  }

  // parchment glimpse card: fade + 4px rise in, gentle fade out
  if (n.card) {
    const inP = easeOut(seg(t, 6.5, 7.2));
    const outP = 1 - easeInOut(seg(t, 8.5, 9.15));
    n.card.setAttribute("opacity", (inP * outP).toFixed(3));
    n.card.setAttribute("transform", `translate(1020 ${580 + (1 - inP) * 4}) scale(0.9) skewY(-2)`);
  }

  // idle life: breathing ±0.004 (3 cycles/loop), slow head turn (2 cycles/loop)
  if (n.breath) {
    const s = 1 + 0.004 * Math.sin((t / LOOP) * Math.PI * 6);
    n.breath.setAttribute("transform", `translate(760 612) scale(${s.toFixed(4)}) translate(-760 -612)`);
  }
  if (n.head) {
    const a = 1.6 * Math.sin((t / LOOP) * Math.PI * 4);
    n.head.setAttribute("transform", `rotate(${a.toFixed(2)} 760 512)`);
  }
}

export default function HeroLoop({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<Nodes>({
    th: [null, null, null, null, null],
    twin: null,
    fray: [null, null],
    sweep: null,
    doc: null,
    card: null,
    breath: null,
    head: null,
  });

  useEffect(() => {
    const n = nodes.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      update(FREEZE_T, n);
      return;
    }

    let raf = 0;
    let running = false;
    let inView = true;
    let tOffset = 0; // loop-time carried across pauses
    let startedAt = 0;

    const tick = (now: number) => {
      update(((now - startedAt) / 1000) % LOOP, n);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      startedAt = performance.now() - tOffset * 1000;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      tOffset = ((performance.now() - startedAt) / 1000) % LOOP;
      cancelAnimationFrame(raf);
    };

    const sync = () => {
      if (document.hidden) {
        stop();
        update(FREEZE_T, n);
        tOffset = FREEZE_T; // resume from the frozen frame
      } else if (inView) {
        start();
      } else {
        stop();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        sync();
      },
      { threshold: 0.05 },
    );
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      document.removeEventListener("visibilitychange", sync);
      io.disconnect();
      stop();
    };
  }, []);

  const n = nodes.current;
  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  return (
    <div ref={rootRef} className={className} aria-hidden="true">
      <svg viewBox="0 0 1600 900" className="block h-auto w-full" role="presentation" focusable="false">
        <defs>
          <linearGradient id="hl-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#131518" />
            <stop offset="1" stopColor="#1c1f24" />
          </linearGradient>
          <linearGradient id="hl-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6fa39c" stopOpacity="0" />
            <stop offset="0.5" stopColor="#6fa39c" stopOpacity="0.1" />
            <stop offset="1" stopColor="#6fa39c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* world */}
        <rect width="1600" height="900" fill="url(#hl-bg)" />
        <polygon points="0,90 250,150 250,760 0,850" fill="#e8dcc4" opacity="0.05" />
        <rect x="960" y="110" width="640" height="790" fill="#23262c" opacity="0.4" />
        <rect x="1240" width="360" height="900" fill="#2c3038" opacity="0.28" />

        {/* desk */}
        <rect x="150" y="600" width="770" height="24" rx="3" fill="#2c3038" />
        <rect x="150" y="624" width="770" height="10" fill="#131518" opacity="0.6" />

        {/* seated figure: head + shoulders, silhouette with faint stone rim */}
        <g ref={(el) => void (n.breath = el)}>
          <path
            d="M 690 612 C 692 546 714 514 760 508 C 806 514 828 546 830 612 Z"
            fill="#0e1013"
            stroke="#8d867a"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
          <g ref={(el) => void (n.head = el)}>
            <circle cx="760" cy="474" r="33" fill="#0e1013" stroke="#8d867a" strokeOpacity="0.25" strokeWidth="1" />
          </g>
        </g>

        {/* shared-drive system: a quiet rounded rect, never an icon */}
        <rect x="330" y="430" width="150" height="66" rx="10" fill="none" stroke="#3a3f47" strokeWidth="1" />
        <text
          x="405"
          y="518"
          textAnchor="middle"
          fill="#6b6f76"
          fontSize="15"
          letterSpacing="0.08em"
          fontFamily={mono}
        >
          SHARED
        </text>

        {/* the document being filed */}
        <g ref={(el) => void (n.doc = el)} opacity="0">
          <rect x="0" y="556" width="62" height="42" rx="4" fill="#343943" stroke="#8d867a" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="12" y1="570" x2="50" y2="570" stroke="#6b6f76" strokeWidth="1" opacity="0.6" />
          <line x1="12" y1="580" x2="44" y2="580" stroke="#6b6f76" strokeWidth="1" opacity="0.45" />
        </g>

        {/* data threads */}
        <g fill="none" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 14">
          {THREADS.map((th, i) => (
            <path
              key={i}
              ref={(el) => void (n.th[i] = el)}
              d={d14(th.from)}
              stroke={i === AMBER ? "#b0762a" : "#6fa39c"}
              strokeOpacity="0"
            />
          ))}
          <path ref={(el) => void (n.twin = el)} d={d14(THREADS[AMBER].from)} stroke="#6fa39c" strokeOpacity="0" />
          {FRAY.map((f, i) => (
            <path
              key={i}
              ref={(el) => void (n.fray[i] = el)}
              d={d14(f)}
              stroke="#b0762a"
              strokeWidth="1.2"
              strokeOpacity="0"
            />
          ))}
        </g>

        {/* the sweep that orders them */}
        <rect
          ref={(el) => void (n.sweep = el)}
          x="-90"
          y="210"
          width="180"
          height="500"
          fill="url(#hl-sweep)"
          opacity="0"
        />

        {/* parchment glimpse */}
        <g ref={(el) => void (n.card = el)} opacity="0" transform="translate(1020 584) scale(0.9) skewY(-2)">
          <rect width="510" height="112" rx="8" fill="#efeadf" />
          <rect width="3" height="112" rx="1.5" fill="#0d6f64" />
          <text x="26" y="40" fill="#5d6270" fontSize="14" letterSpacing="0.08em" fontFamily={mono}>
            Nile Digital Services
          </text>
          <text x="26" y="76" fill="#141927" fontSize="21" fontFamily='Georgia, "Times New Roman", serif'>
            Automated finding requiring human review.
          </text>
        </g>
      </svg>
    </div>
  );
}
