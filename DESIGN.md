---
name: debatebros
description: A paper-collage debate table where cut-out thinkers argue on a printed page.
colors:
  paper: "#f2efe6"
  paper-card: "#fffdf8"
  paper-warm: "#f7f3ea"
  ink: "#16130f"
  ink-soft: "#4d463c"
  ink-faint: "#6f6858"
  marker: "#ff4d2e"
  marker-ink: "#c8340f"
  marker-deep: "#d3300f"
  tape: "#ffcf2e"
  lilac: "#cbbcff"
  lilac-ink: "#4b3fa8"
  mint: "#27b877"
  mint-deep: "#157048"
  mint-wash: "#eef7f1"
  chip-warm: "#f5ede9"
  chip-cool: "#eaf6ef"
  field: "#fbf9f4"
  track: "#e7e0d4"
  hairline: "#ddd6c6"
  error-field: "#fdeee9"
  disabled-fill: "#cfc8bb"
  disabled-edge: "#a9a294"
  tape-ink: "#6b5a17"
  lilac-body: "#3b3560"
  paper-dim: "#cfc9bc"
  white: "#ffffff"
  shadow-card: "rgba(22,19,15,.12)"
  shadow-lift: "rgba(22,19,15,.14)"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(2.4rem, 5.4vw, 4.6rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.03em"
  hero:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(3.6rem, 6.6vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(1.9rem, 3.2vw, 3rem)"
    fontWeight: 800
    lineHeight: 0.92
  panel-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.13em"
  label-small:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  caption:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.4
  lead:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  debate-speech:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.28rem)"
    fontWeight: 400
    lineHeight: 1.6
  support:
    fontFamily: "Atkinson Hyperlegible Next, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.45
  score:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "3.2rem"
    fontWeight: 800
    lineHeight: 1
spacing:
  compact: "0.75rem"
  control: "1rem"
  section: "2.5rem"
radii:
  chip: "999px"
  card: "14px"
  panel: "18px"
  thumb: "10px"
components:
  button-primary-disabled:
    backgroundColor: "{colors.disabled-fill}"
    textColor: "{colors.ink-soft}"
    height: "52px"
    padding: "0.9rem 2rem"
  button-primary:
    backgroundColor: "{colors.marker-deep}"
    textColor: "{colors.white}"
    border: "2px solid {colors.ink}"
    borderRadius: "{radii.chip}"
    boxShadow: "4px 5px 0 {colors.ink}"
    height: "52px"
    padding: "0.9rem 2rem"
  card-paper:
    backgroundColor: "{colors.paper-card}"
    border: "2px solid {colors.ink}"
    borderRadius: "{radii.card}"
    boxShadow: "6px 8px 0 {colors.shadow-card}"
  input-debate:
    backgroundColor: "{colors.field}"
    border: "2px solid {colors.lilac}"
    borderRadius: "12px"
    padding: "1rem 1.1rem"
---

# Design System: debatebros

## Overview

**Creative North Star: "Colagem de Papel"**

debatebros looks like a page torn out of a zine: a warm paper ground, black-and-white cut-out thinkers pasted over colored scraps, marker strokes and tape highlights. The world is loud and handmade, but the argument text stays calm and readable. It rejects chat bubbles, dark AI-product chrome and classical philosophy-paper styling.

**Key Characteristics:**

- Every surface is an object on a page: bordered, slightly tilted, with a hard offset shadow.
- Portraits carry identity. Names, quotes and roles are set in type beside the artwork, never over it.
- One active task per screen, with the remaining stages visible but quiet.
- Long text is clipped inside its own scrolling block so the page height stays stable.

## Colors

Warm paper neutrals carry the surface; four functional accents carry meaning: marker vermilion for live or actionable, tape yellow for the current stage and highlighted text, lilac for the judge, mint for completed states.

**The Two Vermilions Rule.** `marker` (#ff4d2e) is a fill: the rule under a heading, a seal, a tape edge — never text. `marker-ink` (#c8340f) is the same voice at reading weight and is the only vermilion allowed on type, icons, carets, scrollbar thumbs, progress fills and status dots, because it clears 4.5:1 on both paper tones where the bright one reaches only 3.25:1. `ink-faint` and `mint-deep` were darkened for the same reason; every label in the product is set at 11–12px, so the small-text threshold, not the large one, governs the palette.

**The Accent Ownership Rule.** Vermilion is action, yellow is now, lilac is judgment, mint is done. Never swap these roles for decoration — a yellow block always means "this is the current step", never "this is pretty".

## Typography

**Display Font:** Barlow Condensed (sans-serif fallback)
**Body Font:** Atkinson Hyperlegible Next (sans-serif fallback)

The pairing separates the cut-out headline voice from sustained reading. Display text is uppercase, tightly set and short; arguments remain mixed case with generous line-height and a controlled measure.

**The Two-Voice Rule.** Use the condensed face for labels, participants, stages and decisive headings. Use the hyperlegible face for every sentence a person must understand or compose. The handwritten lettering lives inside the collage artwork only — never as a UI font.

**The Ramp.** Reading sizes are `label-small` 0.68, `label` 0.72, `caption` 0.8, `support` 0.86, `body` 1, `lead` 1.15 and `debate-speech` (fluid, up to 1.28) rem; display sizes are `panel-title` 1.5, `section`, `display` and `hero`. The shipped CSS also carries near-neighbours of these steps (0.75, 0.78, 0.82, 0.88, 0.92, 0.95rem) inherited from earlier passes — new work snaps to the named steps rather than adding another neighbour.

## Layout

The landing opens on two columns: the claim, its two actions and three facts on the left; one transparent cut-out of the full cast on the right — opponents around a hooded figure standing in for the reader — bleeding 4% past its column, since the PNG carries empty margin on both sides. The product's six stages follow as their own full-width band, with the verdict cell carrying the tape.

On desktop (from 1101px wide and 820px tall) the debate table fills the window and the page itself never scrolls: the cards absorb the remaining height, each text block scrolls inside itself, and the stage card scrolls internally when the window is too short for its form. Below those sizes the page returns to normal flow.

The debate table is three columns — opponent, active stage, participant — inside 1720px: the stage card takes 2.5 of the 4.6 fractions, because reading and writing is the work and the flanks are identity. The artwork aligns to the top of the row, not its middle, so the faces sit above the fold of the card beside them. The stage card dominates; the judge strip sits under it, and the six-step rundown closes the page. Configuration pairs a wide selection field with a narrower sticky summary. At 1100px the stage card moves above the two identity cards. At 620px everything becomes one column, and identity cards turn into a portrait-plus-text row.

Reading copy stays near 58 characters per line. Spacing is dense inside a card and generous between cards.

## Elevation & Depth

Depth is printed, not simulated: a hard offset shadow in ink at low opacity, never a blur-heavy glow. Cards tilt by less than a degree — enough to read as pasted, never enough to look broken. Hover lifts a card toward the top-left and grows its shadow; pressing a button pushes it into the page.

**The Reduced-Motion Rule.** Under `prefers-reduced-motion` nothing tilts, lifts or travels, but the two signals that say work is happening survive: the waiting bars keep their silhouette and pulse opacity over 2.4s, and the streaming caret slows to 1.4s. Feedback is translated, not deleted.

**The Cut-Out Rule.** The collage is a pasted object, not content inside a frame: no border and no shadow on the artwork itself. The card underneath carries the border, the shadow and the type, and overlaps the art so the two read as two pieces of paper, not one component.

**The Paste Rule.** Rotation and offset shadow travel together. An element that tilts must also cast; an element that casts must sit on the paper, not float above it.

## Shapes

Cards and panels use 14–18px corners, chips and primary buttons are full pills, portrait thumbnails use 10px. Every object carries the same 2px ink border, which is what makes the collage read as cut paper. Circles are reserved for status lights and the stage number badge.

## Components

### Buttons

Primary actions are ink-bordered vermilion pills with condensed uppercase labels, a minimum 52px height and a solid ink shadow. Hover shifts the button up-left; active pushes it down-right. Focus uses a three-pixel lilac outline.

**The Reachable-Unavailable Rule.** A control that cannot act yet carries `aria-disabled`, never the `disabled` attribute: it keeps its place in the tab order, and activating it publishes what is missing in a `role="alert"` and moves focus to the field that fixes it. The warm-gray fill and muted shadow style both states identically, so nothing changes visually — only whether a keyboard can find out why.

**The 44px Rule.** Every control clears a 44px touch target. Small pills and text buttons reach it with a centered `::after` hit area rather than extra padding, so the pill and the underline keep the size the type asks for.

### Inputs / Fields

The debate field is a lilac-bordered rounded box on near-white paper with a vermilion caret. The border deepens to lilac ink on focus. Character count sits below the field; the send button is centered under it.

### Portraits

Collage portraits come from `public/cast` at 1122×1402. On the debate table the artwork sits **outside** the card: the full collage, handwritten name included, is pasted above a text card that tucks under its bottom edge by 1.6rem, each rotated a degree in opposite directions. The typed name inside the card repeats the handwritten one on purpose — that pairing is the look. The artwork is sized from the row height, never from the column width, and is capped at the column so it can never reach into the stage card. Cropped to the face only where the artwork is a thumbnail (setup options, judge face, hero pile, cast grid) — `scale(2.3)` from `50% 24%`, or a 3:2 window — so the lettering never lands half-cut.

### Navigation

The header holds two things over a 2px ink rule: the wordmark and the one action that is valid on every screen. It carries no status pill, no tally light and no nav — a header row that cannot be acted on is decoration, and this product has three routes, not a site map.

### Stage Rundown

Six cells show the complete finite sequence: done cells are mint-tinted, the active cell is a tape-yellow block with a shadow, upcoming cells are dashed and quiet. Three columns at 1100px, two at 620px, order unchanged.

### Selection Rows

Each choice is a pasted card: portrait, name, one-line summary and a tally dot. Selection fills the card with tape yellow. The whole card is the target; the thesis list drops the portrait and keeps the text alone.

### Result

The verdict is a moment, not a header: the judge's face, the outcome in display type, one short sentence, and the total as a tape-yellow stamp rotated off-axis. The five dimensions are a scoreline — number, label, bar — with the evidence and the reasoning behind one "Por quê?" per row, in the reading modal. The strongest rewrite of the argument gets its own lilac panel at reading size, because it is what the person takes away. Everything else is three short cards. The report must read in one pass; if a screen looks like a graded exam, it is wrong.

### Reading Modal

Any long text can be opened full-screen in a native `<dialog>`: eyebrow, name, and the text at reading size on a paper panel over a dimmed page. Esc, the Fechar button and a click on the backdrop all close it. It is the place for sustained reading; the table stays a place for acting.

### Scrolling Blocks

Any block that can receive unbounded content — the thesis line, the opponent's speech, the quoted last turn, a card summary — caps its height and scrolls internally, with a vermilion thumb on a paper track. These blocks are focusable so a keyboard can reach them, and the streaming speech follows its own tail.

## Do's and Don'ts

### Do:

- **Do** keep the active speaker, the current stage and the next action identifiable within seconds.
- **Do** let argument copy occupy the largest readable region on the debate table.
- **Do** preserve accent semantics across loading, completion, judgment and error states.
- **Do** clip long text inside its own scroller instead of letting the page grow.
- **Do** set vermilion type in `marker-ink`; the bright `marker` is for fills only.

### Don't:

- **Don't** turn the transcript into alternating chat bubbles.
- **Don't** print UI text over the collage artwork or imitate its handwriting in type.
- **Don't** scatter tape, crowns or scribbles across the interface; the ornament lives in the artwork.
- **Don't** use display typography for long arguments or feedback paragraphs.
- **Don't** remove a control from the tab order to express "not ready".
- **Don't** freeze the waiting state under reduced motion; trade movement for a slow opacity pulse instead.
