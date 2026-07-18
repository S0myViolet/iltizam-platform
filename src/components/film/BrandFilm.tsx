// ─────────────────────────────────────────────────────────────────────────────
// BrandFilm.tsx — the player for "From Exposure to Control".
//
// The shell owns: the poster, the rAF clock (engine.ts), the CUT WINDOW
// TABLES that map playback time → master time (the film is one continuous
// world; a cut is a set of master-time windows), the narration captions
// (the recorded VO's transcript ships as synchronized lower-third captions —
// this doubles as the captioned + sound-off version), the audio, controls, the
// reduced-motion fallback, the 16:9 / 9:16 orientation switch, and the
// ?filmt=<seconds> review hook (passed in as initialTime by the /film page)
// that renders any master-cut frame as a paused still.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilmClock, useReducedMotion } from "./engine";
import { clamp01, mix } from "./math";
import {
  FilmDefs,
  FilmPoster,
  FilmStage,
  LAYOUTS,
  type Orientation,
} from "./scenes";
import { AUDIO_TIMELINES, FilmAudio, type AudioTimeline } from "./audio";

/* ── THE NARRATION — the recorded voiceover, word for word ──────────────── */
// The single timing table lives in narration.ts (plain data, shared with the
// scenes, the frame surface and the export pipeline); re-exported here for
// the pages that historically import it from BrandFilm.
export { NARRATION } from "./narration";
import { NARRATION, FILM_DURATION } from "./narration";

/* The recorded read, two encodings of the same take: AAC for quality,
 * MP3 because open-source Chromium builds ship no AAC decoder. */
export const NARRATION_SOURCES = [
  { src: "/film/narration.m4a", type: "audio/mp4" },
  { src: "/film/narration.mp3", type: "audio/mpeg" },
] as const;

/** Full-cut length. The world in scenes.tsx is authored directly in
 * recorded time, so the full cut needs no warp — playback time IS master
 * time IS audio time. */
const FULL_DURATION = FILM_DURATION;

export type CutId = "90" | "30" | "15";

/** A window maps cut-local playback [start, end] onto master time [tIn, tOut]. */
interface CutWindow {
  start: number;
  end: number;
  tIn: number;
  tOut: number;
}

interface Caption {
  from: number;
  to: number;
  text: string;
}

interface CutDef {
  duration: number;
  label: string;
  windows: CutWindow[];
  captions: Caption[];
}

/** Shorter cuts caption only the full sentences that fit — never rewritten. */
const N = (i: number) => NARRATION[i].text;

const CUTS: Record<CutId, CutDef> = {
  /* Full cut — identity: the recorded narration's own clock. */
  "90": {
    duration: FULL_DURATION,
    label: "Full",
    windows: [{ start: 0, end: FULL_DURATION, tIn: 0, tOut: FULL_DURATION }],
    captions: NARRATION.map((n) => ({ from: n.at, to: n.end, text: n.text })),
  },
  /* 30s — exposure, the company, the plan, the gaps, the DPO, Day 90, brand. */
  "30": {
    duration: 30,
    label: "30s",
    windows: [
      { start: 0, end: 4.5, tIn: 0, tOut: 4.5 },
      { start: 4.5, end: 9, tIn: 14.43, tOut: 18.9 },
      { start: 9, end: 12.4, tIn: 26.31, tOut: 29.7 },
      { start: 12.4, end: 16.4, tIn: 31.3, tOut: 35.3 },
      { start: 16.4, end: 20.4, tIn: 41.9, tOut: 45.9 },
      { start: 20.4, end: 24.4, tIn: 56.31, tOut: 60.3 },
      { start: 24.4, end: 30, tIn: 71.2, tOut: 76.8 },
    ],
    captions: [
      { from: 0.4, to: 3.2, text: N(0) },
      { from: 4.6, to: 7.4, text: N(3) },
      { from: 9.1, to: 12.2, text: N(6) },
      { from: 12.6, to: 16.2, text: N(8) },
      { from: 20.6, to: 24.2, text: N(14) },
      { from: 24.6, to: 28.4, text: N(20) },
    ],
  },
  /* 15s — exposure, the plan, Day 90, brand. */
  "15": {
    duration: 15,
    label: "15s",
    windows: [
      { start: 0, end: 3.5, tIn: 0, tOut: 3.5 },
      { start: 3.5, end: 7, tIn: 26.31, tOut: 29.8 },
      { start: 7, end: 11, tIn: 56.31, tOut: 60.3 },
      { start: 11, end: 15, tIn: 73.2, tOut: 77.2 },
    ],
    captions: [
      { from: 0.3, to: 3.2, text: N(0) },
      { from: 3.7, to: 6.8, text: N(6) },
      { from: 7.2, to: 10.8, text: N(14) },
    ],
  },
};

/** Resolve playback time to master time through the active cut's windows. */
function masterTimeAt(cut: CutDef, t: number): number {
  const w =
    cut.windows.find((win) => t < win.end) ??
    cut.windows[cut.windows.length - 1];
  const local = clamp01((t - w.start) / (w.end - w.start));
  return mix(w.tIn, w.tOut, local);
}

/* The score map is authored in recorded time, same clock as the scenes. */
const scoreFor = (id: CutId): AudioTimeline => AUDIO_TIMELINES[id];

/** With the recorded voice on top the score sits back as a bed. */
const scoreLevelFor = (id: CutId): number => (id === "90" ? 0.4 : 1);

function FrameAt({
  cut,
  t,
  orientation,
}: {
  cut: CutDef;
  t: number;
  orientation: Orientation;
}) {
  return <FilmStage t={masterTimeAt(cut, t)} orientation={orientation} />;
}

function formatTime(s: number): string {
  const whole = Math.floor(s);
  const m = Math.floor(whole / 60);
  return `${m}:${(whole % 60).toString().padStart(2, "0")}`;
}

export function BrandFilm({
  initialTime,
  initialCut = "90",
  orientation = "16:9",
}: {
  /** Review hook (?filmt=seconds): mount paused on this master-cut frame. */
  initialTime?: number;
  initialCut?: CutId;
  orientation?: Orientation;
}) {
  const review = initialTime !== undefined && Number.isFinite(initialTime);
  const [cutId, setCutId] = useState<CutId>(initialCut);
  const cut = CUTS[cutId];
  const [started, setStarted] = useState(review);
  const [muted, setMuted] = useState(false);
  const reduced = useReducedMotion();
  const layout = LAYOUTS[orientation];

  const audioRef = useRef<FilmAudio | null>(null);
  const getAudio = () => (audioRef.current ??= new FilmAudio());
  /* The recorded narration plays on the full cut only — the 30s/15s cuts
   * are montage cuts and keep captions + score. Playback time on the full
   * cut IS recording time, so the element follows the clock directly. */
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const hasNarration = cutId === "90";

  const clock = useFilmClock(cut.duration, {
    initialTime: review ? initialTime : 0,
    onEnd: () => {
      audioRef.current?.stop();
      narrationRef.current?.pause();
    },
  });
  const { t, playing, ended, play, pause, seek } = clock;

  useEffect(() => () => audioRef.current?.dispose(), []);

  const startPlayback = useCallback(
    (from?: number) => {
      const origin = from ?? (ended ? 0 : t);
      if (from !== undefined) seek(from);
      setStarted(true);
      getAudio().setLevel(scoreLevelFor(cutId));
      getAudio().start(scoreFor(cutId), origin);
      const voice = narrationRef.current;
      if (hasNarration && voice) {
        voice.currentTime = origin;
        voice.muted = muted;
        void voice.play().catch(() => {});
      }
      play();
    },
    [cutId, ended, hasNarration, muted, play, seek, t],
  );

  const pausePlayback = useCallback(() => {
    pause();
    audioRef.current?.stop();
    narrationRef.current?.pause();
  }, [pause]);

  const handleSeek = useCallback(
    (to: number) => {
      seek(to);
      const voice = narrationRef.current;
      if (voice) voice.currentTime = Math.min(to, voice.duration || to);
      if (playing) {
        audioRef.current?.stop();
        getAudio().setLevel(scoreLevelFor(cutId));
        getAudio().start(scoreFor(cutId), to);
        if (hasNarration && voice) void voice.play().catch(() => {});
      }
    },
    [cutId, hasNarration, playing, seek],
  );

  const switchCut = useCallback(
    (next: CutId) => {
      if (next === cutId) return;
      pausePlayback();
      if (narrationRef.current) narrationRef.current.currentTime = 0;
      setCutId(next);
      // the clock is re-created with the new duration; jump home
      seek(0);
    },
    [cutId, pausePlayback, seek],
  );

  /* The rAF clock is the source of truth; nudge the voice back if the
   * element drifts (tab throttling, decode hiccups). */
  useEffect(() => {
    if (!playing || !hasNarration) return;
    const voice = narrationRef.current;
    if (voice && !voice.paused && Math.abs(voice.currentTime - t) > 0.25) {
      voice.currentTime = t;
    }
  }, [t, playing, hasNarration]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      getAudio().setMuted(!m);
      if (narrationRef.current) narrationRef.current.muted = !m;
      return !m;
    });
  }, []);

  const caption = useMemo(
    () => cut.captions.find((c) => t >= c.from && t <= c.to) ?? null,
    [cut, t],
  );

  const stageClass =
    orientation === "9:16"
      ? "relative mx-auto aspect-[9/16] w-full max-w-[420px]"
      : "relative aspect-video";

  /* Reduced motion, outside review mode: a still with the plan in words. */
  if (reduced && !review) {
    return (
      <figure className="overflow-hidden rounded-2xl border border-brand-line bg-brand">
        <div className="relative aspect-video">
          <FilmPoster className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/30 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="display text-2xl font-semibold text-brand-ink">From Exposure to Control</p>
            <p className="mt-1 text-xs text-brand-muted">
              An Iltizam film · 78 seconds · motion is paused by your system preference
            </p>
            <blockquote className="display mt-4 max-w-xl space-y-1 text-[15px] leading-6 text-brand-ink/90">
              <p>{NARRATION[0].text}</p>
              <p>{NARRATION[14].text}</p>
              <p>{NARRATION[20].text}</p>
              <p className="text-gold-bright">{"From exposure to control in 90 days."}</p>
            </blockquote>
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-brand-line bg-brand shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)]">
      {/* the recorded narration; mounted from the start so it preloads.
          Captions render as the synced lower-third layer over the stage. */}
      <audio ref={narrationRef} preload="auto">
        {NARRATION_SOURCES.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </audio>
      <div className={stageClass}>
        {started ? (
          <>
            <svg
              viewBox={`0 0 ${layout.w} ${layout.h}`}
              className="absolute inset-0 h-full w-full"
              aria-label="From Exposure to Control — an Iltizam film"
              role="img"
            >
              <FilmDefs />
              <FrameAt cut={cut} t={t} orientation={orientation} />
            </svg>

            {/* the narration as synchronized lower-third captions */}
            {caption ? (
              <p
                aria-live="polite"
                className="absolute inset-x-0 bottom-[5%] mx-auto w-fit max-w-[88%] rounded-md bg-[#26292e]/80 px-4 py-1.5 text-center text-[13px] leading-5 text-[#f4f0e5] sm:text-[15px] sm:leading-6"
              >
                {caption.text}
              </p>
            ) : null}

            {/* replay veil */}
            {ended ? (
              <button
                type="button"
                onClick={() => startPlayback(0)}
                className="absolute inset-0 flex items-center justify-center bg-brand/40 text-brand-ink transition-colors hover:bg-brand/50"
              >
                <span className="rounded-full border border-gold/70 bg-brand/70 px-5 py-2 text-sm font-medium text-gold-bright">
                  Watch again
                </span>
              </button>
            ) : null}
          </>
        ) : (
          /* ── poster ─────────────────────────────────────────────────── */
          <button
            type="button"
            onClick={() => startPlayback(0)}
            className="group absolute inset-0 block w-full text-left"
            aria-label="Play From Exposure to Control, a 78 second narrated film"
          >
            <FilmPoster className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 bg-gradient-to-t from-brand/90 via-transparent to-transparent" />
            <span className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className="display block text-3xl font-semibold text-brand-ink">
                From Exposure to Control
              </span>
              <span className="mt-1 block text-xs tracking-wide text-brand-muted">
                An Iltizam film · 78 seconds · narrated
              </span>
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/80 bg-brand/60 transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden="true">
                  <path d="M7 4.5 L19 12 L7 19.5 Z" fill="var(--gold-bright)" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      {/* ── controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-brand-line px-3 py-2.5 text-brand-muted sm:px-4">
        <button
          type="button"
          onClick={() => (playing ? pausePlayback() : startPlayback())}
          className="rounded-md px-2 py-1 text-[13px] font-medium text-brand-ink transition-colors hover:bg-brand2 focus-visible:outline-2 focus-visible:outline-gold-bright"
        >
          {playing ? "Pause" : started && !ended ? "Play" : "Play film"}
        </button>
        <span className="font-mono text-[11px] tabular-nums">
          {formatTime(t)} / {formatTime(cut.duration)}
        </span>
        <input
          type="range"
          min={0}
          max={cut.duration}
          step={0.01}
          value={t}
          onChange={(e) => {
            setStarted(true);
            handleSeek(Number.parseFloat(e.target.value));
          }}
          aria-label="Seek"
          className="min-w-24 flex-1 accent-[var(--gold-bright)]"
        />
        <span className="inline-flex overflow-hidden rounded-md border border-brand-line" role="group" aria-label="Cut length">
          {(Object.keys(CUTS) as CutId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => switchCut(id)}
              className={`border-l border-brand-line px-2.5 py-1 text-[11px] font-medium first:border-l-0 transition-colors ${
                id === cutId
                  ? "bg-brand2 text-gold-bright"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {CUTS[id].label}
            </button>
          ))}
        </span>
        <button
          type="button"
          onClick={toggleMute}
          className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-brand2 hover:text-brand-ink"
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
    </figure>
  );
}
