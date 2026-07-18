# From Exposure to Control — the Iltizam brand film

A 78-second narrated brand film, written, designed and animated entirely in
code (`src/components/film/`), following one publicly listed company as its
data environment transforms across the 90-day inspection-ready plan. One
continuous 2.5D world — warm ivory air, graphite people with a warm rim
light, ink-blue institutional surfaces, muted emerald for what is under
control, restrained amber for risk, controlled red only inside the breach
simulation. The camera makes a single monotonic move; every transition is a
travel, not a cut.

The film's clock IS the recorded narration: `public/film/narration.m4a`
(74.7s — the uploaded voiceover with its spoken lead-in trimmed off; the
brand cover holds to 78s). `narration.mp3` is the same take for browsers
without an AAC decoder.

## The narration

Word for word, the locked script; every `at`/`end` is that sentence's
word-level timestamp measured in the trimmed audio (vosk small-en-us +
ffmpeg silencedetect). The single table lives in
`src/components/film/narration.ts` and feeds the player captions, the
burned-caption frames, the scene beat constants and the exported SRT.

| # | at–end (s) | Sentence |
|---|-----------|----------|
| 1 | 0.36–2.64 | Data is no longer just information. |
| 2 | 2.73–4.41 | It is exposure. |
| 3 | 5.07–14.10 | For today's businesses, a single inspection can expose years of scattered records, weak controls and unanswered compliance risks. |
| 4 | 14.43–16.54 | Picture a publicly listed company. |
| 5 | 16.62–23.46 | Thousands of customer records spread across departments, buried in systems, files and everyday processes. |
| 6 | 23.55–25.98 | Valuable, yet unprotected. |
| 7 | 26.31–29.67 | This is where the 90-day inspection-ready plan begins. |
| 8 | 29.79–31.24 | Phase one, diagnose. |
| 9 | 31.32–34.92 | In just 20 days, hidden gaps are brought into the light. |
| 10 | 35.13–36.43 | Phase two, build. |
| 11 | 36.51–45.60 | From days 21 to 60, policies, logs and accountability are put firmly in place, led by a named data protection officer. |
| 12 | 45.84–47.86 | Phase three, operationalise. |
| 13 | 47.94–50.40 | Compliance moves from paper to practice. |
| 14 | 50.64–56.19 | Teams are trained, controls are lived, and a breach simulation proves the response holds. |
| 15 | 56.31–59.31 | By day 90, the business is inspection ready. |
| 16 | 59.49–62.70 | Defensible, structured and built to last. |
| 17 | 62.94–63.85 | No delays. |
| 18 | 63.93–65.16 | No surprises. |
| 19 | 65.25–66.48 | Just clarity. |
| 20 | 66.63–69.42 | And that exposed, chaotic web of data? |
| 21 | 69.51–73.10 | It becomes controlled, organised, protected. |

## The world (scene by scene)

World-x runs 0 → ~11,800; the camera is a focus-point track (`FX/FY/ZOOM`
keys in `scenes.tsx`), one continuous move:

1. **Exposure (0–4.4)** — close on a customer typing into a NEW CUSTOMER
   form; SUBMIT; the record flies into the company. DATA re-weights into
   EXPOSURE over a thin amber rule — the film's only warning mark.
2. **The inspection reveal (5.1–14.1)** — a passage of layers that normally
   stay hidden: 2019–2023 exports, a shared drive of copies (ACCESS: ALL
   STAFF), a processing register with empty owner cells, an expired-retention
   archive, an undocumented cross-border duct. SCATTERED RECORDS · WEAK
   CONTROLS · UNANSWERED RISKS print in the air as they pass.
3. **The company (14.4–16.5)** — pull back: a two-storey cutaway with
   reception, customer service, marketing, HR, management, IT & security,
   finance, compliance, a VACANT DPO office, storage, an external-provider
   bay — everyone working; the problem is complexity, not intention.
4. **The scatter (16.6–23.5)** — records copy, download, transfer and
   archive between departments; THOUSANDS OF RECORDS / ONE BUSINESS · MANY
   LOCATIONS.
5. **Valuable, yet unprotected (23.6–26.0)** — the pace slows: one record on
   a stand under ACCESS: ALL STAFF, an archive HELD SINCE 2016, a copy
   sliding out on the CROSS-BORDER duct.
6. **The plan (26.3–29.7)** — the record unfolds into a raised boardwalk
   with real footing that runs the rest of the film; THE 90-DAY
   INSPECTION-READY PLAN; DAY 1 prints underfoot.
7–9. **Diagnose (29.8–34.9)** — the PHASE ONE gate arches the path;
   inspection brackets with tick-rulers measure real sources; four gaps
   print beside them (ACCESS TOO BROAD · CONSENT EVIDENCE MISSING ·
   TRANSFER REVIEW REQUIRED · RETENTION UNDEFINED); compliance + IT review
   at a desk; DATA MAPPED · GAPS IDENTIFIED · REQUIREMENTS DEFINED prints
   on the path.
10–11. **Build (35.1–45.6)** — a diagnosed record is placed on the path and
   rises into a scaffold; six register drawers seat with a thud (PRIVACY
   POLICY, PROCESSING REGISTER, CONSENT REGISTER, BREACH LOG, RETENTION
   SCHEDULE, PROCESSOR AGREEMENTS) and each takes a named owner chip; a
   vendor record links to its agreement; the team gathers at a table and
   the named DPO stands — DATA PROTECTION OFFICER / APPOINTED.
12–14. **Operationalise (45.8–56.2)** — the PHASE THREE gate; a policy page
   physically turns and FROM PAPER / TO PRACTICE prints; practice stations
   (ACCESS — RESTRICTED gate, RETENTION MET archive drop, CONSENT VERIFIED
   desk); training vignettes with the DPO walking the floor; then the
   controlled breach simulation in one room — amber wash, a single red
   pulse on CUSTOMER RECORDS, IT isolates, the DPO is notified, the BREACH
   LOG updates; SIMULATION STARTED → INCIDENT CONTAINED → RESPONSE
   VERIFIED; the wash cools.
15–16. **Day 90 (56.3–62.7)** — the path halts exactly at the DAY 90 cap
   (the dashed line beyond is labelled "Regulator review — external
   timeline"); INSPECTION-READY; the evidence pack assembles its ten tabs
   (gap assessment → audit trail) while the company keeps working behind;
   DEFENSIBLE / STRUCTURED / BUILT TO LAST as index threads draw to
   records, controls, owners, evidence, review dates.
17–19. **No delays / No surprises / Just clarity (62.9–66.5)** — one
   emerald route from a control to its evidence; the leader and the DPO at
   a small READINESS ledger (three lines, three checks — never a
   dashboard); the noise thins.
20–21. **The echo and the transformation (66.6–73.1)** — the same company
   cutaway returns in its scattered state as a ghosted echo, then orders
   itself: chips settle into the CUSTOMER RECORDS — CONTROLLED rail, the
   DPO office reads APPOINTED, providers gain AGREEMENT ON FILE, access
   panels go emerald; CONTROLLED · ORGANISED · PROTECTED.
22. **Brand (73.4–78)** — the pack's spine becomes the plate: ILTIZAM,
   "From exposure to control in 90 days.", DIAGNOSE. BUILD.
   OPERATIONALISE., and the supporting line "Inspection readiness built
   around evidence, accountability and active controls."

## Architecture

- `narration.ts` — THE timing table + `FILM_DURATION` (plain data).
- `scenes.tsx` — the world: palette, camera tracks, people (parametric
  poses: sit/type/stand/walk/carry/present/review with role accents and the
  DPO badge), the reusable `Company` cutaway (`order` morphs scattered →
  controlled; `ghost` renders the echo), the plan path, the phase gates,
  every act, `FilmPoster`, `LAYOUTS` (16:9 + 9:16 via `?ar=916`).
- `engine.ts` / `math.ts` — the rAF clock and pure timing helpers
  (unchanged): every frame is a pure function of time.
- `BrandFilm.tsx` — the player: identity cut windows (playback time = master
  time = audio time), the recorded narration `<audio>` (start/pause/seek/
  mute in step, 0.25s drift watchdog), captions, 30s/15s montage cuts,
  reduced-motion fallback.
- `audio.ts` — the live synthesized score (recorded-time event map: gate
  thuds, drawer seats, inspection ticks, Operationalise pulse, breach
  tension, Day-90 resolve, brand chord, office room tone), ducked to 40%
  under the voice. `audio-offline.ts` renders the same map through an
  OfflineAudioContext for the export mix.
- `app/(public)/film/frame` — the bare export surface: `__setT`, `__setCap`,
  `__renderScore`.

## The MP4 export pipeline

`scripts/export-film.ts` (server running on :4040):

1. Loads `/film/frame`, drives `__setT(t)` at 24fps, 1920×1080 — two frame
   passes (clean + burned captions).
2. Bounces the score offline (`__renderScore` → WAV).
3. ffmpeg mixes voice + score (sidechain duck, limiter) and encodes:
   - `public/film/exports/from-exposure-to-control-master.mp4`
   - `…-subtitled.mp4` (soft mov_text English subtitles)
   - `…-captions.mp4` (burned captions, sound-off friendly; audio kept)
   - `…​.srt` (exact narration wording, ≤2 lines per cue)
4. Verifies with ffprobe that every deliverable carries BOTH h264 video and
   AAC audio — a silent export fails the script.

## Review stills

`/film?filmt=<seconds>` (player, paused) or `/film/frame?t=<seconds>`
(bare). `filmt` is a recording second. Checkpoints: 1 (the form), 3.4
(EXPOSURE), 10.5 (weak controls), 19 (the company), 24.5 (unprotected),
27.5 (the plan), 33 (the gaps), 39 (the registers), 44 (the DPO), 49
(paper→practice), 54.5 (the simulation), 57.5 (Day 90), 61 (defensible),
68 (the echo), 71.5 (the transformation), 76 (brand).

## Guardrails

No maps of glowing lines, no particles, no networks, no shields or
padlocks, no dashboards, no hackers; the breach is a controlled simulation
with a single contained red pulse; readiness is presented as evidence and
accountability, never as guaranteed legal certification (the dashed line
beyond DAY 90 stays external).
