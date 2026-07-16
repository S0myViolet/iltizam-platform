"use client";

/**
 * FilmAudio — a fully synthesized, generative WebAudio score for the film.
 *
 * OFF by default; start() must be called from a user gesture. The score is
 * scheduled from the film clock: BrandFilm calls update(t) every frame and
 * one-shot events fire when t crosses their timestamp. Seeking clears/rebuilds
 * the pending-event set so nothing double-fires or machine-guns after a scrub.
 *
 * Everything is quiet and restrained: a warm ambient pad, sparse piano-like
 * plucks, a low tension drone under the risk act, and tiny diegetic details.
 */

const dB = (v: number): number => Math.pow(10, v / 20);

type ScoreEvent = { time: number; fire: (a: FilmAudio, when: number) => void };

/* Note frequencies used by the motif. */
const N = {
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
  A4: 440.0,
  D5: 587.33,
  E5: 659.26,
  F5: 698.46,
} as const;

/* Pad chords as [root, colour-tone] dyads — one change per ~8s.
   Dm9 → B♭maj7 → F → C(add9)-ish. */
const CHORDS: ReadonlyArray<readonly [number, number]> = [
  [73.42, 164.81], // D2 + E3  (Dm9 flavour)
  [116.54, 220.0], // Bb2 + A3 (Bbmaj7)
  [87.31, 130.81], // F2 + C3
  [65.41, 196.0], // C2 + G3
];

function buildEvents(): ScoreEvent[] {
  const ev: ScoreEvent[] = [];

  // (b) sparse piano-like plucks — gentle motif, scenes 1–2 and 6–7.
  const motif: Array<[number, number]> = [
    [1.2, N.D5],
    [3.4, N.F5],
    [5.8, N.A4],
    [8.6, N.E5],
    [11.4, N.D5],
    [14.2, N.A4],
    [45.0, N.D5],
    [49.4, N.F5],
    [52.6, N.A4],
    [55.2, N.E5],
    [57.6, N.D5],
    [59.0, N.A4],
  ];
  for (const [time, freq] of motif) {
    ev.push({ time, fire: (a, when) => a.pluck(when, freq, dB(-24)) });
  }

  // (d) soft keyboard ticks around 8–14s.
  for (const time of [8.2, 8.9, 9.3, 10.5, 11.1, 11.6, 12.4, 13.2, 13.7]) {
    ev.push({ time, fire: (a, when) => a.tick(when) });
  }

  // (d) one soft data pulse at ~18s.
  ev.push({ time: 18, fire: (a, when) => a.dataPulse(when) });

  // (d) confirmation chime — two triangle notes a perfect fifth apart, ~47s.
  ev.push({
    time: 47,
    fire: (a, when) => {
      a.pluck(when, N.A4, dB(-26), "triangle");
      a.pluck(when + 0.14, N.E5, dB(-27), "triangle");
    },
  });

  // (d) warm resolve chord at ~54s.
  ev.push({
    time: 54,
    fire: (a, when) => {
      a.pluck(when, N.F4 / 2, dB(-26), "triangle", 2.4);
      a.pluck(when + 0.05, N.C4, dB(-28), "triangle", 2.4);
      a.pluck(when + 0.1, N.A4, dB(-29), "triangle", 2.4);
    },
  });

  return ev.sort((x, y) => x.time - y.time);
}

export class FilmAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muteGain: GainNode | null = null;
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private events: ScoreEvent[] = buildEvents();
  private fired: Set<number> = new Set();
  private lastT = 0;
  private chordIndex = -1;
  private droneOn = false;
  private muted = false;
  private active = false;

  /** Start (or resume) the score, synced to film time t. User gesture only. */
  start(t: number): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.buildGraph();
    }
    void this.ctx.resume();
    this.active = true;
    this.resync(t);
  }

  stop(): void {
    this.active = false;
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx && this.muteGain) {
      this.muteGain.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Call every frame with film time t; fires events crossed since last call. */
  update(t: number): void {
    if (!this.ctx || !this.active) return;
    // A scrub/seek (backwards, or a big forward jump) clears pending events.
    if (t < this.lastT - 0.05 || t > this.lastT + 0.6) {
      this.resync(t);
      return;
    }
    const now = this.ctx.currentTime;
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i];
      if (e.time > t) break;
      if (e.time > this.lastT && !this.fired.has(i)) {
        this.fired.add(i);
        e.fire(this, now + 0.01);
      }
    }
    this.updateContinuous(t);
    this.lastT = t;
  }

  /* ── internals ─────────────────────────────────────────────────────── */

  private resync(t: number): void {
    this.lastT = t;
    this.fired = new Set(this.events.map((e, i) => (e.time <= t ? i : -1)).filter((i) => i >= 0));
    this.updateContinuous(t, true);
  }

  private updateContinuous(t: number, hard = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // (a) pad chord changes, one per ~8s.
    const idx = Math.floor(t / 8) % CHORDS.length;
    if (idx !== this.chordIndex) {
      this.chordIndex = idx;
      const [root, colour] = CHORDS[idx];
      const glide = hard ? 0.05 : 1.6;
      this.padOsc1?.frequency.setTargetAtTime(root, now, glide);
      this.padOsc2?.frequency.setTargetAtTime(colour, now, glide);
    }

    // (c) low tension drone, ONLY 16s–34s.
    const wantDrone = t >= 16 && t < 34;
    if (wantDrone !== this.droneOn) {
      this.droneOn = wantDrone;
      this.droneGain?.gain.setTargetAtTime(wantDrone ? dB(-32) : 0, now, hard ? 0.05 : 1.2);
    }
  }

  private buildGraph(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.muteGain = ctx.createGain();
    this.muteGain.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.muteGain);
    this.muteGain.connect(ctx.destination);

    // (a) warm ambient pad — two detuned oscillators through a ~600Hz lowpass.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 600;
    padFilter.Q.value = 0.4;
    const padGain = ctx.createGain();
    padGain.gain.value = dB(-28);
    padFilter.connect(padGain);
    padGain.connect(this.master);

    this.padOsc1 = ctx.createOscillator();
    this.padOsc1.type = "sine";
    this.padOsc1.frequency.value = CHORDS[0][0];
    this.padOsc2 = ctx.createOscillator();
    this.padOsc2.type = "triangle";
    this.padOsc2.frequency.value = CHORDS[0][1];
    this.padOsc2.detune.value = 7; // gentle beating against osc1
    this.padOsc1.connect(padFilter);
    this.padOsc2.connect(padFilter);
    this.padOsc1.start();
    this.padOsc2.start();

    // (c) tension drone: 55Hz sine + filtered noise, gated by droneGain.
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneGain.connect(this.master);

    const droneOsc = ctx.createOscillator();
    droneOsc.type = "sine";
    droneOsc.frequency.value = 55;
    droneOsc.connect(this.droneGain);
    droneOsc.start();

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer();
    noiseSrc.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 180;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.35;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.droneGain);
    noiseSrc.start();
  }

  private getNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx as AudioContext;
    if (this.noiseBuffer) return this.noiseBuffer;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }

  /** Piano-like pluck: fast attack, exponential decay. */
  pluck(when: number, freq: number, peak: number, type: OscillatorType = "triangle", decay = 1.2): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + decay + 0.1);
  }

  /** Soft keyboard tick — a 30ms filtered noise burst. */
  tick(when: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600 + Math.random() * 800;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(dB(-34), when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(when);
    src.stop(when + 0.06);
  }

  /** One soft data pulse — sine blip 880→440Hz. */
  dataPulse(when: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, when);
    osc.frequency.exponentialRampToValueAtTime(440, when + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(dB(-30), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    osc.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + 0.6);
  }
}
