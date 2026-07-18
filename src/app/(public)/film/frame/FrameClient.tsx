"use client";

// The export surface: a bare, chrome-free stage the MP4 pipeline drives.
// scripts/export-film.ts loads /film/frame once, then calls window.__setT(t)
// per frame and screenshots #stage — every frame is the pure function of
// time from scenes.tsx, so the exported film IS the site film. __setCap
// toggles the burned-caption layer for the sound-off version; __renderScore
// bounces the synthesized score offline for the audio mix.

import { useEffect, useState } from "react";
import { FilmDefs, FilmStage, LAYOUTS, type Orientation } from "@/components/film/scenes";
import { NARRATION } from "@/components/film/narration";
import { bufferToWavBase64, renderScoreOffline } from "@/components/film/audio-offline";

declare global {
  interface Window {
    __setT: (t: number) => void;
    __setCap: (on: boolean) => void;
    __renderScore: (duration: number, level?: number) => Promise<string>;
    __frameReady: boolean;
  }
}

export function FrameClient({ initialT, initialCap, orientation }: {
  initialT: number; initialCap: boolean; orientation: Orientation;
}) {
  const [t, setT] = useState(initialT);
  const [cap, setCap] = useState(initialCap);
  const layout = LAYOUTS[orientation];

  useEffect(() => {
    window.__setT = (next: number) => setT(next);
    window.__setCap = (on: boolean) => setCap(on);
    window.__renderScore = async (duration: number, level = 0.4) =>
      bufferToWavBase64(await renderScoreOffline(duration, 48000, level));
    window.__frameReady = true;
  }, []);

  const caption = cap ? NARRATION.find((n) => t >= n.at && t <= n.end) ?? null : null;

  return (
    <div id="stage" style={{ position: "fixed", inset: 0, background: "#efeadf" }}>
      <svg viewBox={`0 0 ${layout.w} ${layout.h}`} style={{ width: "100%", height: "100%", display: "block" }}
        preserveAspectRatio="xMidYMid slice" role="img" aria-label="Film frame">
        <FilmDefs />
        <FilmStage t={t} orientation={orientation} />
      </svg>
      {caption ? (
        <p
          style={{
            position: "absolute", left: "50%", bottom: "6%", transform: "translateX(-50%)",
            maxWidth: "82%", margin: 0, padding: "0.55em 1.1em", borderRadius: 8,
            background: "rgba(38, 41, 46, 0.82)", color: "#f4f0e5", textAlign: "center",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
            fontSize: "2.55vh", lineHeight: 1.45, textWrap: "balance",
          }}
        >
          {caption.text}
        </p>
      ) : null}
    </div>
  );
}
