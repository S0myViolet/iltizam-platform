// ─────────────────────────────────────────────────────────────────────────────
// BrandFilm.tsx — the player for "The 90-Day Transformation".
//
// The shell owns: the poster, the rAF clock (engine.ts), the CUT WINDOW
// TABLES that map playback time → master time (the film is one continuous
// world; a cut is a set of master-time windows), the narration captions
// (the locked VO ships as synchronized lower-third captions — this doubles
// as the captioned + sound-off version), the audio timelines, controls, the
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

/* ── THE LOCKED NARRATION — timed to the recorded voiceover ─────────────── */
// public/film/narration.m4a (78.3s). Timings are measured from the
// recording itself: ffmpeg silencedetect found the speech bursts, and the
// sixteen sentences were aligned to them by length. If a sentence lands
// early/late against the actual read, adjust its `at`/`end` here — captions,
// scene sync (SYNC below) and the score all follow this one table.
export const NARRATION: { at: number; end: number; text: string }[] = [
  { at: 0.5, end: 6.15, text: "With massive new data privacy fines looming, businesses need a rapid path to defense." },
  { at: 6.35, end: 7.95, text: "Enter the 90-day inspection-ready plan." },
  { at: 8.71, end: 17.6, text: "Take a publicly listed company holding a massive, disorganized web of highly vulnerable customer records." },
  { at: 18.07, end: 20.05, text: "Phase one, Diagnose, twenty days." },
  { at: 20.28, end: 29.55, text: "The system scans that chaotic web to uncover hidden vulnerabilities, running a gap analysis to determine exactly which regulatory licenses the company actually needs." },
  { at: 29.94, end: 33.25, text: "Phase two is Build, days twenty-one to sixty." },
  { at: 33.41, end: 40.05, text: "This constructs structural legal architecture, snapping consent registers and breach logs directly into place." },
  { at: 40.16, end: 49.15, text: "It also appoints the specific individual who takes personal legal liability for the entire framework, the Data Protection Officer." },
  { at: 49.48, end: 51.45, text: "Phase three, Operationalise." },
  { at: 51.58, end: 54.15, text: "The system transitions from theory to active defense." },
  { at: 54.24, end: 56.7, text: "Staff embed these controls into their daily workflow," },
  { at: 56.82, end: 59.75, text: "running a simulated data breach to prove the shields actually hold under pressure." },
  { at: 59.97, end: 62.95, text: "But notice the timeline stops exactly at ninety days." },
  { at: 63.14, end: 68.75, text: "The goal is assembling the final evidence pack to be fully inspection-ready, without waiting on unpredictable government approvals." },
  { at: 68.91, end: 72.95, text: "And remember that massive, incredibly vulnerable web of scattered customer records from the very beginning?" },
  { at: 73.11, end: 76.6, text: "It is now a fully documented, legally protected system, permanently locked in and ready for the regulators." },
];

/* The recorded read, two encodings of the same take: AAC for quality,
 * MP3 because open-source Chromium builds ship no AAC decoder. */
export const NARRATION_SOURCES = [
  { src: "/film/narration.m4a", type: "audio/mp4" },
  { src: "/film/narration.mp3", type: "audio/mpeg" },
] as const;

/** Full-cut length: the recording runs 78.3s; the brand cover holds to 80. */
const FULL_DURATION = 80;

/* ── Scene sync ─────────────────────────────────────────────────────────────
 * The world in scenes.tsx is still authored on the original 90-second master
 * timeline. Each anchor pairs a recorded-narration second with the master
 * second that sentence was authored at; the windows built from them warp the
 * camera so every beat lands where the voice actually says it. */
const SYNC: [playback: number, master: number][] = [
  [0, 0],
  [6.35, 5.8],
  [8.71, 9.5],
  [18.07, 16.5],
  [20.28, 19.8],
  [29.94, 30.0],
  [33.41, 33.8],
  [40.16, 41.8],
  [49.48, 50.0],
  [51.58, 52.8],
  [54.24, 56.8],
  [56.82, 60.2],
  [59.97, 66.5],
  [63.14, 70.3],
  [68.91, 78.5],
  [73.11, 83.3],
  [FULL_DURATION, 90],
];

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

const SYNC_WINDOWS: CutWindow[] = SYNC.slice(0, -1).map(([s, m], i) => ({
  start: s,
  end: SYNC[i + 1][0],
  tIn: m,
  tOut: SYNC[i + 1][1],
}));

const CUTS: Record<CutId, CutDef> = {
  /* Full cut — one continuous camera move, warped onto the recorded VO. */
  "90": {
    duration: FULL_DURATION,
    label: "Full",
    windows: SYNC_WINDOWS,
    captions: NARRATION.map((n) => ({ from: n.at, to: n.end, text: n.text })),
  },
  /* 30s — report→ribbon, web, one Diagnose finding, Build+DPO, Day 90+dossier, brand. */
  "30": {
    duration: 30,
    label: "30s",
    windows: [
      { start: 0, end: 5, tIn: 0.4, tOut: 9 },
      { start: 5, end: 10, tIn: 9, tOut: 16.5 },
      { start: 10, end: 16, tIn: 16.5, tOut: 24 },
      { start: 16, end: 23, tIn: 29.5, tOut: 49.5 },
      { start: 23, end: 28, tIn: 66.5, tOut: 77.5 },
      { start: 28, end: 30, tIn: 85.2, tOut: 90 },
    ],
    captions: [
      { from: 0.5, to: 3.6, text: N(1) },
      { from: 4.9, to: 9.9, text: N(2) },
      { from: 10.3, to: 13.2, text: N(3) },
      { from: 16.2, to: 19.2, text: N(5) },
      { from: 23.4, to: 26.6, text: N(12) },
    ],
  },
  /* 15s — ribbon reveal, one finding, dossier + DAY 90, brand. */
  "15": {
    duration: 15,
    label: "15s",
    windows: [
      { start: 0, end: 4, tIn: 4.4, tOut: 9.4 },
      { start: 4, end: 7, tIn: 18.5, tOut: 22.5 },
      { start: 7, end: 11, tIn: 66.5, tOut: 74.5 },
      { start: 11, end: 15, tIn: 84.6, tOut: 90 },
    ],
    captions: [
      { from: 0.4, to: 3.4, text: N(1) },
      { from: 4.3, to: 6.9, text: N(3) },
      { from: 7.4, to: 10.6, text: N(12) },
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

/** Inverse warp for the full cut: master second → recorded-playback second. */
function playbackTimeAt(m: number): number {
  const w =
    SYNC_WINDOWS.find((win) => m < win.tOut) ??
    SYNC_WINDOWS[SYNC_WINDOWS.length - 1];
  const local = clamp01((m - w.tIn) / (w.tOut - w.tIn));
  return mix(w.start, w.end, local);
}

/* The synthesized score is authored in master time; the full cut now plays
 * in recorded-narration time, so its event map warps through the anchors. */
const SCORE_FULL: AudioTimeline = (() => {
  const tl = AUDIO_TIMELINES["90"];
  return {
    warmUntil: playbackTimeAt(tl.warmUntil),
    tension: tl.tension
      ? [playbackTimeAt(tl.tension[0]), playbackTimeAt(tl.tension[1])]
      : null,
    ticks: tl.ticks.map(playbackTimeAt),
    thuds: tl.thuds.map(playbackTimeAt),
    pulse: tl.pulse
      ? [playbackTimeAt(tl.pulse[0]), playbackTimeAt(tl.pulse[1])]
      : null,
    resolve: tl.resolve === null ? null : playbackTimeAt(tl.resolve),
    final: tl.final === null ? null : playbackTimeAt(tl.final),
  };
})();

const scoreFor = (id: CutId): AudioTimeline =>
  id === "90" ? SCORE_FULL : AUDIO_TIMELINES[id];

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
            <p className="display text-2xl font-semibold text-brand-ink">The 90-Day Transformation</p>
            <p className="mt-1 text-xs text-brand-muted">
              An Iltzam film · 80 seconds · motion is paused by your system preference
            </p>
            <blockquote className="display mt-4 max-w-xl space-y-1 text-[15px] leading-6 text-brand-ink/90">
              <p>{NARRATION[1].text}</p>
              <p>{NARRATION[12].text}</p>
              <p>{NARRATION[15].text}</p>
              <p className="text-gold-bright">{"From scattered data to inspection-ready in 90 days."}</p>
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
              aria-label="The 90-Day Transformation — an Iltzam film"
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
            aria-label="Play The 90-Day Transformation, an 80 second narrated film"
          >
            <FilmPoster className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 bg-gradient-to-t from-brand/90 via-transparent to-transparent" />
            <span className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className="display block text-3xl font-semibold text-brand-ink">
                The 90-Day Transformation
              </span>
              <span className="mt-1 block text-xs tracking-wide text-brand-muted">
                An Iltzam film · 80 seconds · narrated
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
