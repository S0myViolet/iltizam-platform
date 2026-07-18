# The 90-Day Transformation — the Iltzam brand film

An 80-second narrated brand film, written, designed and animated entirely in code
(`src/components/film/`). One continuous tactile world — a company cutaway on
warm ivory paper — threaded by a physical paper ribbon that unfolds
left→right and carries the plan's printed type. The camera is a single slow
world-translate along the ribbon; it never cuts back, never resets.

The film is built around a **locked narration**, now backed by the
**recorded voiceover** at `public/film/narration.m4a` (78.3s, AAC 48 kHz).
The full cut plays the recording (with the synthesized score ducked to a bed
underneath); the same sentences run as synchronized lower-third captions —
always on, which doubles as the captioned + sound-off version. The 30s/15s
montage cuts stay caption + score only.

## The locked narration

Word-for-word; do not edit these strings. The single timing table lives at
the top of `src/components/film/BrandFilm.tsx` as
`NARRATION: { at, end, text }[]`. The `at`/`end` values below are **measured
from the recording**: ffmpeg `silencedetect` (−30 dB, ≥0.3s) located the 24
speech bursts, and the 16 sentences were aligned to them by sentence length,
preferring boundaries at the longest pauses.

| # | at–end (s) | Sentence |
|---|-----------|----------|
| 1 | 0.50–6.15 | With massive new data privacy fines looming, businesses need a rapid path to defense. |
| 2 | 6.35–7.95 | Enter the 90-day inspection-ready plan. |
| 3 | 8.71–17.60 | Take a publicly listed company holding a massive, disorganized web of highly vulnerable customer records. |
| 4 | 18.07–20.05 | Phase one, Diagnose, twenty days. |
| 5 | 20.28–29.55 | The system scans that chaotic web to uncover hidden vulnerabilities, running a gap analysis to determine exactly which regulatory licenses the company actually needs. |
| 6 | 29.94–33.25 | Phase two is Build, days twenty-one to sixty. |
| 7 | 33.41–40.05 | This constructs structural legal architecture, snapping consent registers and breach logs directly into place. |
| 8 | 40.16–49.15 | It also appoints the specific individual who takes personal legal liability for the entire framework, the Data Protection Officer. |
| 9 | 49.48–51.45 | Phase three, Operationalise. |
| 10 | 51.58–54.15 | The system transitions from theory to active defense. |
| 11 | 54.24–56.70 | Staff embed these controls into their daily workflow, |
| 12 | 56.82–59.75 | running a simulated data breach to prove the shields actually hold under pressure. |
| 13 | 59.97–62.95 | But notice the timeline stops exactly at ninety days. |
| 14 | 63.14–68.75 | The goal is assembling the final evidence pack to be fully inspection-ready, without waiting on unpredictable government approvals. |
| 15 | 68.91–72.95 | And remember that massive, incredibly vulnerable web of scattered customer records from the very beginning? |
| 16 | 73.11–76.60 | It is now a fully documented, legally protected system, permanently locked in and ready for the regulators. |

### How the visuals follow the recording

The world in `scenes.tsx` is still authored on the original 90-second master
timeline — nothing there moved. `SYNC` in `BrandFilm.tsx` pairs each recorded
sentence start with the master second that sentence was authored at, and the
full cut's window table warps the camera through those anchors
(piecewise-linear, the same machinery the 30s/15s cuts always used). The
synthesized score's event map is warped through the same anchors and its
level drops to 40% under the voice. The full cut is therefore **80 seconds**
(recording 78.3s + a brand-cover hold).

To nudge a sentence: change its `at` in `NARRATION` **and** the matching
playback value in `SYNC` — captions, camera and score all follow.

> Alignment caveat: the sentence boundaries are inferred from pause analysis,
> not from listening. Sentences 1–9 fit the read's pacing closely; the read
> speeds up noticeably from sentence 10 on, so if any caption in the last
> stretch feels early or late, adjust that row (and its `SYNC` anchor).

## The world and the ribbon

- **One continuous world.** Every scene component lives at a fixed world-x
  position; the camera (`CAM_KEYS` in `scenes.tsx`) is a monotonic keyframe
  track that translates the whole scene. `?filmt=<seconds>` renders any
  master frame as a paused still.
- **The ribbon** is the star: a layered paper band (ivory face `#f4efe2`,
  graphite `#26292e` underside, a visible paper-thickness bottom edge and a
  drop shadow). It is born at 5.5s when the leader's report physically
  unfolds into it (a match transition), then unfolds left→right for the whole
  film via a travelling fold flap (`EDGE_KEYS`). Fold creases expose the
  graphite underside at fixed positions. The leading edge decelerates and
  halts **exactly at DAY 90** (world x 6420) between 66.5–70s, leaving a
  finished end tab.
- **Printed type on the ribbon:** `DAY 1 / DAY 20 / DAY 60 / DAY 90` print as
  the fold passes each station; `DIAGNOSE / BUILD / OPERATIONALISE` print as
  each phase begins. All ribbon type is dimensional editorial type — a stone
  under-print offset beneath a graphite face (`EdType`).
- **People** are silhouette-with-rim-light figures (`Fig`): graphite fill
  with a warm rim stroke behind the fill. Recurring cast: the senior leader,
  desk workers (HR / IT / sales / finance / support), compliance, IT, and the
  DPO (bun + emerald chest chip).
- **Documents** are always the folded-corner `Doc` motif — typed paper rects
  that get copied, passed, archived. Never dots.

Palette: ivory `#efeadf` / `#e8e2d6`, graphite `#26292e`, ink blue
`#1c2740`, muted emerald `#0d6f64`, warm stone `#b9b2a6`, amber `#b0762a` and
coral `#a53b2a` as risk accents only. Grain is a low-opacity hatch pattern;
soft elliptical shadows ground every object. Forbidden and absent: glowing
networks, node maps, glass tunnels, particles, dashboards, shields/padlocks,
dark cyber voids, stick figures, per-sentence scene resets.

## Beat map (master cut, world-x in parentheses)

| Time | Beat |
|------|------|
| 0–5.5 | A report lands on the leader's desk (headlines: "New privacy obligations" / "Inspection exposure rising"); the facade fades — a cutaway reveal of the working company (x 120–760) with papers accumulating. |
| 5.5–9 | The report UNFOLDS into the ribbon (match transition, x 820); DAY 1 prints on. |
| 9–16.5 | The disorganized web (x 1040–1900): papers duplicating between desks, archive and the vendor edge; some slip behind opaque planes. Label: "A scattered web of customer data." |
| 16.5–29.5 | DIAGNOSE prints. Inspection frames — thin graphite rulers/brackets, never a light sweep — measure four real objects one at a time, each gaining a finding tag: SENSITIVE DATA / Access too broad · CROSS-BORDER TRANSFER / Review required · CONSENT EVIDENCE / Missing · RETENTION PERIOD / Undefined. Then "Data mapped · Gaps identified · Licensing requirements defined"; compliance + IT lean in reviewing. |
| 29.5–41.5 | BUILD. A diagnosed document laid on the ribbon unfolds into a floor plan; walls, a shelf and a roof beam rise; four labeled drawers snap into place: CONSENT REGISTER, BREACH LOG, PROCESSING REGISTER, RETENTION SCHEDULE; figures place papers into them. |
| 41.5–49.5 | The DPO moment: the team around a table; one figure steps to the head position; five responsibility chips (records / consent / incidents / rights / training) settle to her with connectors. DATA PROTECTION OFFICER / ACCOUNTABILITY ASSIGNED. |
| 49.5–60 | OPERATIONALISE prints; people flow through the structure: a doorway access check, a consent check before a marketing send, a retention check at the archive. "FROM POLICY TO PRACTICE" — a policy sheet folds into the doorway. |
| 60–66.5 | SIMULATED BREACH (pace up; amber, never red): one system slab tints amber, three records drift outside the outline; a coral alert dot; IT isolates (the outline closes emerald), the DPO is notified (a drawn line), the BREACH LOG drawer opens and logs it, audit-trail ticks appear. SIMULATION ACTIVE → INCIDENT CONTAINED → RESPONSE VERIFIED; the slab returns to ivory. |
| 66.5–70 | The ribbon's fold decelerates and halts EXACTLY at DAY 90; the camera settles. |
| 70–78.5 | The evidence pack: a dimensional dossier (ink-blue layered spine) assembles as figures slide papers in; nine visible tab labels: GAP ASSESSMENT, DATA INVENTORY, CONTROL REGISTER, CONSENT REGISTER, BREACH LOG, DPO APPOINTMENT, TRAINING RECORDS, SIMULATION RESULTS, AUDIT TRAIL. Stamps: EVIDENCE COMPLETE / INSPECTION-READY / DAY 90. Beyond the ribbon's end, a faint dashed path labeled "Regulator review — external timeline" continues offscreen — neutral, not negative. |
| 78.5–83 | Match-return to the opening cutaway composition (x 7080): a brief ghost of the tangled version crossfades to the ordered one. |
| 83–90 | The transformed company (owners marked with emerald role chips, drawers labeled, people working) → the dossier cover closes over the frame and its cover type becomes the brand frame: ILTZAM + "From scattered data to inspection-ready in 90 days." + "Diagnose. Build. Operationalise." |

## Architecture

- `engine.ts` — the rAF clock. Every frame is a pure function of time;
  `?filmt=` stills, cut re-timing, the poster and the reduced-motion freeze
  all come for free. Unchanged from the previous film.
- `math.ts` — pure timing helpers (`sub`, `mix`, easings). Unchanged.
- `scenes.tsx` — the world: palette, `track()` keyframes (`CAM_KEYS`,
  `EDGE_KEYS`), the ribbon, every section component, `FilmStage` (camera +
  grain + vignette + brand cover), `FilmPoster`, and the `LAYOUTS` table.
- `BrandFilm.tsx` — the player shell: poster, `NARRATION`, cut window
  tables, caption overlay, controls, audio wiring, reduced-motion still,
  orientation prop.
- `audio.ts` — the synthesized score (no files): a warm pad build 0–16,
  precise measurement ticks in Diagnose and under the dossier tabs, soft
  structural thuds (low-filtered noise) as the Build architecture and the
  DAY-90 halt land, a rhythmic pulse under Operationalise, a contained
  minor-voiced tension window at 60–66.5, resolves at 70 and 83.
- `HeroLoop.tsx` — the silent landing-hero loop.

## Formats

- **16:9 (default):** viewBox 960×540.
- **9:16:** viewBox 900×1600, the SAME world with vertical framing — one
  wrapper `<g>` transform per orientation from the `LAYOUTS` constant
  (scale 1.5, vertically centered band; the world draws full-bleed sky and
  ground so both crops are covered). `/film?ar=916` toggles it; the
  `orientation` prop on `BrandFilm` selects it programmatically.

## Cuts

Cuts are window tables mapping playback time onto master-time ranges — the
world and camera are untouched. Captions in the shorter cuts are trimmed to
full narration sentences that fit; never rewritten.

- **Full (80s)** — the sixteen `SYNC` windows warping recorded time onto the
  90s master timeline; all sixteen sentences, plus the recorded voiceover.
- **30s** — report→ribbon 0–5, web 5–10, one Diagnose finding 10–16,
  Build+DPO 16–23, Day-90+dossier 23–28, brand 28–30. Captions: sentences
  2, 3, 4, 6, 13.
- **15s** — ribbon reveal 0–4, one finding 4–7, dossier+DAY 90 7–11,
  brand 11–15. Captions: sentences 2, 4, 13.

## Hero loop

A 10-second silent seam loop of ribbon beats: the report (headlines) unfolds
into the band → DAY 1/20/60/90 print on → one inspection finding tag →
the dossier closes (EVIDENCE PACK / INSPECTION-READY / DAY 90) → the brand
line → a 1.5s crossfade back to the first frame so the wrap is invisible.
Reduced motion freezes at 5.4s.

## Poster

The ribbon crossing the company cutaway, with "THE 90-DAY INSPECTION-READY
PLAN" as dimensional editorial type, DAY 1 → DAY 90 printed on the band, and
one figure walking the plan's direction. Server-rendered (`FilmPoster`), used
by the player start frame, the landing film section and the reduced-motion
fallback.

## Review stills

`/film?filmt=<seconds>` mounts the full cut paused at that frame
(`&ar=916` for the vertical format). Since the full cut plays in
recorded-narration time, `filmt` is a recording second. Useful checkpoints:
3 (the report), 12 (the web), 25 (a Diagnose finding), 36 (the Build
drawers), 45 (the DPO), 53 (Operationalise), 58 (the contained breach),
65 (the dossier), 77 (brand).

## Voiceover note

The narration is locked copy, and the recorded read now ships at
`public/film/narration.m4a`. The full cut plays it via an `<audio>` element
that follows the film clock (start, pause, seek and mute all stay in step; a
watchdog re-snaps the element if it drifts more than 0.25s), the score ducks
to a 40% bed underneath, and the captions run over the voice as subtitles.
To replace the recording: overwrite the file, re-measure the pauses, and
update `NARRATION` + `SYNC` in `BrandFilm.tsx` (see "How the visuals follow
the recording" above).
