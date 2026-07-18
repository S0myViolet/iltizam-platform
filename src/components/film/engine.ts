// ─────────────────────────────────────────────────────────────────────────────
// engine.ts — the film clock.
//
// One contract: EVERY FRAME IS A PURE FUNCTION OF TIME. Nothing here knows
// about scenes, cuts, captions or audio — it only advances a clock with
// requestAnimationFrame and hands the current second to React. Scenes receive
// (p, t) and must render deterministically from those numbers alone. That
// purity is what makes ?filmt=<seconds> review stills, cut re-timing, the
// poster frame and the reduced-motion freeze frame all come for free.
//
// The pure timing math lives in math.ts (scenes must also render on the
// server, so it cannot sit inside this client module). Do not add scene
// knowledge to this file.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── The clock ──────────────────────────────────────────────────────────── */

export interface FilmClock {
  /** Current playback time in seconds (0 … duration). */
  t: number;
  playing: boolean;
  ended: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (to: number) => void;
  restart: () => void;
}

export function useFilmClock(
  duration: number,
  opts?: { initialTime?: number; onEnd?: () => void },
): FilmClock {
  const initial = Math.min(Math.max(opts?.initialTime ?? 0, 0), duration);
  const [t, setT] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  const tRef = useRef(initial);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const playingRef = useRef(false);
  const onEndRef = useRef(opts?.onEnd);
  onEndRef.current = opts?.onEnd;

  const stopRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (!playingRef.current) return;
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;
      tRef.current = Math.min(duration, tRef.current + dt);
      setT(tRef.current);
      if (tRef.current >= duration) {
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        onEndRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [duration],
  );

  const play = useCallback(() => {
    if (playingRef.current) return;
    if (tRef.current >= duration) tRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    setEnded(false);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, tick]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopRaf();
  }, [stopRaf]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const seek = useCallback(
    (to: number) => {
      tRef.current = Math.min(Math.max(to, 0), duration);
      setT(tRef.current);
      setEnded(tRef.current >= duration);
    },
    [duration],
  );

  const restart = useCallback(() => {
    seek(0);
    play();
  }, [seek, play]);

  useEffect(() => stopRaf, [stopRaf]);

  return { t, playing, ended, play, pause, toggle, seek, restart };
}

/** A silent, endlessly wrapping clock for ambient loops (the hero loop). */
export function useLoopClock(duration: number, running = true): number {
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      setT(((now - startRef.current) / 1000) % duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, running]);
  return t;
}

/** True when the viewer asks for reduced motion; SSR-safe (false on server). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
