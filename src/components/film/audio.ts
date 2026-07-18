// ─────────────────────────────────────────────────────────────────────────────
// audio.ts — "The 90-Day Transformation" score, synthesized in the browser.
//
// No files, no samples: a warm pad (detuned triangles through a low-pass),
// a shared noise buffer for one-shots, and an event timeline per cut.
// The map: a warm build under the opening and the ribbon reveal (0–16),
// precise measurement ticks through Diagnose, soft structural thuds (low
// filtered noise) as the Build architecture snaps into place, a rhythmic
// pulse under Operationalise, a contained minor-voiced tension window for
// the simulated breach (60–66.5), a resolve chord as the evidence pack
// begins at 70, and a final warm resolve at 83 under the transformed
// company and the brand cover.
//
// Everything is scheduled against AudioContext time from an arbitrary start
// offset, so play/seek/cut-switching all work: events before the offset are
// skipped, the pad voicing is fast-forwarded to whatever the offset implies.
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioTimeline {
  /** Pad voicing is bright (the warm build) until this second. */
  warmUntil: number;
  /** The contained-tension window (the simulated breach): minor + low drone. */
  tension: [number, number] | null;
  /** Precise measurement / insertion ticks (Diagnose, dossier tabs). */
  ticks: number[];
  /** Soft structural thuds — walls, drawers, the halt at DAY 90. */
  thuds: number[];
  /** Rhythmic soft pulse window (Operationalise). */
  pulse: [number, number] | null;
  /** The resolve chord (the evidence pack begins). */
  resolve: number | null;
  /** The final warm chord (the transformed company → brand cover). */
  final: number | null;
}

/** Full cut — authored in recorded-narration time (same clock as scenes). */
const TL_90: AudioTimeline = {
  warmUntil: 14.4, // the opening + the passage of layers
  tension: [53.19, 55.9], // the controlled breach simulation
  ticks: [
    31.6, 32.3, 33.0, 33.7, // Diagnose inspection frames
    57.4, 57.9, 58.4, 58.9, 59.4, 59.9, 60.4, 60.9, // evidence-pack tabs
  ],
  thuds: [
    29.9, 35.25, 45.95, // the three phase gates rise
    36.9, 37.7, 38.5, 39.3, 40.1, 40.9, // register drawers seat
    56.5, // the DAY 90 halt
  ],
  pulse: [47.9, 53.1], // Operationalise in daily use
  resolve: 57.0, // the evidence pack begins
  final: 74.1, // the brand plate
};

/** 30s cut — beats re-timed through its window table. */
const TL_30: AudioTimeline = {
  warmUntil: 9,
  tension: null,
  ticks: [12.8, 13.6, 14.4, 15.2],
  thuds: [9.2, 12.5, 16.6, 17.4, 18.2, 20.6],
  pulse: null,
  resolve: 21.0,
  final: 27.2,
};

/** 15s cut — the essentials only. */
const TL_15: AudioTimeline = {
  warmUntil: 3.5,
  tension: null,
  ticks: [4.2, 5.0, 5.8, 6.6],
  thuds: [3.8, 7.3],
  pulse: null,
  resolve: 7.6,
  final: 12.0,
};

export const AUDIO_TIMELINES: Record<"90" | "30" | "15", AudioTimeline> = {
  "90": TL_90,
  "30": TL_30,
  "15": TL_15,
};

/* Pad voicings (Hz). F-rooted, warm. */
const VOICE_BRIGHT = [87.31, 130.81, 220.0, 261.63, 392.0]; // F2 C3 A3 C4 G4 — add9 air
const VOICE_NEUTRAL = [87.31, 130.81, 174.61, 220.0, 261.63]; // F2 C3 F3 A3 C4
const VOICE_MINOR = [73.42, 110.0, 174.61, 220.0, 293.66]; // D2 A2 F3 A3 D4 — contained
const VOICE_RESOLVE = [87.31, 130.81, 220.0, 329.63, 392.0]; // F2 C3 A3 E4 G4 — maj7
const VOICE_FINAL = [87.31, 174.61, 220.0, 349.23, 523.25]; // F2 F3 A3 F4 C5

const PAD_LEVEL = 0.05;
const GLIDE = 1.6; // seconds for a voicing change to settle

export class FilmAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private live: { stop: (when: number) => void }[] = [];
  private noise: AudioBuffer | null = null;
  private muted = false;
  private level = 1;

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.level, this.ctx.currentTime, 0.05);
    }
  }

  /** Overall score level — sits back to a bed under recorded narration. */
  setLevel(v: number): void {
    this.level = v;
    if (this.master && this.ctx && !this.muted) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  /** Start the timeline from `offset` seconds. Must be called from a gesture. */
  start(tl: AudioTimeline, offset: number): void {
    this.stop();
    const AC: typeof AudioContext | undefined =
      typeof window !== "undefined"
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext)
        : undefined;
    if (!AC) return;
    const ctx = (this.ctx ??= new AC());
    void ctx.resume();

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : this.level;
    master.connect(ctx.destination);
    this.master = master;

    const now = ctx.currentTime + 0.05;
    const at = (evT: number) => now + (evT - offset);

    /* ── the pad — the warm build ────────────────────────────────────── */
    const padBus = ctx.createGain();
    padBus.gain.setValueAtTime(0, now);
    /* swell in, then keep building gently until warmUntil */
    padBus.gain.linearRampToValueAtTime(PAD_LEVEL * 0.7, now + 1.4);
    if (tl.warmUntil > offset) {
      padBus.gain.linearRampToValueAtTime(PAD_LEVEL, at(tl.warmUntil));
    } else {
      padBus.gain.setValueAtTime(PAD_LEVEL, now + 1.4);
    }
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 950;
    lp.Q.value = 0.4;
    padBus.connect(lp);
    lp.connect(master);

    /* the voicing in force at a given master second */
    const voicingAt = (s: number): number[] => {
      if (tl.final !== null && s >= tl.final) return VOICE_FINAL;
      if (tl.resolve !== null && s >= tl.resolve) return VOICE_RESOLVE;
      if (tl.tension && s >= tl.tension[0] && s < tl.tension[1]) return VOICE_MINOR;
      if (s < tl.warmUntil) return VOICE_BRIGHT;
      return VOICE_NEUTRAL;
    };

    const initial = voicingAt(offset);
    this.padOscs = initial.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(f, now);
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * 3;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.9 : 0.55;
      osc.connect(g);
      g.connect(padBus);
      osc.start(now);
      return osc;
    });
    const retune = (evT: number, voice: number[]) => {
      if (evT < offset) return;
      this.padOscs.forEach((o, i) => {
        o.frequency.setTargetAtTime(voice[i], at(evT), GLIDE / 3);
      });
    };
    retune(tl.warmUntil, VOICE_NEUTRAL);
    if (tl.tension) {
      retune(tl.tension[0], VOICE_MINOR);
      retune(tl.tension[1], VOICE_NEUTRAL);
    }
    if (tl.resolve !== null) retune(tl.resolve, VOICE_RESOLVE);
    if (tl.final !== null) {
      retune(tl.final, VOICE_FINAL);
      if (tl.final >= offset) {
        padBus.gain.setTargetAtTime(PAD_LEVEL * 1.5, at(tl.final), 0.8);
      }
    }
    this.live.push({
      stop: (when) => {
        padBus.gain.setTargetAtTime(0, when, 0.15);
        this.padOscs.forEach((o) => o.stop(when + 0.8));
      },
    });

    /* ── contained low drone inside the tension window ───────────────── */
    if (tl.tension && tl.tension[1] > offset) {
      const drone = ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.value = 36.71; // D1
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0, now);
      const [m0, m1] = tl.tension;
      const span = m1 - m0;
      for (let k = 0; k < 3; k += 1) {
        const swell = m0 + 0.4 + (k * span) / 3;
        if (swell + 1.2 < offset) continue;
        dg.gain.setTargetAtTime(0.05, at(Math.max(swell, offset)), 0.5);
        dg.gain.setTargetAtTime(0.004, at(Math.max(swell + 1.4, offset)), 0.6);
      }
      dg.gain.setTargetAtTime(0, at(Math.max(m1, offset)), 0.4);
      drone.connect(dg);
      dg.connect(master);
      drone.start(now);
      this.live.push({ stop: (when) => drone.stop(when + 0.6) });
    }

    /* ── noise-based one-shots ───────────────────────────────────────── */
    const noise = (this.noise ??= (() => {
      const buf = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
      return buf;
    })());

    const shot = (
      evT: number,
      freq: number,
      gain: number,
      dur: number,
      type: BiquadFilterType = "bandpass",
      q = 5,
    ) => {
      if (evT < offset) return;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      const t0 = at(evT);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      this.live.push({ stop: (when) => src.stop(Math.max(when, t0)) });
    };

    /* office room tone — a barely-there air bed under everything */
    {
      const air = ctx.createBufferSource();
      air.buffer = noise;
      air.loop = true;
      const af = ctx.createBiquadFilter();
      af.type = "lowpass";
      af.frequency.value = 240;
      af.Q.value = 0.5;
      const ag = ctx.createGain();
      ag.gain.setValueAtTime(0, now);
      ag.gain.linearRampToValueAtTime(0.013, now + 1.2);
      air.connect(af);
      af.connect(ag);
      ag.connect(master);
      air.start(now);
      this.live.push({ stop: (when) => { ag.gain.setTargetAtTime(0, when, 0.2); air.stop(when + 0.8); } });
    }

    /* precise measurement / insertion ticks */
    tl.ticks.forEach((s, i) => shot(s, 2100 + (i % 3) * 240, 0.05, 0.045));

    /* structural thuds — low filtered noise, soft */
    tl.thuds.forEach((s) => {
      shot(s, 130, 0.11, 0.3, "lowpass", 0.8);
      shot(s + 0.02, 480, 0.03, 0.08); // a small knock transient on top
    });

    /* the rhythmic pulse under Operationalise */
    if (tl.pulse) {
      const [p0, p1] = tl.pulse;
      for (let s = p0, i = 0; s < p1; s += 0.55, i += 1) {
        shot(s, i % 4 === 0 ? 760 : 980, i % 4 === 0 ? 0.035 : 0.022, 0.06);
      }
    }

    /* the resolve and final chords ring as two-tone confirmations */
    [tl.resolve, tl.final].forEach((s, idx) => {
      if (s === null || s < offset) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const t0 = at(s);
      osc.frequency.setValueAtTime(idx === 0 ? 523.25 : 349.23, t0);
      osc.frequency.setValueAtTime(idx === 0 ? 659.25 : 523.25, t0 + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.65);
      this.live.push({ stop: (when) => osc.stop(Math.max(when, t0)) });
    });
  }

  stop(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const when = ctx.currentTime;
    if (this.master) {
      this.master.gain.setTargetAtTime(0, when, 0.08);
    }
    this.live.forEach((n) => {
      try {
        n.stop(when + 0.3);
      } catch {
        /* already stopped */
      }
    });
    this.live = [];
    this.padOscs = [];
    this.master = null;
  }

  dispose(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}
