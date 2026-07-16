"use client";

/**
 * Film engine — a single requestAnimationFrame master clock.
 *
 * Every scene is a pure function of time t (seconds), which makes the film
 * scrubbable and frame-testable: seek(t) renders exactly the frame at t.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Easing / timeline math ─────────────────────────────────────────────── */

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Local progress 0→1 of t inside [a, b]. */
export const seg = (t: number, a: number, b: number): number =>
  b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a));

export const easeInOut = (p: number): number => {
  const x = clamp01(p);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const easeOut = (p: number): number => 1 - Math.pow(1 - clamp01(p), 3);

export const mix = (a: number, b: number, p: number): number => a + (b - a) * p;

/** A caption cue on the film timeline. */
export type TimelineCue = { at: number; end: number; text: string };

/* ── Master clock ───────────────────────────────────────────────────────── */

export type FilmClock = {
  t: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  restart: () => void;
};

export function useFilmClock({
  duration,
  autoPlay = false,
}: {
  duration: number;
  autoPlay?: boolean;
}): FilmClock {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); // clamp long tab-away frames
      last = now;
      let next = tRef.current + dt;
      if (next >= duration) {
        next = duration;
        tRef.current = next;
        setT(next);
        setPlaying(false);
        return;
      }
      tRef.current = next;
      setT(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration]);

  const seek = useCallback(
    (next: number) => {
      const v = Math.min(Math.max(next, 0), duration);
      tRef.current = v;
      setT(v);
    },
    [duration],
  );

  const play = useCallback(() => {
    if (tRef.current >= duration) {
      tRef.current = 0;
      setT(0);
    }
    setPlaying(true);
  }, [duration]);

  const pause = useCallback(() => setPlaying(false), []);

  const restart = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setPlaying(true);
  }, []);

  return { t, playing, play, pause, seek, restart };
}
