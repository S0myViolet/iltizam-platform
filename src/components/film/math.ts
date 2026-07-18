// ─────────────────────────────────────────────────────────────────────────────
// math.ts — pure timing math shared by every scene.
//
// Deliberately NOT a client module: scenes are pure functions of (p, t) and
// must render on the server too (the poster, the reduced-motion still). The
// rAF clock lives in engine.ts; only these helpers are shared.
// ─────────────────────────────────────────────────────────────────────────────

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export const mix = (a: number, b: number, x: number): number => a + (b - a) * x;

/** Normalized progress of t through [a, b]: 0 before, 1 after, linear inside. */
export const sub = (t: number, a: number, b: number): number =>
  clamp01((t - a) / (b - a));

export const easeInOut = (x: number): number => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

export const easeOut = (x: number): number => {
  const c = clamp01(x);
  return 1 - (1 - c) * (1 - c);
};

export const easeIn = (x: number): number => {
  const c = clamp01(x);
  return c * c;
};

/** 1 inside [a, b] with soft edges of width e — an opacity envelope. */
export const envelope = (t: number, a: number, b: number, e = 0.3): number =>
  Math.min(sub(t, a, a + e), 1 - sub(t, b - e, b));
