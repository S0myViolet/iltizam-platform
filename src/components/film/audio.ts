// ─────────────────────────────────────────────────────────────────────────────
// audio.ts — "After Submit" sound, synthesized in the browser.
//
// No files, no samples: a warm pad (detuned triangles through a low-pass),
// a shared noise buffer for ticks, and an event timeline per cut. The pad
// carries the emotional line — brighter voicing while life moves forward
// (0–19), a minor voicing with a sparse low drone under the request (26–33),
// a resolve at the decision, a final warm chord under the brand frame.
// Diegetic sounds are tiny: keyboard ticks, one soft submit click, a camera
// flash, two notification ticks, two deliberate decision clicks.
//
// Everything is scheduled against AudioContext time from an arbitrary start
// offset, so play/seek/cut-switching all work: events before the offset are
// skipped, the pad voicing is fast-forwarded to whatever the offset implies.
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioTimeline {
  /** Pad voicing is bright until this second, then eases to neutral. */
  brightUntil: number;
  /** The uncertainty window: minor voicing + sparse low drone. */
  minor: [number, number] | null;
  /** Keyboard typing ticks between these seconds. */
  keys: [number, number] | null;
  /** Soft single UI ticks: the submit click and the two decision clicks. */
  clicks: number[];
  /** Camera-flash soft noise burst. */
  flash: number | null;
  /** Notification two-tone ticks. */
  notifs: number[];
  /** The resolve chord (the decision lands). */
  resolve: number | null;
  /** The final warm chord under the brand frame. */
  final: number | null;
}

/** Master cut (48s) — the authored sound map. */
const TL_48: AudioTimeline = {
  brightUntil: 19,
  minor: [26, 33],
  keys: [2.5, 3.2],
  clicks: [3.2, 38.6, 39.8],
  flash: 10.5,
  notifs: [26.2, 41.8],
  resolve: 42,
  final: 45.5,
};

/** 30s cut — beats re-timed through its window table. */
const TL_30: AudioTimeline = {
  brightUntil: 11,
  minor: [11, 17],
  keys: [0.45, 1.0],
  clicks: [1.0, 22.3, 23.4],
  flash: 6.35,
  notifs: [11.2, 25.0],
  resolve: 25.2,
  final: 28.0,
};

/** 15s cut — the essentials only. */
const TL_15: AudioTimeline = {
  brightUntil: 4,
  minor: [4, 7.5],
  keys: [0.4, 1.26],
  clicks: [1.26, 10.5, 11.1],
  flash: null,
  notifs: [4.2],
  resolve: 12.4,
  final: 13.5,
};

export const AUDIO_TIMELINES: Record<"48" | "30" | "15", AudioTimeline> = {
  "48": TL_48,
  "30": TL_30,
  "15": TL_15,
};

/* Pad voicings (Hz). F-rooted, warm. */
const VOICE_BRIGHT = [87.31, 130.81, 220.0, 261.63, 392.0]; // F2 C3 A3 C4 G4 — add9 air
const VOICE_NEUTRAL = [87.31, 130.81, 174.61, 220.0, 261.63]; // F2 C3 F3 A3 C4
const VOICE_MINOR = [73.42, 110.0, 174.61, 220.0, 293.66]; // D2 A2 F3 A3 D4
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

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
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
    master.gain.value = this.muted ? 0 : 1;
    master.connect(ctx.destination);
    this.master = master;

    const now = ctx.currentTime + 0.05;
    const at = (evT: number) => now + (evT - offset);

    /* ── the pad ─────────────────────────────────────────────────────── */
    const padBus = ctx.createGain();
    padBus.gain.setValueAtTime(0, now);
    padBus.gain.linearRampToValueAtTime(PAD_LEVEL, now + 1.4);
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
      if (tl.minor && s >= tl.minor[0] && s < tl.minor[1]) return VOICE_MINOR;
      if (s < tl.brightUntil) return VOICE_BRIGHT;
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
    retune(tl.brightUntil, VOICE_NEUTRAL);
    if (tl.minor) {
      retune(tl.minor[0], VOICE_MINOR);
      retune(tl.minor[1], VOICE_NEUTRAL);
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

    /* ── sparse low drone inside the minor window ────────────────────── */
    if (tl.minor && tl.minor[1] > offset) {
      const drone = ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.value = 36.71; // D1
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0, now);
      const [m0, m1] = tl.minor;
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

    const tick = (evT: number, freq: number, gain: number, dur: number) => {
      if (evT < offset) return;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = 5;
      const g = ctx.createGain();
      const t0 = at(evT);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      this.live.push({ stop: (when) => src.stop(Math.max(when, t0)) });
    };

    /* keyboard typing */
    if (tl.keys) {
      const [k0, k1] = tl.keys;
      for (let s = k0, i = 0; s < k1; s += 0.09, i += 1) {
        tick(s, 2400 + (i % 3) * 260, 0.035, 0.03);
      }
    }
    /* the submit click and the two deliberate decision clicks */
    tl.clicks.forEach((c) => tick(c, 1500, 0.08, 0.05));

    /* camera flash — a soft, wider noise burst */
    if (tl.flash !== null && tl.flash >= offset) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      const t0 = at(tl.flash);
      lpf.frequency.setValueAtTime(4200, t0);
      lpf.frequency.exponentialRampToValueAtTime(380, t0 + 0.18);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.07, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      src.connect(lpf);
      lpf.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + 0.25);
      this.live.push({ stop: (when) => src.stop(Math.max(when, t0)) });
    }

    /* notification ticks — two rising tones */
    tl.notifs.forEach((n) => {
      if (n < offset) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const t0 = at(n);
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.setValueAtTime(1174.7, t0 + 0.09);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.045, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.26);
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
