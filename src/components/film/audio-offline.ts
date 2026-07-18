// ─────────────────────────────────────────────────────────────────────────────
// audio-offline.ts — renders the film's synthesized score + sound design into
// an OfflineAudioContext, for the MP4 export pipeline. Mirrors FilmAudio's
// live scheduling (audio.ts) against an offline context: same pad voicings,
// ticks, thuds, pulse, tension drone, ambience bed and resolve chords, so the
// exported bed matches what the site plays. Runs in the browser (the export
// script calls it through window.__renderScore on /film/frame).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { AUDIO_TIMELINES, type AudioTimeline } from "./audio";

const VOICE_BRIGHT = [87.31, 130.81, 220.0, 261.63, 392.0];
const VOICE_NEUTRAL = [87.31, 130.81, 174.61, 220.0, 261.63];
const VOICE_MINOR = [73.42, 110.0, 174.61, 220.0, 293.66];
const VOICE_RESOLVE = [87.31, 130.81, 220.0, 329.63, 392.0];
const VOICE_FINAL = [87.31, 174.61, 220.0, 349.23, 523.25];
const PAD_LEVEL = 0.05;
const GLIDE = 1.6;

/** Render the full-cut score at `level` into a stereo buffer of `duration`s. */
export async function renderScoreOffline(
  duration: number,
  sampleRate = 48000,
  level = 0.4,
): Promise<AudioBuffer> {
  const tl: AudioTimeline = AUDIO_TIMELINES["90"];
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const master = ctx.createGain();
  master.gain.value = level;
  master.connect(ctx.destination);

  const at = (evT: number) => Math.max(0, evT);

  /* pad */
  const padBus = ctx.createGain();
  padBus.gain.setValueAtTime(0, 0);
  padBus.gain.linearRampToValueAtTime(PAD_LEVEL * 0.7, 1.4);
  padBus.gain.linearRampToValueAtTime(PAD_LEVEL, at(tl.warmUntil));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 950;
  lp.Q.value = 0.4;
  padBus.connect(lp);
  lp.connect(master);

  const oscs = VOICE_BRIGHT.map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(f, 0);
    osc.detune.value = (i % 2 === 0 ? 1 : -1) * 3;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.9 : 0.55;
    osc.connect(g);
    g.connect(padBus);
    osc.start(0);
    osc.stop(duration);
    return osc;
  });
  const retune = (evT: number, voice: number[]) => {
    oscs.forEach((o, i) => o.frequency.setTargetAtTime(voice[i], at(evT), GLIDE / 3));
  };
  retune(tl.warmUntil, VOICE_NEUTRAL);
  if (tl.tension) {
    retune(tl.tension[0], VOICE_MINOR);
    retune(tl.tension[1], VOICE_NEUTRAL);
  }
  if (tl.resolve !== null) retune(tl.resolve, VOICE_RESOLVE);
  if (tl.final !== null) {
    retune(tl.final, VOICE_FINAL);
    padBus.gain.setTargetAtTime(PAD_LEVEL * 1.5, at(tl.final), 0.8);
  }
  /* gentle tail-out so the file does not end on a sustained chord */
  padBus.gain.setTargetAtTime(0, duration - 1.4, 0.45);

  /* tension drone */
  if (tl.tension) {
    const [m0, m1] = tl.tension;
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 36.71;
    const dg = ctx.createGain();
    dg.gain.setValueAtTime(0, 0);
    const span = m1 - m0;
    for (let k = 0; k < 3; k += 1) {
      const swell = m0 + 0.4 + (k * span) / 3;
      dg.gain.setTargetAtTime(0.05, at(swell), 0.5);
      dg.gain.setTargetAtTime(0.004, at(swell + 1.4), 0.6);
    }
    dg.gain.setTargetAtTime(0, at(m1), 0.4);
    drone.connect(dg);
    dg.connect(master);
    drone.start(0);
    drone.stop(duration);
  }

  /* shared noise buffer */
  const noise = ctx.createBuffer(1, sampleRate / 2, sampleRate);
  {
    const d = noise.getChannelData(0);
    // deterministic pseudo-noise so exports are reproducible
    let seed = 0x9e3779b9;
    for (let i = 0; i < d.length; i += 1) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      d[i] = ((seed >>> 0) / 0xffffffff) * 2 - 1;
    }
  }

  /* office room tone */
  {
    const air = ctx.createBufferSource();
    air.buffer = noise;
    air.loop = true;
    const af = ctx.createBiquadFilter();
    af.type = "lowpass";
    af.frequency.value = 240;
    af.Q.value = 0.5;
    const ag = ctx.createGain();
    ag.gain.setValueAtTime(0, 0);
    ag.gain.linearRampToValueAtTime(0.013, 1.2);
    ag.gain.setTargetAtTime(0, duration - 1.2, 0.4);
    air.connect(af);
    af.connect(ag);
    ag.connect(master);
    air.start(0);
    air.stop(duration);
  }

  const shot = (
    evT: number, freq: number, gain: number, dur: number,
    type: BiquadFilterType = "bandpass", q = 5,
  ) => {
    if (evT < 0 || evT > duration - 0.05) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, evT);
    g.gain.exponentialRampToValueAtTime(0.0001, evT + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(evT);
    src.stop(Math.min(duration, evT + dur + 0.02));
  };

  tl.ticks.forEach((s, i) => shot(s, 2100 + (i % 3) * 240, 0.05, 0.045));
  tl.thuds.forEach((s) => {
    shot(s, 130, 0.11, 0.3, "lowpass", 0.8);
    shot(s + 0.02, 480, 0.03, 0.08);
  });
  if (tl.pulse) {
    const [p0, p1] = tl.pulse;
    for (let s = p0, i = 0; s < p1; s += 0.55, i += 1) {
      shot(s, i % 4 === 0 ? 760 : 980, i % 4 === 0 ? 0.035 : 0.022, 0.06);
    }
  }
  /* paper-movement whispers under the opening and the scatter */
  [1.9, 3.1, 6.2, 9.1, 17.3, 18.9, 20.7, 22.2].forEach((s, i) =>
    shot(s, 1500 + (i % 4) * 180, 0.02, 0.14, "bandpass", 2.4),
  );

  [tl.resolve, tl.final].forEach((s, idx) => {
    if (s === null || s > duration - 0.7) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(idx === 0 ? 523.25 : 349.23, s);
    osc.frequency.setValueAtTime(idx === 0 ? 659.25 : 523.25, s + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, s);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    osc.connect(g);
    g.connect(master);
    osc.start(s);
    osc.stop(s + 0.65);
  });

  return ctx.startRendering();
}

/** AudioBuffer → 16-bit stereo WAV bytes, base64 (for page.evaluate return). */
export function bufferToWavBase64(buf: AudioBuffer): string {
  const ch = buf.numberOfChannels;
  const len = buf.length * ch * 2;
  const ab = new ArrayBuffer(44 + len);
  const view = new DataView(ab);
  const w = (off: number, s: string) => { for (let i = 0; i < s.length; i += 1) view.setUint8(off + i, s.charCodeAt(i)); };
  w(0, "RIFF"); view.setUint32(4, 36 + len, true); w(8, "WAVE"); w(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, ch, true);
  view.setUint32(24, buf.sampleRate, true); view.setUint32(28, buf.sampleRate * ch * 2, true);
  view.setUint16(32, ch * 2, true); view.setUint16(34, 16, true); w(36, "data");
  view.setUint32(40, len, true);
  let off = 44;
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  for (let i = 0; i < buf.length; i += 1) {
    for (let c = 0; c < ch; c += 1) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      off += 2;
    }
  }
  let bin = "";
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}
