"use client";

/**
 * BrandFilm — the player for "What You Don't See".
 *
 * A 16:9 letterboxed stage driven by a single rAF clock (pure function of t):
 * poster → hand-choreographed SVG scenes → lower-third serif captions.
 * Cuts ("60" | "30" | "15") are alternative window+cue tables over the same
 * seven scenes. Sound is synthesized (WebAudio), OFF by default, and only
 * ever started from a user gesture.
 */

import { useEffect, useRef, useState } from "react";

import { FilmAudio } from "./audio";
import { clamp01, easeOut, seg, useFilmClock, type TimelineCue } from "./engine";
import { FilmDefs, MONO, SCENES, SERIF } from "./scenes";

declare global {
  interface Window {
    __filmSeek?: (t: number) => void;
  }
}

type Cut = "60" | "30" | "15";

type SceneWindow = {
  scene: number; // index into SCENES
  start: number;
  end: number;
  p0?: number; // scene-local progress sub-range, for partial replays
  p1?: number;
};

const WINDOWS: Record<Cut, SceneWindow[]> = {
  "60": [
    { scene: 0, start: 0, end: 7 },
    { scene: 1, start: 7, end: 16 },
    { scene: 2, start: 16, end: 27 },
    { scene: 3, start: 27, end: 34 },
    { scene: 4, start: 34, end: 44 },
    { scene: 5, start: 44, end: 52 },
    { scene: 6, start: 52, end: 60 },
  ],
  "30": [
    { scene: 0, start: 0, end: 4 },
    { scene: 1, start: 4, end: 10, p1: 0.6 }, // two of the three actions
    { scene: 2, start: 10, end: 17 },
    { scene: 3, start: 17, end: 20, p1: 0.6 },
    { scene: 4, start: 20, end: 26 },
    { scene: 5, start: 26, end: 29, p1: 0.8 },
    { scene: 6, start: 29, end: 30, p0: 0.62, p1: 0.95 }, // brand frame only
  ],
  "15": [
    { scene: 2, start: 0, end: 6, p1: 0.45 }, // dark space: threads + one risk beat
    { scene: 4, start: 6, end: 11, p1: 0.75 }, // the comb
    { scene: 6, start: 11, end: 15, p0: 0.5, p1: 1 }, // brand frame
  ],
};

const CUES: Record<Cut, TimelineCue[]> = {
  "60": [
    { at: 0.8, end: 5.5, text: "Every business begins with trust." },
    { at: 7.4, end: 9.6, text: "A name shared." },
    { at: 9.8, end: 12.2, text: "A document uploaded." },
    { at: 12.4, end: 15.4, text: "A customer remembered." },
    { at: 16.4, end: 19.4, text: "But behind every ordinary action, data moves." },
    { at: 20.4, end: 22.4, text: "Some is exposed." },
    { at: 22.6, end: 24.6, text: "Some travels too far." },
    { at: 24.8, end: 26.8, text: "Some stays longer than it should." },
    { at: 27.6, end: 30.4, text: "Most of the time, no one sees it." },
    { at: 34.6, end: 38.2, text: "Iltizam brings what is hidden into view." },
    {
      at: 38.8,
      end: 43.4,
      text: "It checks your data against clear rules and shows your team what needs attention.",
    },
    { at: 44.4, end: 46.2, text: "Your people review the findings." },
    { at: 46.6, end: 48.4, text: "Your people make the decision." },
    { at: 48.8, end: 51.6, text: "Iltizam makes sure nothing important stays invisible." },
    { at: 52.4, end: 54.6, text: "Because protecting data is not only about compliance." },
    { at: 54.8, end: 57.2, text: "It is about protecting the trust your business was built on." },
  ],
  "30": [
    { at: 0.5, end: 3.5, text: "Every business begins with trust." },
    { at: 4.3, end: 6.2, text: "A name shared." },
    { at: 6.5, end: 9.4, text: "A document uploaded." },
    { at: 10.4, end: 13.2, text: "But behind every ordinary action, data moves." },
    { at: 13.6, end: 15.1, text: "Some is exposed." },
    { at: 15.3, end: 16.8, text: "Some travels too far." },
    { at: 17.4, end: 19.6, text: "Most of the time, no one sees it." },
    { at: 20.5, end: 23.3, text: "Iltizam brings what is hidden into view." },
    {
      at: 23.6,
      end: 25.8,
      text: "It checks your data against clear rules and shows your team what needs attention.",
    },
    { at: 26.3, end: 28.7, text: "Iltizam makes sure nothing important stays invisible." },
  ],
  "15": [
    { at: 0.4, end: 4.5, text: "Behind every ordinary action, data moves." },
    { at: 6.4, end: 10.4, text: "Iltizam brings what is hidden into view." },
  ],
};

const FADE = 0.7; // crossfade between scene windows, seconds

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

/** The full frame at time t: crossfaded scene layers inside one SVG. */
function Frame({ cut, t }: { cut: Cut; t: number }) {
  const windows = WINDOWS[cut];
  return (
    <svg viewBox="0 0 1600 900" className="block h-full w-full" aria-hidden="true">
      <FilmDefs />
      <rect x={0} y={0} width={1600} height={900} fill="url(#filmBg)" />
      {windows.map((w, i) => {
        const last = i === windows.length - 1;
        if (t < w.start || t >= w.end + (last ? 0.001 : FADE)) return null;
        const raw = clamp01((t - w.start) / (w.end - w.start));
        const p0 = w.p0 ?? 0;
        const p = clamp01(p0 + ((w.p1 ?? 1) - p0) * raw);
        const aIn = i === 0 ? 1 : seg(t, w.start, w.start + FADE);
        const aOut = last ? 1 : 1 - seg(t, w.end, w.end + FADE);
        const Scene = SCENES[w.scene];
        return (
          <g key={i} opacity={Math.min(aIn, aOut)}>
            <Scene p={p} t={t} />
          </g>
        );
      })}
    </svg>
  );
}

export default function BrandFilm({ cut = "60", className = "" }: { cut?: Cut; className?: string }) {
  const windows = WINDOWS[cut];
  const cues = CUES[cut];
  const duration = windows[windows.length - 1].end;

  const { t, playing, play, pause, seek } = useFilmClock({ duration, autoPlay: false });
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(false); // default MUTED
  const [captionsOn, setCaptionsOn] = useState(true); // default ON
  const [reducedMotion, setReducedMotion] = useState(false);
  const [forceControls, setForceControls] = useState(false);
  const audioRef = useRef<FilmAudio | null>(null);
  const tLatest = useRef(0);

  /* prefers-reduced-motion → poster + caption script instead of animation */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* debug/test hook: ?filmt=SECONDS renders that exact frame, paused */
  useEffect(() => {
    window.__filmSeek = seek;
    const raw = new URLSearchParams(window.location.search).get("filmt");
    if (raw !== null) {
      const v = Number(raw);
      if (Number.isFinite(v)) {
        setStarted(true);
        setForceControls(true);
        seek(v);
      }
    }
    return () => {
      delete window.__filmSeek;
    };
  }, [seek]);

  /* keep the score locked to the film clock */
  useEffect(() => {
    tLatest.current = t;
    audioRef.current?.update(t);
  }, [t]);

  const handlePlay = () => {
    setStarted(true);
    play();
    if (soundOn) audioRef.current?.start(tLatest.current);
  };
  const handlePause = () => {
    pause();
    audioRef.current?.stop();
  };
  const toggleSound = () => {
    if (!soundOn) {
      const a = audioRef.current ?? (audioRef.current = new FilmAudio());
      a.setMuted(false);
      if (playing) a.start(tLatest.current); // user gesture — allowed
      setSoundOn(true);
    } else {
      audioRef.current?.setMuted(true);
      audioRef.current?.stop();
      setSoundOn(false);
    }
  };

  const stageClasses =
    "relative mx-auto aspect-video w-full max-w-[1100px] overflow-hidden border border-[#3a3f47] bg-[#131518]";

  /* ── Reduced motion: poster frame + the caption script as text ─────────── */
  if (reducedMotion) {
    return (
      <div className={`bg-[#0c0d10] py-6 ${className}`}>
        <div className={stageClasses}>
          <Frame cut="60" t={22.6} />
          <PosterTitles />
        </div>
        <div className="mx-auto mt-8 max-w-[52ch] px-6">
          {cues.map((c) => (
            <p
              key={c.at}
              className="mb-3 text-center text-[17px] leading-7 text-[#e8e2d6]"
              style={{ fontFamily: SERIF }}
            >
              {c.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const showControls = started && (forceControls || !playing);

  return (
    <div className={`bg-[#0c0d10] py-6 ${className}`}>
      <div className={`group ${stageClasses}`}>
        {/* the poster is always the S3 dark space, whatever the cut */}
        {started ? <Frame cut={cut} t={t} /> : <Frame cut="60" t={22.6} />}

        {/* poster */}
        {!started ? (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex w-full cursor-pointer flex-col items-center justify-center bg-[#131518]/55 text-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#6fa39c]"
            aria-label="Play the film"
          >
            <span
              className="text-[11px] font-medium tracking-[0.22em] text-[#8d867a] uppercase"
              style={{ fontFamily: MONO }}
            >
              Iltizam — a film about invisible data
            </span>
            <span
              className="mt-3 text-4xl text-[#e8e2d6] sm:text-5xl"
              style={{ fontFamily: SERIF, letterSpacing: "0.01em" }}
            >
              What You Don&apos;t See
            </span>
            <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#8d867a]/60 transition-colors group-hover:border-[#e8e2d6]/80">
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden="true">
                <path d="M7 4.5 19 12 7 19.5Z" fill="#e8e2d6" />
              </svg>
            </span>
          </button>
        ) : null}

        {/* captions — pure function of t */}
        {started && captionsOn ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[13%] flex justify-center px-8">
            {cues.map((c) => {
              const a = Math.min(seg(t, c.at, c.at + 0.5), 1 - seg(t, c.end - 0.4, c.end));
              if (a <= 0) return null;
              const rise = (1 - easeOut(seg(t, c.at, c.at + 0.5))) * 4;
              return (
                <p
                  key={c.at}
                  className="text-center text-[16px] leading-7 text-[#e8e2d6] sm:text-[19px]"
                  style={{
                    fontFamily: SERIF,
                    maxWidth: "44ch",
                    opacity: a,
                    transform: `translateY(${rise}px)`,
                    textShadow: "0 1px 14px rgba(12,13,16,0.8)",
                  }}
                >
                  {c.text}
                </p>
              );
            })}
          </div>
        ) : null}

        {/* controls */}
        {started ? (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d10]/90 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
            }`}
          >
            <input
              type="range"
              min={0}
              max={duration}
              step={0.02}
              value={t}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Film timeline"
              className="block h-1 w-full cursor-pointer appearance-none rounded-full bg-[#3a3f47] accent-[#6fa39c]"
            />
            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={playing ? handlePause : handlePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-8 w-8 items-center justify-center text-[#e8e2d6] hover:text-white"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path d="M6 4h4v16H6ZM14 4h4v16h-4Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" aria-hidden="true">
                    <path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-[#8d867a] tabular-nums" style={{ fontFamily: MONO }}>
                {fmt(t)} / {fmt(duration)}
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                className={`text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
                  soundOn ? "text-[#e8e2d6]" : "text-[#6b6f76] hover:text-[#8d867a]"
                }`}
                style={{ fontFamily: MONO }}
              >
                Sound {soundOn ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={() => setCaptionsOn((v) => !v)}
                aria-pressed={captionsOn}
                className={`text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
                  captionsOn ? "text-[#e8e2d6]" : "text-[#6b6f76] hover:text-[#8d867a]"
                }`}
                style={{ fontFamily: MONO }}
              >
                Captions
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Title overlay reused by the reduced-motion poster. */
function PosterTitles() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#131518]/55 text-center">
      <span
        className="text-[11px] font-medium tracking-[0.22em] text-[#8d867a] uppercase"
        style={{ fontFamily: MONO }}
      >
        Iltizam — a film about invisible data
      </span>
      <span
        className="mt-3 text-4xl text-[#e8e2d6] sm:text-5xl"
        style={{ fontFamily: SERIF, letterSpacing: "0.01em" }}
      >
        What You Don&apos;t See
      </span>
    </div>
  );
}
