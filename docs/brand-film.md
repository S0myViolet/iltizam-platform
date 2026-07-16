# WHAT YOU DON'T SEE

**A 60-second brand film for Iltizam — creative bible, v1.0 (production-locked)**
Client: Iltizam · Automated data protection monitoring (EG-PDPL + EU-GDPR, deterministic rules, human review)
Medium: hand-choreographed SVG animation shipped inside the public website. Not a product demo. A film.
Governing truth constraint: monitoring is deterministic rules plus human review — never AI magic. The film must remain fully understandable with sound muted.

---

## 1. Final creative concept

**Title:** *What You Don't See*
**Logline:** Beneath the ordinary morning of an ordinary business, personal data is quietly moving — and some of it is moving wrong. The film descends below the surface of work, shows the movement itself, and returns with one change: now somebody can see it, and a named person decides what to do.
**Core message:** You can't act on what you can't see. Iltizam makes data movement visible — with rules you can read and a human on every finding — so a business can act with confidence.

**Emotional progression (the seven stages, one per scene):**

1. **Familiarity** — a dawn office everyone recognizes. Nothing is wrong. Nothing is dramatized.
2. **Trust** — the daily work: files, payroll, a contract. People hand data over because they trust the business.
3. **Invisible complexity** — the camera drops beneath the floor of the work into dark space: the data threads were always there.
4. **Growing tension** — some threads fray, duplicate, escape, cross a border, go stale. Structural wrongness, never horror. The viewer leans in; nobody screams.
5. **Clarity** — a quiet teal order passes through the tangle. Findings surface as small parchment records, not dashboards.
6. **Human control** — a person — not a system — reads the finding, and a name is put against the risk.
7. **Confidence** — back in the office, the light has turned to plain daylight. The window becomes the brand frame.

**Why the film never shows the product first:** the product's entire value is a *change in perception*. If we open on software, we sell software. By opening on a familiar morning and earning the descent into what the audience has never seen, the product arrives as the answer to a feeling the film has already created — and it arrives small: a parchment card and a person's name, exactly as modest and exactly as decisive as the real product. Fear imagery is banned for the same reason: Iltizam's promise is composure, so the film must be composed.

---

## 2. Scene-by-scene storyboard — 60-second master

Stage is a fixed SVG `viewBox="0 0 1600 900"`. All camera moves are transforms of the world group; the frame never cuts hard except where noted.

### S1 · 0–7s · "Morning" — familiarity
- **Intent:** establish the world as safe, ordinary, dignified. Zero threat.
- **Action:** charcoal office at dawn. A tall window plane throws warm #e8dcc4 light across architectural planes (#23262c / #2c3038 / #343943). Two silhouette figures arrive: one places a cup on a desk (a real, weighted posture beat), one leans toward a screen. Breathing scale 1±0.004, one slow head turn. No data threads yet — one faint teal thread ghosts at 8% opacity, subliminal.
- **Data-thread behavior:** withheld. The absence is the setup.
- **Camera:** single slow push-in from wide (scale 1.00 → 1.06 over 7s, easeInOut).
- **Sound:** near-silence; low pad fades in at −24 LU; room-tone shimmer.
- **Caption/VO:** *"Every morning, a business wakes up and begins to move."*

### S2 · 7–14s · "The work" — trust
- **Intent:** show the data being *given* — trust as an action, not a word.
- **Action:** closer on the desks. The HR figure drags a document rectangle across a screen toward a quiet rounded-rect labeled `SHARED`; a `PAYROLL` rect pulses once as a run completes; a contract document slides toward `MAIL`. A third silhouette (the applicant) hands a document across a desk — the handover beat.
- **Data-thread behavior:** the dragged document leaves a faint teal wake — the first visible thread, born from a human gesture.
- **Camera:** gentle lateral glide right (translateX −60px over 7s), still one continuous take.
- **Sound:** keyboard ticks ~8–14s (sparse, humanly irregular); pad holds; a single soft piano note at 9.5s.
- **Caption/VO:** *"Files open. Payroll runs. A contract goes out for signature."*

### S3 · 14–22s · "Beneath" — invisible complexity
- **Intent:** the reveal. The office was the surface; this is the circulatory system.
- **Action:** the camera follows the cursor-drag thread down through the desk plane. The office dims to faint outlines above; dark space (#131518 → #1c1f24) opens below. A field of long teal bezier threads (#6fa39c, opacity .35–.7, strokeWidth 1.2–2, dash "2 14", slow dashoffset flow) runs between quiet system rects: `HR DRIVE`, `PAYROLL`, `SHARED`, `MAIL`, `CLOUD`, `VENDOR` — mono labels #6b6f76, 11px, .08em tracking. Everything flows correctly. It is beautiful, not sinister.
- **Data-thread behavior:** SAFE threads only — long smooth curves, steady flow, staggered births.
- **Camera:** vertical descent (translateY, 14–16s) settling into a slow drift; the follow-the-thread move begins here.
- **Sound:** the data pulse at ~18s — one low sine swell as the full field is revealed; pad widens.
- **Caption/VO:** *"And underneath all of it — something you don't see. Data, moving."* then *"Most of it flows exactly where it should."*

### S4 · 22–33s · "The fray" — growing tension
- **Intent:** the five risks, shown structurally — the geometry itself goes wrong. No icons, no alarms.
- **Action & data-thread behavior,** one behavior at a time, each given room:
  - **22.0–24.5 · Fraying:** one thread splits into three diverging amber (#b0762a) strands mid-flight.
  - **24.5–26.5 · Duplication:** a thread grows two ghost copies offset 3–6px at 30% opacity, drifting slightly out of register.
  - **26.5–29.0 · Exposure:** a thread slips through a gap in the `SHARED` rounded-rect outline and continues outside its system.
  - **29.0–31.0 · Distance:** a thread crosses a faint vertical border line and continues off-frame right, unbroken.
  - **31.0–33.5 · Staleness:** a thread coils into a static spiral near `HR DRIVE`; its flow stops; it dims to 20%.
- **Camera:** the follow-the-thread glide tracks the fraying thread, then hands off to each behavior with small reframes — never a whip pan.
- **Sound:** a low tension drone enters under the pad at 22s and thickens by degrees; the staleness beat is nearly silent.
- **Caption/VO:** *"But some of it frays. Some of it quietly copies itself."* / *"Some of it slips outside the walls built to hold it, or crosses a border no one meant it to cross."* / *"And some of it simply sits — forgotten, and still yours to protect."*

### S5 · 33–43s · "Seen" — clarity
- **Intent:** Iltizam arrives as *perception*, not machinery. Deterministic order, calmly applied.
- **Action:** a thin teal comb — a soft vertical sweep of #6fa39c at 10% — passes left to right through the tangle. Threads settle into ordered lanes; the amber fray crossfades to a single teal line. As each risk is combed, a small parchment card (#efeadf, ink #141927, thin left rail) fades in at slight perspective (`skewY(-2deg) scale(0.9)`), floating in the dark space: the company card, then the two finding cards (gold rails). Cards are diegetic panels — never a full-screen dashboard.
- **Data-thread behavior:** morph from scattered curves to lanes (staggered easeInOut); flow rate steadies and synchronizes.
- **Camera:** pulls back just enough to hold three cards and the ordered field in one composition.
- **Sound:** the drone resolves out; piano returns with a two-note figure; the comb has a barely-audible airy sweep.
- **Caption/VO:** *"You can't act on what you can't see."* then *"Iltizam watches the movement itself — deterministic rules, mapped to Egypt's PDPL and the GDPR — and brings every finding to a person."*

### S6 · 43–52s · "The decision" — human control
- **Intent:** the product's soul: a human reads, a human decides, a name is attached.
- **Action:** the camera rises back through the plane to the office. The DPO silhouette leans toward a screen — deliberate, capable posture, a small confirming nod (head-turn arc, 2°). The evidence card and the owner card appear beside the screen; at ~47s the confirmation chime lands exactly as *"Owner assigned — Omar Fathy"* fades in. The last tangled amber line in the background straightens to teal in sync with the chime.
- **Data-thread behavior:** the straightening line is the scene's only thread event — resolution as geometry.
- **Camera:** slow rise + settle; then locked off for the decision beat. Stillness is the point.
- **Sound:** confirmation chime ~47s (two notes, struck softly); pad warms.
- **Caption/VO:** *"Automated finding. Human review. A name against every risk."*

### S7 · 52–60s · "Morning, again" — confidence
- **Intent:** same office, changed light, changed posture. Then the brand.
- **Action:** the camera drifts to the window. Dawn #e8dcc4 has become neutral daylight #d9d5cb. The window's reflection on the desk gathers into the ILTZAM certificate tile (the film's only gold #ab8434 beyond card rails); the window frame match-morphs into the brand frame rectangle. Wordmark `ILTZAM` (tracked serif, per `src/components/Wordmark.tsx`), then *"See what matters."* / *"Act with confidence."*, then the secondary line.
- **Data-thread behavior:** one safe teal thread continues flowing through the bottom of the brand frame — the world keeps working.
- **Camera:** the window-becomes-brand-frame move: glide + scale until the window mullions align with the frame border, then a 1.6s morph. Full stop at 58s.
- **Sound:** resolve at ~54s — the pad lands on its home chord (add9), piano final note, 2s tail into silence.
- **Caption/VO:** *"See what matters. Act with confidence."* then *"Iltizam. Automated data protection monitoring, built around human review."*

---

## 3. Voiceover script (verbatim — client-approved)

This is the approved script as shipped and as published in the on-site transcript (`src/app/(public)/film/page.tsx`). It supersedes the v2 draft opening (*"Every business begins with trust."*); the trust beat now lives in S1–S2's imagery rather than the narration. No word may be altered without client sign-off.

> Every morning, a business wakes up and begins to move.
>
> Files open. Payroll runs. A contract goes out for signature.
>
> And underneath all of it — something you don't see. Data, moving.
>
> Most of it flows exactly where it should.
>
> But some of it frays. Some of it quietly copies itself.
>
> Some of it slips outside the walls built to hold it, or crosses a border no one meant it to cross.
>
> And some of it simply sits — forgotten, and still yours to protect.
>
> You can't act on what you can't see.
>
> Iltizam watches the movement itself — deterministic rules, mapped to Egypt's PDPL and the GDPR — and brings every finding to a person.
>
> Automated finding. Human review. A name against every risk.
>
> See what matters. Act with confidence.
>
> Iltizam. Automated data protection monitoring, built around human review.

Delivery: measured, low, unhurried — a documentarian, not an announcer. No urgency read anywhere; the tension is carried by the score and the geometry.

---

## 4. On-screen copy inventory

### 4.1 Caption cues (60s master)

Captions are the VO text, display serif (`var(--font-display, Georgia)`, fallback Georgia / 'Times New Roman' / serif), #e8e2d6, centered lower third, max-width 44ch, fade + 4px rise in (0.45s), gentle fade out (0.5s). Captions default ON.

| # | In | Out | Line |
|---|------|------|------|
| 1 | 0.8 | 6.2 | Every morning, a business wakes up and begins to move. |
| 2 | 7.6 | 13.4 | Files open. Payroll runs. A contract goes out for signature. |
| 3 | 14.8 | 18.8 | And underneath all of it — something you don't see. Data, moving. |
| 4 | 19.2 | 21.8 | Most of it flows exactly where it should. |
| 5 | 22.6 | 26.4 | But some of it frays. Some of it quietly copies itself. |
| 6 | 26.8 | 30.9 | Some of it slips outside the walls built to hold it, or crosses a border no one meant it to cross. |
| 7 | 31.4 | 35.0 | And some of it simply sits — forgotten, and still yours to protect. |
| 8 | 35.6 | 38.2 | You can't act on what you can't see. |
| 9 | 38.8 | 43.8 | Iltizam watches the movement itself — deterministic rules, mapped to Egypt's PDPL and the GDPR — and brings every finding to a person. |
| 10 | 45.0 | 49.6 | Automated finding. Human review. A name against every risk. |
| 11 | 52.6 | 56.2 | See what matters. Act with confidence. |
| 12 | 56.6 | 59.6 | Iltizam. Automated data protection monitoring, built around human review. |

Cues 7 and 9 deliberately bridge scene boundaries — captions may cross cuts; imagery may not interrupt a caption.

### 4.2 Product glimpse cards (S5–S6 only; exact strings, no substitutes)

Parchment #efeadf, ink #141927, 12–13px, mono for rule codes, thin left rail (gold #ab8434 = open finding, teal #0d6f64 = context/resolution). Each card unique — no repeated identical cards.

| Card | Scene / time | Rail | Line 1 (mono, small) | Line 2 (serif) |
|------|-------------|------|----------------------|----------------|
| A | S5 · in 36.0 | teal | Nile Digital Services | 18 data sources reviewed |
| B | S5 · in 38.5 | gold | Public sharing detected · MON-ACCESS-001 | Automated finding requiring human review. |
| C | S5 · in 40.5 | gold | Cross-border transfer review · MON-TRANSFER-001 | EG-PDPL control mapped · EG-SEC-03 |
| D | S6 · in 44.5 | teal | Evidence candidate found | — |
| E | S6 · in 47.0 | teal | Owner assigned — Omar Fathy | — |

(The silent hero loop reuses "Nile Digital Services" + "Automated finding requiring human review." on its single card — see §12.)

### 4.3 Brand frame copy (S7, in order)

1. `ILTZAM` — wordmark treatment per `src/components/Wordmark.tsx` (tracked-uppercase serif; the certificate-tile mark, gold permitted here only).
2. *See what matters.*
3. *Act with confidence.*
4. Secondary, smaller: *Automated data protection monitoring, built around human review.*

Eyebrow text anywhere in the film (e.g., "AN ILTIZAM FILM" on the poster) is small-caps mono, #8d867a, 0.18em tracking.

---

## 5. Camera direction

- **One take, felt.** The 60s master behaves like a single continuous move with two match cuts. Movements are glides (translate/scale of the world group, easeInOut, ≥4s each). No whip pans. No constant motion — S6 holds a locked-off frame for ~4s on the decision.
- **The push-in (S1):** 6% scale over 7 seconds. Barely perceptible; establishes patience.
- **The descent (S2→S3):** the camera *follows the thread* born from the cursor-drag, down through the desk plane. This is the film's signature move and must read as curiosity, not falling.
- **Follow-the-thread (S3–S5):** the camera tracks individual threads laterally; each risk behavior earns a small reframe (≤120px travel, ≥1.5s). Attention is redirected by light and thread motion first, camera second.
- **Match cuts:** (a) amber ghost-row → parchment card row at 33s (§7); (b) straightened thread → the teal rail of the owner card at 47s.
- **The ending:** the window-becomes-brand-frame move. The camera glides until the window's mullions align with a centered 16:9 inner rectangle, the warm plane fades, and the frame border *is* the brand frame. No cut — the office literally becomes the logo's home.

---

## 6. Character direction

Six recurring figures. In the animated build all are silhouettes: near-black #0e1013 head circle + one smooth shoulder/torso path, faint 1px stone rim-light #8d867a at 25% opacity. No faces, no limb articulation. Identity is carried entirely by posture, placement, and what each figure touches.

| Figure | Role in film | Posture signature (animation) | Live-action casting note (Plan B) |
|--------|--------------|-------------------------------|-----------------------------------|
| DPO | S6 protagonist; glimpsed in S1 | Upright, still, leans *toward* the screen, one slow confirming nod | 35–50, any gender. Capable, not frightened — reads findings the way a good editor reads proofs. Absolutely no furrowed-brow "cyber worry" acting. |
| HR | S2 drag-to-SHARED beat | Seated, forward, deliberate mouse gesture | Mid-career, unhurried. The drag is routine, not careless — the point is that risk needs no villain. |
| IT owner (Omar Fathy) | Named on card E; passes through S6 background | Standing, hands-in-pockets calm, turns head when the chime lands | 28–40. Practical presence; work clothes, lanyard, no hoodie cliché. |
| Marketing | S2 contract-to-MAIL beat | Half-standing, reaching to place a document | Bright, quick energy — the fastest mover in the office, kept subtle. |
| Customer | S1 arrival; the cup beat | Relaxed shoulders, sets a cup down with real weight | Ordinary person, ordinary morning. Their data is the film's cargo; they never look at a screen. |
| Applicant | S2 handover beat | Slightly formal posture, hands a document across a desk | Young, hopeful, neat. The handover is trust made physical. |

Live-action wardrobe: muted mid-tones (charcoal, stone, olive, warm grey) — nothing that reads as costume. No model casting; faces chosen for warmth and plausibility. No stock smiles anywhere — the emotional register is quiet competence. Performance direction on set: "you have done this a thousand mornings."

---

## 7. Motion direction — connected transitions

Every transition transforms an object the viewer is already watching. Nothing appears from nowhere.

1. **Cursor-drag becomes thread (13.4–15.0s):** the HR drag gesture's motion path detaches from the screen as a live teal thread and dives; the camera follows it into S3.
2. **Thread through wall (S3–S4):** threads pass through the architectural planes without breaking — a continuity statement: walls don't stop data. The exposure risk (26.5s) inverts this grammar: that thread exits through a *gap in its system's outline*, which is the wrongness.
3. **Spreadsheet row into inventory (32.8–34.0s):** the duplication ghost-copy — a row-like amber sliver — slides right, decelerates, and re-materializes as the first line of parchment card A. The mess literally becomes the record.
4. **Tangled line straightening on resolution (46.5–47.5s):** the last amber tangle pulls taut into a single teal lane in sync with the confirmation chime and card E. Resolution is shown as geometry relaxing, not as a checkmark.
5. **Reflection into logo (53–56s):** the window's warm reflection pooled on the desk contracts and sharpens into the gold certificate-tile mark, which docks beside the wordmark as the window frame completes its morph into the brand frame (§5).

Idle-motion law: breathing scale 1±0.004, head turns ≤2° over ≥3s. Any element not currently narrating holds still or flows at its resting rate.

---

## 8. Sound direction

**Policy: sound-off first.** The film is choreographed to be complete silent; score and effects are reinforcement only, and audio never starts without an explicit user gesture (§16).

**Score structure (synthesized, no samples, no network):**

| Window | Element | Character |
|--------|---------|-----------|
| 0–7s | Pad enters | Warm, low, two detuned sines through a gentle lowpass; −24 LU, patient |
| 8–14s | Keyboard ticks | Filtered noise bursts, humanly irregular (8–14s window), max 1 per 700ms |
| 9.5s | First piano note | Single struck tone, long decay |
| ~18s | Data pulse | One low sine swell under the S3 reveal |
| 22–33s | Tension drone | A slow minor-second rub added beneath the pad; thickens by degrees, never stabs |
| 33–43s | Resolution begins | Drone filters out with the comb; two-note piano figure returns |
| ~47s | Confirmation chime | Two soft struck tones (perfect fourth), synced to card E |
| ~54s | Resolve | Pad lands on home add9 chord; final piano note; 2s tail to silence by 58s |

**WebAudio implementation notes (Plan A):** one `AudioContext` created inside the user's play-with-sound gesture. Oscillator + `GainNode` envelopes for pad/piano/chime; `BufferSource` white noise through a bandpass for ticks; every event scheduled from the same master clock `t` that drives the visuals (`ctx.currentTime` offset mapped to film time), so scrubbing and the `filmt=` hook stay consistent. Master `DynamicsCompressor` as a safety limiter; total output conservative (≈ −18 LUFS integrated). Mute/unmute is a single master gain; no audio nodes exist until the gesture.

---

## 9. Transition plan

| Boundary | Time | Device | Duration |
|----------|------|--------|----------|
| Cold open → S1 | 0.0s | Fade up from black | 0.8s |
| S1 → S2 | 7.0s | Continuous glide; cup-placement beat covers the reframe | 0.6s |
| S2 → S3 | 13.4–15.0s | Cursor-drag becomes thread; camera follows it down through the desk plane (thread-through-wall grammar established) | 1.6s |
| S3 → S4 | 22.0s | No cut — light dims 8%, first fray begins mid-frame | 0.8s |
| S4 → S5 | 32.8–34.0s | Spreadsheet row into inventory: ghost-row match-cuts into parchment card A; comb sweep enters frame-left | 1.2s |
| S5 → S6 | 43.0s | Camera rises following the ordered thread; thread match-cuts into the teal rail of the S6 cards | 1.0s |
| S6 → S7 | 52.0s | Final tangle straightens; reflection gathers into the mark; window-becomes-brand-frame morph | 1.6s |
| S7 → end | 59.2–60.0s | All motion stops except one flowing thread; captions out; hold final frame | 0.8s |

---

## 10. Color and lighting direction

**Locked palette — no additions:**

| Use | Hex |
|-----|-----|
| World background gradient | #131518 → #1c1f24 |
| Architectural planes | #23262c / #2c3038 / #343943 |
| Dawn window light | #e8dcc4 (warm) |
| Neutral daylight (S7) | #d9d5cb |
| Silhouettes | #0e1013 + rim #8d867a @ 25% |
| SAFE threads | #6fa39c @ .35–.7 |
| RISK threads | #b0762a |
| System outlines / labels | #3a3f47 / #6b6f76 |
| Parchment cards / card ink | #efeadf / #141927 |
| Card rails | gold #ab8434 · teal #0d6f64 |
| Captions | #e8e2d6 |
| Letterbox / page surround | #0c0d10 |

**Lighting arc:** dawn warmth (S1–S2, #e8dcc4 planes at low opacity) → the warm light thins as we descend → pure dark space (S3–S4, the world is only threads and outlines) → teal clarity (S5, the comb raises ambient teal by a few percent) → returning warmth (S6) → neutral daylight #d9d5cb (S7): the same room, seen soberly.

**Gold discipline:** gold #ab8434 appears only as the thin left rails on open-finding cards and in the final brand frame (mark + rail). Never as a wash, never on threads, never in lighting. Navy+gold washes are forbidden outright.

---

## 11. The three cuts

All three cuts are the same shipped component: `<BrandFilm cut="60" | "30" | "15" />` — one engine, three timelines.

### 60s master
The full map in §2: S1 0–7 · S2 7–14 · S3 14–22 · S4 22–33 · S5 33–43 · S6 43–52 · S7 52–60.

### 30s cut
Scene map (locked): **S1 0–4 · S2 4–10 · S3 10–17 · S4 17–20 · S5 20–26 · S6 26–29 · S7 29–30.**
S4 keeps two risks only (fraying 17–18.5, cross-border 18.5–20); S5 shows cards A and B only; S7 is a one-second hard brand frame (the window morph pre-completed). Trimmed VO — approved lines only; trims marked †:

| In | Out | Line |
|------|------|------|
| 0.6 | 3.6 | Every morning, a business wakes up and begins to move. |
| 4.6 | 9.4 | And underneath all of it — something you don't see. Data, moving. |
| 10.6 | 16.4 | Most of it flows exactly where it should. But some of it frays. Some of it quietly copies itself. |
| 17.2 | 19.8 | Some of it crosses a border no one meant it to cross. † |
| 20.6 | 25.6 | Iltizam watches the movement itself — deterministic rules — and brings every finding to a person. † |
| 26.2 | 28.4 | Automated finding. Human review. |
| 28.8 | 30.0 | *(on-screen only, brand frame)* See what matters. Act with confidence. |

### 15s social cut
Map (locked): **dark-space hook 0–6 · comb 6–11 · brand 11–15.** Opens cold inside S3/S4 dark space (one fray + one border-cross already in progress), the comb orders the field 6–11 with card B only, brand frame 11–15. Its two lines:

| In | Out | Line |
|------|------|------|
| 0.8 | 5.4 | And underneath all of it — something you don't see. Data, moving. |
| 11.4 | 14.6 | See what matters. Act with confidence. |

Social cut ships captions burned into the choreography (it will autoplay muted on social surfaces; §16's no-audio-autoplay rule applies everywhere).

---

## 12. Silent website hero loop

Shipped as `src/components/film/HeroLoop.tsx` — a self-contained 10s vignette in the film's language, independent of the film engine (its own tiny rAF clock; every property a pure function of loop-time t).

**10s beat map (as implemented):**

| t | Beat |
|------|------|
| 0.15–1.9 | A document slides from the seated figure to the `SHARED` system rect |
| 0.3–3.7 | Five threads are born, staggered; thread 4 is amber |
| 2.7–3.9 | The amber thread frays into two strands |
| 4.0–5.5 | A teal sweep combs the field into three lanes; amber crossfades to its teal twin (4.4–5.3) |
| **5.5** | **Freeze/poster frame: ordered lanes, everything flowing** |
| 5.5–6.5 | Rest beat — pure ordered flow |
| 6.5–7.2 | Parchment card in ("Nile Digital Services" / "Automated finding requiring human review.") |
| 8.5–9.15 | Card out |
| 8.55–9.9 | Threads release from lanes and fade — the loop seam |

**Seamless-loop design:** dash "2 14" (period 16) with flow −32 px/s ⇒ exactly 320px per loop, an integer multiple of the period, so the dash phase at t=10 equals t=0; the lane morph and all opacities return to their initial values through the release window. **Reduced motion / hidden tab:** render the t=5.5 ordered-lanes frame statically. The clock pauses entirely offscreen (IntersectionObserver) and while the document is hidden.

---

## 13. Poster frame

**Concept:** the S3 dark space — three safe teal threads flowing right, one amber thread fraying into two strands upper-right — over the #131518→#1c1f24 gradient with the faint dawn wedge. Title treatment centered: mono eyebrow "AN ILTIZAM FILM · 60 SECONDS" (#8d867a) above the display-serif title *What You Don't See* (#e8e2d6), play affordance in a hairline stone circle. No gold. The poster is the film's question, not its answer.

**Where it appears:** (1) the landing film section placeholder (`FilmSection.tsx` `PosterArt` + play overlay) before the engine loads; (2) the /film page as the pre-mount frame; (3) social share imagery (OG image rendered from the same composition, title baked in).

---

## 14. Mobile adaptation

- **16:9 preserved** at all widths — the SVG viewBox letterboxes inside `aspect-video`; no vertical recomposition, no cropping.
- **Captions:** serif size floors at 15px rendered (scale caption font-size inversely with stage scale below 480px CSS width); max-width 44ch keeps two-line wraps; lower-third padding grows to clear home indicators.
- **Tap-for-controls:** the stage is one tap target — first tap reveals a minimal chrome row (play/pause, sound toggle, cut label) that auto-hides after 3s; CSS transitions permitted here (UI chrome only).
- **Thread legibility at 360px:** strokeWidth stays in the 1.2–2 SVG-unit band but the risk behaviors are choreographed with ≥24px separation at fray/ghost offsets so they survive 4.4× downscale; ghost-copy offset uses the top of its 3–6px range on the master so it never collapses to sub-pixel.
- **Hero loop cost budget:** one rAF, attribute writes only (transform/opacity/dashoffset — no layout), ~20 nodes touched per frame; paused offscreen and when hidden; zero cost until scrolled into view; no timers, no per-frame allocation.

---

## 15. Reduced-motion version

When `prefers-reduced-motion: reduce`:

- **Film:** no animation mounts. The component renders the static poster frame (§13) plus the full caption transcript as readable text beneath the stage (the same 12 lines, in order — matching the /film page transcript). Play controls become a "view transcript" affordance; sound remains available on gesture without motion.
- **Hero loop:** the frozen t=5.5 ordered-lanes frame (already implemented).
- **Site-wide corollary:** no parallax anywhere — in the film, on the landing page, or in any future section. This is an accessibility commitment, not a per-component setting.

---

## 16. Website integration and performance plan

- **Where it lives:** the landing page film section (`src/app/(public)/FilmSection.tsx`) inside the ink band under the hero; the dedicated `/film` page (`src/app/(public)/film/page.tsx`) with `?cut=30` / `?cut=15` selection and the full transcript; the silent hero loop in the landing hero.
- **No film JS in the initial bundle:** `BrandFilm` is `next/dynamic` with `ssr: false` in both `FilmSection` (mounts only on the play click) and `FilmPlayer` (mounts on /film navigation). The landing page ships only the poster SVG and the ~1-line wrapper. The hero loop is small, standalone, and independent of the engine.
- **Lazy mount on click:** the poster button is the gate; the engine chunk downloads only after intent.
- **Sound rules:** audio requires an explicit user gesture (the AudioContext does not exist before it); captions default on; **never autoplay with audio** — anywhere, on any surface, including social embeds. Muted visual autoplay is permitted only for the silent hero loop.
- **Cut switching:** `?cut=` re-keys the player (`<BrandFilm key={cut} />`) for a clean timeline remount.
- **Performance contract:** one rAF master clock while playing; transform/opacity/dashoffset mutations only; the clock stops on pause, on end, offscreen, and on hidden tabs. Target: zero long tasks > 50ms on a mid-range Android phone.

---

## 17. Production plan A — as shipped (in-repo SVG/WebAudio)

**Files:**

- `src/components/film/BrandFilm.tsx` — the film engine ("use client"): stage, world, figures, threads, cards, captions, brand frame, WebAudio score. Type contract locked in `src/components/film/BrandFilm.d.ts` (`cut?: "60" | "30" | "15"`, `className?`).
- `src/components/film/HeroLoop.tsx` — the silent 10s hero vignette (shipped).
- `src/app/(public)/FilmSection.tsx` — landing poster + lazy mount (shipped).
- `src/app/(public)/film/page.tsx` + `FilmPlayer.tsx` — the cinema page with `?cut=` and transcript (shipped).
- `docs/brand-film.md` — this bible.

**Engine rules:** every visual property is a pure function of master time `t` (seconds) from a single `requestAnimationFrame` clock — no CSS keyframes for choreography (CSS transitions for UI chrome only). Helpers: `clamp01`, `segment(t, start, end) → p`, `linear` / `easeInOut` / `easeOut` (cubic), `lerp`. Because the film is a function of t, it is scrubbable and deterministic: the same t always yields the same frame. Audio events are scheduled off the same clock (§8). Reduced motion renders §15. No external assets, no network fetches, no images — everything drawn in SVG/CSS. `npx tsc --noEmit` and `npx eslint` clean.

**The `filmt=` test hook:** appending `?filmt=<seconds>` (e.g. `/film?filmt=47`) mounts the engine paused at exactly that master-clock time and renders that single frame — no rAF loop, no audio. This makes every storyboard timecode in §2 a testable assertion (screenshot `filmt=18`, `filmt=33`, `filmt=47`, `filmt=55.5` against this document) and is the QA method of record for the choreography.

---

## 18. Production plan B — live-action upgrade path

- **Shoot:** 2 days, one practical Egyptian office location (Cairo; real tenant floor, not a set). Day 1: S1/S2/S7 morning coverage chasing real dawn through east glass; Day 2: S6 decision scene + figure beats and plates for VFX.
- **Light:** natural window light + practicals only (desk lamps, monitor glow). No HMI "cyber" looks; grade to the locked palette — charcoal shadows, #e8dcc4 dawn, #d9d5cb close.
- **Threads as VFX:** the data-thread system is a compositing pass, 2D-tracked to plates, using the exact SVG grammar of this bible (stroke weights scaled to 4K, same hexes, same five risk behaviors, same comb). The animated film is the previz and the motion bible; the VFX vendor receives `BrandFilm.tsx` timings as ground truth via the `filmt=` frame exports.
- **Cast:** six roles per §6. Local casting; no model casting, no stock smiles. The DPO is the only featured performance.
- **VO:** record English master (script §3, verbatim); produce an Arabic-language version with a native Egyptian Arabic VO artist — re-timed captions, same choreography; legal review of the Arabic script against EG-PDPL terminology before record.
- **Deliverables:** 4K (3840×2160) 60s master; 1080p 60/30/15 cuts; ProRes 422 HQ masters + H.264 web encodes (target ≤ 12 Mbps 1080p); captions as SRT (EN + AR) matching §4.1 cue times; poster still per §13 in 4K and OG sizes; audio stems (VO / score / effects) for future cutdowns.
- **Truth line for all future versions:** deterministic rules plus human review, never AI magic — and every cut must still work with the sound off.

— End of bible —
