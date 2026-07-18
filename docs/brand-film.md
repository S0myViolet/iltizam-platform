# The 90-Day Transformation — the Iltzam brand film

A ~90-second brand film, written, designed and animated entirely in code
(`src/components/film/`). One continuous tactile world — a company cutaway on
warm ivory paper — threaded by a physical paper ribbon that unfolds
left→right and carries the plan's printed type. The camera is a single slow
world-translate along the ribbon; it never cuts back, never resets.

The film is built around a **locked narration**. No recorded audio exists in
the repo, so the narration ships as synchronized lower-third captions —
always on, which doubles as the captioned + sound-off version — with a
synthesized score underneath.

## The locked narration

Word-for-word; do not edit these strings. The single timing table lives at
the top of `src/components/film/BrandFilm.tsx` as
`NARRATION: { at, end, text }[]`, commented
`// Re-time here to match the recorded VO when available.`

| # | at–end (s) | Sentence |
|---|-----------|----------|
| 1 | 0.5–5.5 | With massive new data privacy fines looming, businesses need a rapid path to defense. |
| 2 | 5.8–9.0 | Enter the 90-day inspection-ready plan. |
| 3 | 9.5–16.0 | Take a publicly listed company holding a massive, disorganized web of highly vulnerable customer records. |
| 4 | 16.5–19.5 | Phase one, Diagnose, twenty days. |
| 5 | 19.8–29.5 | The system scans that chaotic web to uncover hidden vulnerabilities, running a gap analysis to determine exactly which regulatory licenses the company actually needs. |
| 6 | 30.0–33.5 | Phase two is Build, days twenty-one to sixty. |
| 7 | 33.8–41.5 | This constructs structural legal architecture, snapping consent registers and breach logs directly into place. |
| 8 | 41.8–49.5 | It also appoints the specific individual who takes personal legal liability for the entire framework, the Data Protection Officer. |
| 9 | 50.0–52.5 | Phase three, Operationalise. |
| 10 | 52.8–56.5 | The system transitions from theory to active defense. |
| 11 | 56.8–60.0 | Staff embed these controls into their daily workflow, |
| 12 | 60.2–65.5 | running a simulated data breach to prove the shields actually hold under pressure. |
| 13 | 66.5–70.0 | But notice the timeline stops exactly at ninety days. |
| 14 | 70.3–77.5 | The goal is assembling the final evidence pack to be fully inspection-ready, without waiting on unpredictable government approvals. |
| 15 | 78.5–83.0 | And remember that massive, incredibly vulnerable web of scattered customer records from the very beginning? |
| 16 | 83.3–90.0 | It is now a fully documented, legally protected system, permanently locked in and ready for the regulators. |

When a recorded voiceover is supplied, re-time the `at`/`end` values in that
one table to the read — captions, the master cut and both short cuts pick the
change up automatically. Nothing else needs to move.

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

- **90s master** — one window (0–90 → 0–90), all sixteen sentences.
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

`/film?filmt=<seconds>` mounts the master cut paused at that frame
(`&ar=916` for the vertical format). Useful checkpoints: 3 (the report),
12 (the web), 24 (a Diagnose finding), 37 (the Build drawers), 46 (the DPO),
58 (Operationalise), 63 (the contained breach), 72 (the dossier), 86 (brand).

## Voiceover note

The narration is locked copy. The film is timed to a natural ad read of it;
when a recorded VO is produced, drop the audio in, re-time the `NARRATION`
table to the actual read, and the captions become subtitles over the voice —
nothing else in the film needs to change.
