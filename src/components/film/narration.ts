// ─────────────────────────────────────────────────────────────────────────────
// narration.ts — THE film timing table. Plain data, no client dependencies:
// imported by the player (captions), the frame surface (caption burn), the
// scenes (beat constants derive from these numbers) and the MP4 export
// pipeline (SRT generation), so every surface reads one source of truth.
//
// public/film/narration.m4a (74.7s) is the uploaded recording with its
// spoken lead-in trimmed off. The wording below is the locked script,
// word for word; every `at`/`end` is that sentence's word-level timestamp
// measured in the trimmed audio (vosk small-en-us + ffmpeg silencedetect).
// ─────────────────────────────────────────────────────────────────────────────

export interface NarrationLine {
  at: number;
  end: number;
  text: string;
}

export const NARRATION: NarrationLine[] = [
  { at: 0.36, end: 2.64, text: "Data is no longer just information." },
  { at: 2.73, end: 4.41, text: "It is exposure." },
  { at: 5.07, end: 14.1, text: "For today's businesses, a single inspection can expose years of scattered records, weak controls and unanswered compliance risks." },
  { at: 14.43, end: 16.54, text: "Picture a publicly listed company." },
  { at: 16.62, end: 23.46, text: "Thousands of customer records spread across departments, buried in systems, files and everyday processes." },
  { at: 23.55, end: 25.98, text: "Valuable, yet unprotected." },
  { at: 26.31, end: 29.67, text: "This is where the 90-day inspection-ready plan begins." },
  { at: 29.79, end: 31.24, text: "Phase one, diagnose." },
  { at: 31.32, end: 34.92, text: "In just 20 days, hidden gaps are brought into the light." },
  { at: 35.13, end: 36.43, text: "Phase two, build." },
  { at: 36.51, end: 45.6, text: "From days 21 to 60, policies, logs and accountability are put firmly in place, led by a named data protection officer." },
  { at: 45.84, end: 47.86, text: "Phase three, operationalise." },
  { at: 47.94, end: 50.4, text: "Compliance moves from paper to practice." },
  { at: 50.64, end: 56.19, text: "Teams are trained, controls are lived, and a breach simulation proves the response holds." },
  { at: 56.31, end: 59.31, text: "By day 90, the business is inspection ready." },
  { at: 59.49, end: 62.7, text: "Defensible, structured and built to last." },
  { at: 62.94, end: 63.85, text: "No delays." },
  { at: 63.93, end: 65.16, text: "No surprises." },
  { at: 65.25, end: 66.48, text: "Just clarity." },
  { at: 66.63, end: 69.42, text: "And that exposed, chaotic web of data?" },
  { at: 69.51, end: 73.1, text: "It becomes controlled, organised, protected." },
];

/** The recording runs 74.7s; the film holds the brand cover to 78. */
export const FILM_DURATION = 78;
