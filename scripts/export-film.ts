// ─────────────────────────────────────────────────────────────────────────────
// export-film.ts — renders "From Exposure to Control" to real MP4 files.
//
//   npm run start        (production server on :4040, in another terminal)
//   npx tsx scripts/export-film.ts
//
// Pipeline: headless Chromium loads /film/frame once, then __setT(t) +
// screenshot per frame (24fps, 1920×1080) — two passes, clean and burned
// captions. The synthesized score + sound design is bounced offline in the
// same page (__renderScore → WAV). ffmpeg then muxes:
//   voice   = public/film/narration.m4a  (the recorded narration, untouched)
//   score   = the offline bounce, ducked under the voice (sidechain)
// into three deliverables in public/film/exports/:
//   from-exposure-to-control-master.mp4     — clean narrated master
//   from-exposure-to-control-subtitled.mp4  — same + soft English subtitles
//   from-exposure-to-control-captions.mp4   — burned captions (sound-off
//                                             friendly; audio kept)
// plus from-exposure-to-control.srt. Every output carries the narration
// audio stream — the script verifies streams with ffprobe and fails loudly
// on a silent export.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { FILM_DURATION, NARRATION } from "../src/components/film/narration";

const FPS = 24;
const BASE = process.env.FILM_URL ?? "http://localhost:4040";
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "film", "exports");
const NAME = "from-exposure-to-control";

function resolveFfmpeg(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@ffmpeg-installer/ffmpeg").path as string;
  } catch {
    return "ffmpeg"; // PATH fallback
  }
}

function resolveChromium(): { chromium: typeof import("playwright-core").chromium } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("playwright-core");
  } catch {
    // the remote sandbox ships playwright globally
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("/opt/node22/lib/node_modules/playwright/node_modules/playwright-core");
  }
}

const CHROME_PATHS = [
  process.env.CHROMIUM_PATH,
  "/opt/pw-browsers/chromium",
].filter(Boolean) as string[];

/* ── SRT ────────────────────────────────────────────────────────────────── */

function srtTime(s: number): string {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const rem = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(sec)},${p(rem, 3)}`;
}

/** ≤2 lines, balanced split, exact narration wording. */
function wrapCaption(text: string): string {
  if (text.length <= 42) return text;
  const words = text.split(" ");
  let best: string | null = null;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (a.length <= 68 && b.length <= 68 && diff < bestDiff) {
      best = `${a}\n${b}`;
      bestDiff = diff;
    }
  }
  return best ?? text;
}

function buildSrt(): string {
  return NARRATION.map((n, i) =>
    `${i + 1}\n${srtTime(n.at)} --> ${srtTime(n.end)}\n${wrapCaption(n.text)}\n`,
  ).join("\n");
}

/* ── main ───────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const ffmpeg = resolveFfmpeg();
  const { chromium } = resolveChromium();
  const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));

  fs.mkdirSync(OUT, { recursive: true });
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "film-export-"));
  const cleanDir = path.join(work, "clean");
  const capDir = path.join(work, "cap");
  fs.mkdirSync(cleanDir);
  fs.mkdirSync(capDir);

  console.log(`work dir: ${work}`);
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/film/frame?t=0`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window as unknown as { __frameReady?: boolean }).__frameReady === true);

  /* score bounce first (also proves the page's modules loaded) */
  console.log("bouncing the score offline…");
  const wavB64: string = await page.evaluate(
    (d) => (window as unknown as { __renderScore: (n: number) => Promise<string> }).__renderScore(d),
    FILM_DURATION,
  );
  const scoreWav = path.join(work, "score.wav");
  fs.writeFileSync(scoreWav, Buffer.from(wavB64, "base64"));
  console.log(`score.wav: ${(fs.statSync(scoreWav).size / 1e6).toFixed(1)} MB`);

  /* frames */
  const total = FILM_DURATION * FPS;
  for (const [dir, cap] of [[cleanDir, false], [capDir, true]] as const) {
    await page.evaluate((c) => (window as unknown as { __setCap: (b: boolean) => void }).__setCap(c), cap);
    const started = Date.now();
    for (let i = 0; i < total; i += 1) {
      const t = i / FPS;
      await page.evaluate((x) => (window as unknown as { __setT: (n: number) => void }).__setT(x), t);
      await page.locator("#stage").screenshot({
        path: path.join(dir, `f${String(i).padStart(5, "0")}.png`),
        animations: "disabled",
      });
      if (i % 240 === 0) {
        const rate = (i + 1) / ((Date.now() - started) / 1000);
        console.log(`${cap ? "captioned" : "clean"} pass: ${i}/${total} frames (${rate.toFixed(1)} fps)`);
      }
    }
    console.log(`${cap ? "captioned" : "clean"} pass done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  await browser.close();

  /* srt */
  const srtPath = path.join(OUT, `${NAME}.srt`);
  fs.writeFileSync(srtPath, buildSrt());

  /* the shared audio mix: narration on top, score ducked underneath */
  const narration = path.join(ROOT, "public", "film", "narration.m4a");
  const mixArgs = (framesDir: string, outFile: string) => [
    "-y",
    "-framerate", String(FPS), "-i", path.join(framesDir, "f%05d.png"),
    "-i", narration,
    "-i", scoreWav,
    "-filter_complex",
    [
      // labeled pads are single-use: split the voice for sidechain + mix
      "[1:a]aresample=48000,apad,asplit=2[vA][vB]",
      "[2:a][vA]sidechaincompress=threshold=0.03:ratio=6:attack=8:release=450[duck]",
      "[vB][duck]amix=inputs=2:duration=longest:weights=1 0.85,alimiter=limit=0.94[mix]",
    ].join(";"),
    "-map", "0:v", "-map", "[mix]",
    "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-t", String(FILM_DURATION),
    "-movflags", "+faststart",
    outFile,
  ];

  const master = path.join(OUT, `${NAME}-master.mp4`);
  const captions = path.join(OUT, `${NAME}-captions.mp4`);
  const subtitled = path.join(OUT, `${NAME}-subtitled.mp4`);

  console.log("encoding master…");
  execFileSync(ffmpeg, mixArgs(cleanDir, master), { stdio: ["ignore", "ignore", "inherit"] });
  console.log("encoding captioned (sound-off) version…");
  execFileSync(ffmpeg, mixArgs(capDir, captions), { stdio: ["ignore", "ignore", "inherit"] });
  console.log("muxing soft subtitles…");
  execFileSync(
    ffmpeg,
    ["-y", "-i", master, "-i", srtPath, "-map", "0", "-map", "1", "-c", "copy",
      "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", subtitled],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  /* verify: every deliverable must carry BOTH streams — no silent exports */
  for (const f of [master, subtitled, captions]) {
    let info = "";
    try {
      execFileSync(ffmpeg, ["-i", f], { encoding: "utf8" });
    } catch (e) {
      info = String((e as { stderr?: string }).stderr ?? "");
    }
    const hasVideo = /Stream #0:\d+.*Video: h264/.test(info);
    const hasAudio = /Stream #0:\d+.*Audio: aac/.test(info);
    if (!hasVideo || !hasAudio) {
      throw new Error(`SILENT/BROKEN EXPORT: ${path.basename(f)} video=${hasVideo} audio=${hasAudio}`);
    }
    console.log(`${path.basename(f)}: ${(fs.statSync(f).size / 1e6).toFixed(1)} MB — video ✓ audio ✓`);
  }

  fs.rmSync(work, { recursive: true, force: true });
  console.log(`done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
