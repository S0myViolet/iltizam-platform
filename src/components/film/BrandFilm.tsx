// ─────────────────────────────────────────────────────────────────────────────
// BrandFilm.tsx — the player for "After Submit".
//
// The shell owns: the poster, the rAF clock (engine.ts), the CUT WINDOW
// TABLES that map playback time → (scene, p), the caption cues (closing
// voiceover only — all other text in the film is diegetic and lives inside
// the scenes), the audio timelines, controls, reduced-motion fallback, and
// the ?filmt=<seconds> review hook (passed in as initialTime by the /film
// page) that renders any master-cut frame as a paused still.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilmClock, useReducedMotion } from "./engine";
import { clamp01 } from "./math";
import {
  FilmDefs,
  FilmPoster,
  SCENES,
  STAGE_H,
  STAGE_W,
  type SceneId,
} from "./scenes";
import { AUDIO_TIMELINES, FilmAudio } from "./audio";

export type CutId = "48" | "30" | "15";

interface CutWindow {
  scene: SceneId;
  start: number;
  end: number;
  pIn: number;
  pOut: number;
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

/* The closing voiceover — the only caption lines in the film. */
const VO_1 = "People share more than information.";
const VO_2 = "They share trust.";
const VO_3 = "What happens next is your responsibility.";

const CUTS: Record<CutId, CutDef> = {
  /* Master cut — the full 48 seconds, uneven on purpose. */
  "48": {
    duration: 48,
    label: "48s",
    windows: [
      { scene: "s1", start: 0, end: 8, pIn: 0, pOut: 1 },
      { scene: "s2", start: 8, end: 19, pIn: 0, pOut: 1 },
      { scene: "s3", start: 19, end: 26, pIn: 0, pOut: 1 },
      { scene: "s4", start: 26, end: 33, pIn: 0, pOut: 1 },
      { scene: "s5", start: 33, end: 41.5, pIn: 0, pOut: 1 },
      { scene: "s6", start: 41.5, end: 48, pIn: 0, pOut: 1 },
    ],
    captions: [
      { from: 42.0, to: 43.6, text: VO_1 },
      { from: 43.9, to: 45.3, text: VO_2 },
      { from: 45.6, to: 47.2, text: VO_3 },
    ],
  },
  /* 30s — drops the still scene (S3); compresses the breath, keeps the story. */
  "30": {
    duration: 30,
    label: "30s",
    windows: [
      { scene: "s1", start: 0, end: 5, pIn: 0.25, pOut: 1 },
      { scene: "s2", start: 5, end: 11, pIn: 0, pOut: 1 },
      { scene: "s4", start: 11, end: 17, pIn: 0, pOut: 1 },
      { scene: "s5", start: 17, end: 25, pIn: 0, pOut: 1 },
      { scene: "s6", start: 25, end: 30, pIn: 0.05, pOut: 1 },
    ],
    captions: [
      { from: 25.2, to: 26.4, text: VO_1 },
      { from: 26.7, to: 27.8, text: VO_2 },
      { from: 28.0, to: 29.3, text: VO_3 },
    ],
  },
  /* 15s — submit, request, decision, brand. One caption. */
  "15": {
    duration: 15,
    label: "15s",
    windows: [
      { scene: "s1", start: 0, end: 4, pIn: 0.28, pOut: 0.66 },
      { scene: "s4", start: 4, end: 7.5, pIn: 0, pOut: 0.5 },
      { scene: "s5", start: 7.5, end: 12, pIn: 0, pOut: 1 },
      { scene: "s6", start: 12, end: 15, pIn: 0.55, pOut: 1 },
    ],
    captions: [{ from: 12.5, to: 14.2, text: VO_3 }],
  },
};

/** Resolve playback time to a frame through the active cut's window table. */
function FrameAt({ cut, t }: { cut: CutDef; t: number }) {
  const w =
    cut.windows.find((win) => t < win.end) ??
    cut.windows[cut.windows.length - 1];
  const local = clamp01((t - w.start) / (w.end - w.start));
  const p = w.pIn + local * (w.pOut - w.pIn);
  const scene = SCENES[w.scene];
  const C = scene.C;
  return <C p={p} t={p * scene.dur} />;
}

function formatTime(s: number): string {
  const whole = Math.floor(s);
  return `0:${whole.toString().padStart(2, "0")}`;
}

export function BrandFilm({
  initialTime,
  initialCut = "48",
}: {
  /** Review hook (?filmt=seconds): mount paused on this master-cut frame. */
  initialTime?: number;
  initialCut?: CutId;
}) {
  const review = initialTime !== undefined && Number.isFinite(initialTime);
  const [cutId, setCutId] = useState<CutId>(initialCut);
  const cut = CUTS[cutId];
  const [started, setStarted] = useState(review);
  const [muted, setMuted] = useState(false);
  const reduced = useReducedMotion();

  const audioRef = useRef<FilmAudio | null>(null);
  const getAudio = () => (audioRef.current ??= new FilmAudio());

  const clock = useFilmClock(cut.duration, {
    initialTime: review ? initialTime : 0,
    onEnd: () => audioRef.current?.stop(),
  });
  const { t, playing, ended, play, pause, seek } = clock;

  useEffect(() => () => audioRef.current?.dispose(), []);

  const startPlayback = useCallback(
    (from?: number) => {
      const origin = from ?? (ended ? 0 : t);
      if (from !== undefined) seek(from);
      setStarted(true);
      getAudio().start(AUDIO_TIMELINES[cutId], origin);
      play();
    },
    [cutId, ended, play, seek, t],
  );

  const pausePlayback = useCallback(() => {
    pause();
    audioRef.current?.stop();
  }, [pause]);

  const handleSeek = useCallback(
    (to: number) => {
      seek(to);
      if (playing) {
        audioRef.current?.stop();
        getAudio().start(AUDIO_TIMELINES[cutId], to);
      }
    },
    [cutId, playing, seek],
  );

  const switchCut = useCallback(
    (next: CutId) => {
      if (next === cutId) return;
      pausePlayback();
      setCutId(next);
      // the clock is re-created with the new duration; jump home
      seek(0);
    },
    [cutId, pausePlayback, seek],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      getAudio().setMuted(!m);
      return !m;
    });
  }, []);

  const caption = useMemo(
    () => cut.captions.find((c) => t >= c.from && t <= c.to) ?? null,
    [cut, t],
  );

  /* Reduced motion, outside review mode: a still with the closing lines. */
  if (reduced && !review) {
    return (
      <figure className="overflow-hidden rounded-2xl border border-brand-line bg-brand">
        <div className="relative aspect-video">
          <FilmPoster className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/30 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="display text-2xl font-semibold text-brand-ink">After Submit</p>
            <p className="mt-1 text-xs text-brand-muted">
              An Iltizam film · 48 seconds · motion is paused by your system preference
            </p>
            <blockquote className="display mt-4 max-w-md space-y-1 text-[15px] leading-6 text-brand-ink/90">
              <p>{VO_1}</p>
              <p>{VO_2}</p>
              <p>{VO_3}</p>
              <p className="text-gold-bright">{"What happens after “Submit” matters."}</p>
            </blockquote>
          </figcaption>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-brand-line bg-brand shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)]">
      <div className="relative aspect-video">
        {started ? (
          <>
            <svg
              viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
              className="absolute inset-0 h-full w-full"
              aria-label="After Submit — an Iltizam film"
              role="img"
            >
              <FilmDefs />
              <rect width={STAGE_W} height={STAGE_H} fill="#17130f" />
              <FrameAt cut={cut} t={t} />
            </svg>

            {/* the only captions in the film: the closing voiceover */}
            {caption ? (
              <p
                aria-live="polite"
                className="display absolute inset-x-0 bottom-[6%] mx-auto max-w-2xl px-6 text-center text-base text-[#f0ecdf] [text-shadow:0_1px_10px_rgba(0,0,0,0.65)] sm:text-lg"
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
                <span className="rounded-full border border-gold/70 px-5 py-2 text-sm font-medium text-gold-bright">
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
            aria-label="Play After Submit, a 48 second film"
          >
            <FilmPoster className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 bg-gradient-to-t from-brand/90 via-transparent to-transparent" />
            <span className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className="display block text-3xl font-semibold text-brand-ink">
                After Submit
              </span>
              <span className="mt-1 block text-xs tracking-wide text-brand-muted">
                An Iltizam film · 48 seconds
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
