# After Submit — the Iltizam brand film

48 seconds · one woman · one company · one request · no voiceover until the end

This document is the single source of truth for the film that lives in
`src/components/film/`. The master cut, the 30s and 15s cuts, the hero loop,
the poster and the sound map are all specified here in absolute seconds; the
code implements these numbers and nothing else.

---

## 1. Concept

**After Submit** follows two files — a CV and an ID scan — from the moment
Mariam Hassan presses **Submit** on a job application, through the ordinary
life of a company where those files quietly multiply, to the day she asks for
one of them back, and the human decision that answers her.

The film replaced an earlier systematic seven-stage explainer. That structure
was discarded deliberately:

- **It explained a system; it didn't earn a feeling.** Seven capability
  stages read as a product tour. Nobody remembers a tour.
- **It looked like software.** System boxes with mono labels, dark network
  planes, glowing connective lines — exactly the visual language a data
  protection company should be suspicious of.
- **It had even pacing**, and even pacing has no emphasis. Everything equally
  weighted is equally forgettable.

### The one-story principle

One protagonist, one company, one request, told in order, with no cutaways to
abstractions. Every frame must be a *place* — a room, a desk, a window, a
sheet of paper. If a frame reads as a software diagram, it is wrong and gets
reworked. The product appears only where the story earns it.

### The two-interface-glimpses budget

The interface may appear **exactly twice**, totalling **under 15% of
runtime**:

1. **S1, ~1.5s effective** — the tiny submit panel on Mariam's laptop
   (diegetic; her software, not ours).
2. **S5, ~6s effective** — the Iltizam parchment card: the earned reveal,
   the only product UI in the film.

Everything else — badge, form, payslip screen, message thread, phone — is
diegetic set dressing with no product branding.

### The closing-VO-only policy

There are **no captions and no narration until 42.0s**. All words before that
are diegetic: they exist inside the world, on screens and paper, small and
quiet. The player's caption table therefore contains only the three closing
voiceover lines (plus nothing else, in any cut).

---

## 2. The motif

A fine warm **reflection line** — 1px, `#e8dcc4` at 30–50% opacity, drawn as
a short gradient segment brightest at its head — slides across *physical
surfaces*, always following the document. It is light moving over wood and
paper, never a glowing network line.

- **Born** in S1: it slides off the closing laptop lid, across the desk, and
  exits frame right (1.2s).
- **Precedes** every duplication in S2's counterpoint.
- **Retracts** in S5: after the decision, the lines converge toward one
  point and disappear — everything is accounted for.

### The repeated shape

Documents are **small paper rects with a folded corner** (a triangle notch).
The same shape every time: in the tray, in the drawer, drifting out of frame,
resting on a shelf, folding closed at the end. Copies carry a faint amber
tint (`#b0762a` at ~16%) — the only use of amber in the film.

---

## 3. Palette

Warmer and more physical than the old film. Charcoal keeps depth, but this
film lives in **warm daylight**:

| Role                    | Value                          |
| ----------------------- | ------------------------------ |
| Window light (morning)  | `#e8dcc4 → #f0e8d8`            |
| Window light (evening)  | `#e6c18a → #b07a42`, dimmer    |
| Warm interior planes    | `#2a2723`, `#3a352e` (warm greys, never cool) |
| Wood desk tones         | `#4a3f33`                      |
| Paper                   | `#efeadf`                      |
| Silhouettes             | `#171310` (warm near-black)    |
| Teal `#0d6f64`          | **reserved**: the Iltizam card + the resolution |
| Amber `#b0762a`         | **only** the faint document-copy tint and the finding rail |
| Motif line              | `#e8dcc4`, 1px, 30–50%         |

Forbidden: system-boxes-with-mono-labels diagrams, black-void network scenes,
cool greys, red.

---

## 4. Shooting script (master cut, absolute seconds)

Scenes are React components taking `(p, t)` — `p` is cut-mapped progress,
`t = p × scene duration` is scene-local master seconds. Framing varies:
off-center weight, over-shoulder implied by layering, partial obstruction by
foreground planes.

### S1 · "Submit" · 0–8s (breathes)

A warm room: tall window right with a morning light pool, desk, Mariam
(silhouette, seated, low bun, 3/4 by composition) at a laptop. A foreground
plant/shelf plane obstructs the left frame edge. On the laptop a **tiny
diegetic panel** (paper card, ≤180px at stage scale): two attachment chips —
`CV_Mariam_Hassan.pdf`, `ID_scan.jpg` — and a Submit button.

- **3.2** — cursor clicks Submit. Button depresses, panel fades. Near the
  laptop, 13px, quiet: **"Application submitted"**.
- **3.4–4.6** — *the motif is born*: the reflection line slides off the lid,
  across the desk, exits frame right.
- **5–7** — HOLD. Mariam turns her head slightly toward the window. Nothing
  else moves. Let it breathe.
- **7–8** — she reaches; the laptop lid rotates flat; the light dims 5%.

### S2 · "Time moves" · 8–19s (quick, uneven fragments)

Fragment cuts of 1.5 / 2.5 / 1 / 2 / 4 seconds, crossfaded on motion (each
fragment drifts as it fades), every one a different composition:

- **(a) 8–9.5 · interview** — wide frame, two silhouettes across a table,
  one nods.
- **(b) 9.5–12 · first day** — a badge card slides in: **"Welcome to the
  team"**; at ~10.5 a soft **white flash** (the access-card photo); after the
  flash Mariam's silhouette holds a badge.
- **(c) 12–13 · a form** — paper close-up; a pen line draws itself across
  the sheet.
- **(d) 13–15 · payroll** — a screen slab; a row of keystroke dots appears.
  No readable numbers.
- **(e) 15–19 · THE QUIET COUNTERPOINT** — the folded-corner document in an
  HR tray. It **duplicates**: one copy slides down-left into a drawer slab
  that closes; a third drifts right and exits the frame (a vendor — no
  label). Each movement is preceded by the motif crossing the surface.

### S3 · "Months later" · 19–26s (slower)

The office wider and busier: four figure silhouettes at desks, neutral midday
light, more furniture planes. In the mid/background, **four faint
folded-corner rects** rest where they were left — a shelf, a slightly open
drawer, a broad open tray, one half out of the right frame edge — 25–35%
opacity, one slowly dimming (dust settling). No labels, no warnings. A slow
push-in (1.00 → 1.06). Nothing else happens; the unease is the stillness.

### S4 · "The request" · 26–33s (turning point)

Cut to a message thread on a paper-toned screen slab. A bubble types out
character by character (26.2–28.8, notification tick at 26.2):

> "Could you please delete the ID copy I submitted when I applied?"

29.5–33: the HR desk. Two folder slabs open in sequence — copies 1 and 2,
found. A **third slab opens on nothing certain** — just shadow. The figure's
head turns; a second silhouette walks in; both lean toward one screen. The
music turns uncertain. No panic. No red.

### S5 · "Seen" · 33–41.5s (the earned reveal — the only product UI)

The compliance manager at a desk. A calm parchment card fades up beside the
screen (≤40% frame width, slight perspective):

1. **"Mariam Hassan"** (serif)
2. `Recruitment identity record` (mono, quiet)
3. **"4 locations identified"**

Four small rows light up 0.5s apart (34.3→36.05): *HR folder · Onboarding
archive · External processor · Recruitment duplicate*. Then the finding, with
an amber left rail: **"Identity record retained beyond recruitment purpose"**
+ **"Human review required"**.

**37.5–41.5 · THE HUMAN DECISION** (the most important beat — given time):

- The manager leans in and **reads**. 1.2s hold; nothing moves.
- A cursor moves *deliberately*. **Click 1 (38.6)** — the finding gains a
  thin teal rail; **"Owner assigned"** appears. **Click 2 (39.8)** — confirm.
- Out in the room the four scattered rects respond: **three fold closed**
  (the corner triangle grows, the rect collapses) and fade; **one settles
  into a proper drawer** that closes.
- The motif reflection lines retract toward one point.
- A quiet last line on the card, small: **"Request completed"** (~40.8).

### S6 · "Evening" · 41.5–48s

The S1 composition at evening — warmer, dimmer, the light pool falling the
other way. Mariam by the same window; the phone slab in her hand shows
**"Your request has been completed."** Her shoulders ease 2px. Nothing more.

**The only voiceover** (serif captions, lower third):

| Cue        | Line                                          |
| ---------- | --------------------------------------------- |
| 42.0–43.6  | People share more than information.           |
| 43.9–45.3  | They share trust.                             |
| 45.6–47.2  | What happens next is your responsibility.     |

At **45.5** the window rect darkens and grows into the ink brand frame — the
window-to-frame **match cut**. 45.5–48: small line *"What happens after
“Submit” matters."*, then the gold certificate mark + letterspaced **ILTZAM**
+ *"See the responsibility." / "Protect the trust."* + tiny secondary
*"Automated data protection monitoring, guided by human review."*

---

## 5. Pacing map (uneven on purpose)

```
S1  Submit          ████████                    8.0s   slow — breathes
S2  Time moves      ███████████                11.0s   fast fragments: 1.5/2.5/1/2/4
S3  Months later    ███████                     7.0s   slow — stillness
S4  The request     ███████                     7.0s   medium — typing, then search
S5  Seen            ████████▌                   8.5s   slow → deliberate
S6  Evening         ██████▌                     6.5s   slow → brand
```

The long holds (S1 5–7, S3 entirely, S5 37.5–38.7) are the film. Do not
shorten them to make room for content.

---

## 6. Cut maps

Cuts re-time the same scenes through **window tables** in `BrandFilm.tsx` —
each window maps playback `[start, end]` to a scene `p` range. Beat logic
keys off `t = p × scene duration`, so compressed windows play faster without
re-authoring.

**30s** — drops S3 (the stillness needs 48s to be affordable):

| Window | Scene | p range   |
| ------ | ----- | --------- |
| 0–5    | S1    | 0.25–1    |
| 5–11   | S2    | 0–1       |
| 11–17  | S4    | 0–1       |
| 17–25  | S5    | 0–1       |
| 25–30  | S6    | 0.05–1    |

Captions: the three VO lines at 25.2 / 26.7 / 28.0.

**15s** — the submit moment, the request, the decision, the brand:

| Window  | Scene | p range   | Content                    |
| ------- | ----- | --------- | -------------------------- |
| 0–4     | S1    | 0.28–0.66 | the click + the motif      |
| 4–7.5   | S4    | 0–0.5     | the message                |
| 7.5–12  | S5    | 0–1       | card + decision            |
| 12–15   | S6    | 0.55–1    | match cut + brand          |

Caption: only "What happens next is your responsibility." at 12.5.

---

## 7. Sound map (`audio.ts`, synthesized)

Warm pad throughout (detuned triangles through a 950Hz low-pass), F-rooted.

| Time      | Event                                                  |
| --------- | ------------------------------------------------------ |
| 0–19      | pad, **brighter voicing** (add9 air)                   |
| 2.5–3.2   | keyboard ticks (typing)                                |
| 3.2       | the submit click — a single soft tick                  |
| 10.5      | camera-flash soft noise burst                          |
| 19        | pad eases to neutral voicing                           |
| 26–33     | **uncertainty**: minor voicing + sparse low D1 drone   |
| 26.2      | notification tick                                      |
| 38.6/39.8 | two deliberate decision clicks                         |
| 41.8      | notification tick (Mariam's phone)                     |
| 42        | resolve chord (maj7)                                   |
| 45.5      | final warm chord, pad swells under the brand frame     |

The old data-pulse event is gone. The 30s/15s timelines re-time these beats
through their window maps (see `AUDIO_TIMELINES`). All events are scheduled
from an arbitrary start offset so seek/pause/cut-switch stay in sync.

---

## 8. Hero loop (`HeroLoop.tsx`)

10 seconds, silent, seamless — story moments, not dashboards:

| Beat     | Content                                                        |
| -------- | -------------------------------------------------------------- |
| 0–2.5    | laptop + Submit click + "Application submitted" + motif line   |
| 2.5–4.5  | the paper rect duplicates into two trays                       |
| 4.5–6.5  | the message bubble: "Could you delete the ID copy…?"           |
| 6.5–8.5  | small card "4 locations identified" + rects fold closed        |
| 8.5–10   | crossfade back to the opening frame (the seam)                 |

Reduced motion: freeze at the **7.5s** state (card + folding copies).

---

## 9. Poster

Mariam at the warm window — the S1 composition at ~2.7s: silhouette, light
pool, the tiny submit panel still open. Title **"After Submit"**, small line
*"An Iltizam film · 48 seconds"*. Used by `BrandFilm`'s poster state and the
landing `FilmSection`. Never the dashboard, never a dark network.

---

## 10. Engine, review hook, reduced motion

- `engine.ts` owns the rAF clock and easing helpers. **Every frame is a pure
  function of time** — scenes hold no state. Do not add scene knowledge to
  the engine.
- `/film?filmt=<seconds>` renders the master cut paused at that second — the
  review tool used for frame checks (`?cut=30|15` selects a cut).
- Reduced motion: the player shows the poster still with the closing lines
  as text; the hero loop freezes at 7.5s.

---

## 11. Live-action production note

If this film is ever shot for real: **one actress, one office, one day**,
plus a macro insert day. Every setup is already in this document — window
desk (S1/S6, shoot morning and evening), conference corner (S2a), wide floor
(S3), HR desk (S4/S5). The macro day covers paper, folded corners, trays,
drawers, the pen line and the reflection pass (a light bar dragged over the
desk). The interface stays a post insert on real screens — two glimpses, same
budget. The silhouette language survives the transfer: expose for the
windows, let the people fall to warm black.
