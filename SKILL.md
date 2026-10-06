---
name: flick
description: Adds hover, click, state-change, entrance or loading micro-animations to SVG UI icons without changing their drawing — no shapes added, removed or edited. Use when the user wants an icon animated, gives an SVG icon and describes how it should move, or asks for an animated icon for an interface.
argument-hint: "[icon or SVG, and how it should move, e.g. 'bell that rings on hover']"
---

# SVG Icon Animator

Animate small UI icons — the kind in buttons, nav bars, toasts and inputs — by describing how they move. Principles follow *Interactive SVG Animations* (svg.guide): know the coordinate system, animate with CSS, pivot transforms deliberately, draw lines with dashes.

## Starting: `/flick <idea>`

The text after the command (or the user's request, when the skill triggers on its own) is the **idea**. Read it as follows:
- **The icon:** an SVG pasted in the message, a path to an `.svg` file (`./icons/trash.svg`, `@icons/trash.svg`), or an icon named in words ("bell"). A pasted or referenced SVG is the source; a named icon with no SVG means you draw one first (see Workflow step 1).
- **The motion:** everything else in the idea: plain words, style names, shorthand, knobs or references (see "Describing the animation").
- **Nothing after the command:** ask exactly one question: *"Which icon, and how should it move? You can paste the SVG or give a file path."* Then wait.
- **An idea with several icons** ("bell, heart and trash, subtle"): treat it as a set and do each one.

Then go straight to work. Don't ask follow-up questions when the icon is known; fill gaps from the defaults and state them in the one-line brief.

## The one rule: the drawing is frozen

**Never change the icon's SVG.** No new `path`, `circle`, `line` or any other shape. No edited `d`, `points` or coordinates. No removed elements, no changed colors, `viewBox`, stroke widths or `defs`. Not even "small cleanups".

You never edit the SVG yourself. You write a **motion plan** (JSON), and `scripts/icon-motion.mjs` applies it. The script can only:
- add one `<style data-motion>` block,
- add class names to existing elements (or wrap one in a bare `<g data-motion>` when it already has a `transform`),
- add `pathLength="1"` to elements you mark for line drawing,
- add `class`, `aria-hidden`, `focusable` and `data-state` to the root `<svg>`.

It then re-checks the output against the original and refuses to write anything if a single shape differs. Its CSS checker also rejects anything that could reshape the icon (`d`, `r`, `stroke-width`, `display`, masks, filters, `url()`), any selector that isn't scoped to the icon, and any style that changes the icon at rest.

If a request can only be done by changing the drawing (see "Requests the rule rules out"), say so and offer the closest motion that keeps it.

## Workflow

1. **Get the source SVG.** If the user gave one (file, paste, Lucide/Heroicons/Feather/Figma export), save it unchanged as `<name>.svg`; that file is never edited. If they only described an icon, draw a static one in the house style (below), save it, show it, and from that moment treat it as frozen like any other source.
2. **Take the brief** (see "Describing the animation"): icon, style, trigger, parts, feel and knobs. Restate it in one line.
3. **Inspect:** `node <skill-dir>/scripts/icon-motion.mjs inspect <name>.svg` lists the drawing elements by index. Pick the parts that should move and find their pivot points in the viewBox's coordinates.
4. **Write the plan** to `<name>.motion.json` (format below).
5. **Apply:** `node <skill-dir>/scripts/icon-motion.mjs apply <name>.svg <name>.motion.json`. This writes `<name>.animated.svg`. If it refuses, fix the **plan**, never the SVG, and run it again.
6. **Deliver** the animated SVG with a one-line spec and how to trigger it in their app. Never hand-edit the output afterwards; change the plan and re-apply.

`<skill-dir>` is the folder this file is in. Node 18+ is the only requirement.

## Describing the animation

People can ask in any of these ways, and mix them. Read every one of them as the same brief.

1. **Plain words:** "bell that jiggles when there's a notification", "lid pops open on hover, kinda bouncy".
2. **A style name** from the catalog below, alone or combined: "wiggle", "pop then shake", "draw + fade".
3. **Shorthand**, in any order, any subset: `bell: wiggle · hover · playful · large · 2x · 500ms`.
4. **Knobs** in words: "smaller", "slower", "only the arrow", "loop with a pause", "start after 200ms".
5. **A reference:** "like the iOS notification bell", "like Material's menu-to-close", "like a loading spinner". Map it to the closest catalog styles and say which you used.
6. **Per part, in sequence:** "lid lifts, then the can shakes". Each part gets its own class and timing.
7. **A motion plan** (JSON) written by the user. Validate it with `apply` and use it as-is.

Turn whatever you get into these slots. Anything left out takes the default.

| Slot | Listen for | Default |
|---|---|---|
| **Icon** | the SVG they gave, or the object they name | must have one |
| **Style** | a catalog name, or a verb: jiggle → wiggle, beat → heartbeat, rock → swing | the icon's usual style (see "Icon → style") |
| **Trigger** | on hover, while hovered, when clicked, turns into, when it appears, while loading | toggles → state, loaders → ambient, else hover |
| **Parts** | "only the arrow", "the lid", "whole icon" | the part the style is about, else the whole icon |
| **Feel** | subtle, smooth, snappy, playful, bouncy, elastic | subtle |
| **Intensity** | tiny, small, medium, large, big | medium |
| **Speed** | slow, normal, fast, or a duration in ms | from the trigger |
| **Repeat** | once, twice, 3x, loop, loop with a pause | once (loop for ambient) |
| **Delay, stagger** | "after 200ms", "one after another" | 0, and 40–80ms between parts |
| **Direction** | up, down, left, right, forward, clockwise, counter-clockwise | the direction the icon means |
| **Output** | React, inline, as an img, Vue | the `.svg` file |

- If there's no icon at all, ask one question: *"Which icon, and how should it move? You can paste the SVG."* Otherwise don't ask; fill gaps from the defaults.
- Restate the brief in one line before building: `Bell · wiggle · hover · body + clapper from the hanger · ±14° → 0, 4 swings · 600ms · subtle`.
- Several icons = a set: same feel, intensity, durations and easing for all, one plan per icon.

### Motion style catalog

Every style uses only `transform`, `opacity`, `stroke-dashoffset` or color, so every one keeps the drawing intact. Values are for **medium** intensity on a 24 grid.

| Style | Motion (keyframes) | Pivot | Fits |
|---|---|---|---|
| **wiggle** | rotate 0 → 12° → −10° → 6° → −3° → 0 | the attachment point (bell hanger, tag hole) | hover, notification |
| **swing** | pendulum: rotate 0 → 15° → −12° → 8° → −4° → 0, `ease-in-out` | top centre | hover |
| **shake** | translateX 0 → −2 → 2 → −1.5 → 1 → 0 | none | error, "no", click |
| **nudge** | translate 2px in the direction and back | none | hover on arrows, chevrons, send |
| **fly-through** | move 6px out with opacity → 0, jump to −6px, come back in with opacity → 1 | none | click on send, download, upload, next |
| **bounce** | translateY 0 → −3 → 0 → −1 → 0, scaleY .94 at each landing | bottom centre | hover, attention |
| **pop** | scale 1 → 1.18 → .95 → 1 with overshoot | `fill-box` centre | click on like, star, bookmark |
| **jelly** | scale (1.15, .85) → (.9, 1.1) → (1.05, .95) → 1 | bottom centre | playful click |
| **pulse** | scale 1 → 1.08 → 1, opacity 1 → .75 → 1, looping | centre | ambient: live, recording |
| **heartbeat** | scale 1 → 1.15 → 1 → 1.1 → 1 in the first 40%, then rest | centre | ambient, like |
| **spin** | rotate 0 → 360° | centre (`12px 12px`) | refresh on hover (once), loading (loop) |
| **tilt** | rotate to 8° and hold while hovered (`transition`) | the base or hinge | hover on settings, edit, pen |
| **grow** | scale to 1.1 and hold while hovered (`transition`) | `fill-box` centre | hover, focus |
| **flip** | scaleX 1 → 0 → 1 (a half turn that returns) | centre | click, toggle |
| **blink** | scaleY 1 → .1 → 1 in 150ms, long rest between | the part's centre | eye, hover or ambient |
| **float** | translateY 0 → −1.5 → 0, 2.4s `ease-in-out`, looping | none | ambient, idle states |
| **tada** | scale .9 + rotate −3° → 1.1 + 3° → −3° → 3° → 1, 0° | centre | success, celebrate |
| **draw** | `drawLine`, dashoffset 1 → 0, parts one after another | none | entrance: check, success; hover redraw |
| **fade** | opacity 0 → 1 (entrance) or 1 → .5 → 1 (hover) | none | entrance, subtle hover |
| **slide-in** | translate −4px → 0 with opacity 0 → 1 | none | entrance |
| **lid / hinge** | rotate −15° to −25° around a corner of the part | the hinge corner | trash, box, chest, folder |
| **toggle** | parts rotate or translate into a new arrangement with `transition` (menu → X) | the icon centre | state change |
| **color** | stroke or fill → `var(--icon-accent, currentColor)` | none | hover, active, state |
| **sequence** | two styles back to back in one keyframe timeline, e.g. pop 0–40% then wiggle 40–100% | per style | combos like "pop then shake" |

Pivots are in the viewBox's own units (`transform-origin: 12px 3px`) or `transform-box: fill-box; transform-origin: center`. Read the coordinates from `inspect`.

### Knobs

| Knob | How to apply it |
|---|---|
| **Intensity** | Scale the catalog values: tiny ×0.4, small ×0.6, medium ×1, large ×1.5, big ×2. Cap at 25° rotation, 4px move and 1.25 scale on a 24 grid. Beyond that it stops reading as a UI icon, so say so. |
| **Speed** | Base durations: hover 250–400ms, click 300–600ms, state 250–400ms, entrance 300–500ms, loops 0.8–1.6s per cycle. slow ×1.5, fast ×0.6, or the exact ms given. |
| **Repeat** | once: one run. Nx: `animation-iteration-count: N`. loop: `infinite`, which makes it ambient. Loop with a pause: keep `infinite`, finish the motion by 50–60% and hold the static frame for the rest. |
| **Hold vs play** | "on hover" plays through once (`animation`). "while hovered" holds the end pose and returns on leave (`transition` on a `:hover` rule). |
| **Delay, stagger** | `animation-delay` for the whole icon; add 40–80ms more per part for "one after another". |
| **Direction** | Pick the sign of the move or rotation. "forward" means where the icon points (send = up-right, download = down). Counter-clockwise spin = 0 → −360°. |
| **Easing** | linear `linear` · smooth `cubic-bezier(.2,.8,.2,1)` · snappy `cubic-bezier(.4,0,.2,1)` · bouncy `cubic-bezier(.34,1.56,.64,1)` · elastic: extra keyframes with shrinking overshoots (1.2 → .9 → 1.05 → 1) · gentle `ease-in-out`. |

### Icon → style (defaults when only the icon is named)

bell → wiggle · heart, star, bookmark → pop · download, upload, send, arrows → nudge or fly-through · trash, box, folder → lid · refresh, sync, settings → spin · menu → toggle · check, success → draw · alert, error → shake · eye → blink · search → tilt · plus → spin 90° · live, mic → pulse.

## The motion plan

```json
{
  "name": "bell",
  "trigger": "hover",
  "spec": "Bell · hover · swings ±14° from its hanger, 4 decaying swings · 600ms · subtle",
  "wiring": "Plays on hover of the icon or its parent button.",
  "targets": [
    { "el": 0, "class": "bell-clapper" },
    { "el": 1, "class": "bell-body" }
  ],
  "css": ".icon-bell .bell-body, .icon-bell .bell-clapper { transform-origin: 12px 2px; }\n.icon-bell:hover .bell-body, button:hover > .icon-bell .bell-body { animation: bell-ring .6s cubic-bezier(.2,.8,.2,1); }\n.icon-bell:hover .bell-clapper, button:hover > .icon-bell .bell-clapper { animation: bell-ring .6s cubic-bezier(.2,.8,.2,1) .04s; }\n@keyframes bell-ring { 0%,100% { transform: rotate(0) } 20% { transform: rotate(14deg) } 40% { transform: rotate(-10deg) } 60% { transform: rotate(6deg) } 80% { transform: rotate(-3deg) } }"
}
```

- `name`: lowercase-hyphenated. The root gets class `icon icon-<name>`.
- `trigger`: `hover` · `click` · `state` · `entrance` · `ambient`.
- `targets`: `el` is the index from `inspect`. Several elements can share a class to move together. Add `"drawLine": true` to give an element `pathLength="1"` for line drawing (not allowed if it already has a dash pattern). Add `"wrap": true` only when you need a wrapper; elements with a `transform` attribute are wrapped automatically, and then a drawLine element also gets `<class>-line` for its dash rules.
- `css`: rules and keyframes. The script appends the `prefers-reduced-motion` rule itself.

## What the CSS may do

Every selector must contain `.icon-<name>`, and every `@keyframes` name must start with `<name>-`. Inline SVG styles apply to the whole page, so this scoping is what keeps icons from touching each other.

| Where | Allowed properties |
|---|---|
| **At rest** (selector has no trigger) | `transform-origin`, `transform-box`, `animation*`, `transition*`, `will-change`, and `stroke-dasharray: 1` (a full-length dash looks identical) |
| **Under a trigger** (`:hover`, `:focus`, `:active`, `.is-animating`, `[data-state…]`) | the above plus `transform`, `opacity`, `stroke-dashoffset`, `stroke-dasharray`, `fill`, `stroke`, `color`, `fill-opacity`, `stroke-opacity`, `visibility` |
| **In @keyframes** | `transform`, `opacity`, `stroke-dashoffset`, `stroke-dasharray`, `fill`, `stroke`, `color`, `fill-opacity`, `stroke-opacity`, `visibility`, `animation-timing-function` |

Nothing else: no `d`, `r`, `cx`, `width`, `stroke-width`, `display`, `clip-path`, `mask`, `filter`, `url()`, `@import`, or other `@media`. Ambient loops declare `animation` at rest; that's allowed because the keyframes start and end on the static frame.

### Pivots: the most common bug

In SVG, CSS transforms pivot around the viewBox origin (0,0) by default, not around the shape. Always set a pivot for anything that rotates or scales:
- `transform-origin: 12px 2px;` — a point in the viewBox's own units (on a 24 grid: a bell's hanger, a lid's hinge, a gear's centre at `12px 12px`). Read the coordinates from `inspect`.
- `transform-box: fill-box; transform-origin: center;` — around the element's own centre.

For non-24 viewBoxes, use that viewBox's units and scale amplitudes to it (a 2px nudge on 24 is about 4 units on a 48 grid).

## Triggers and hooks

Use exactly these hooks, so the app can trigger the icon:

| Trigger | Selector to use | App does |
|---|---|---|
| hover | `.icon-x:hover .part, button:hover > .icon-x .part` | nothing |
| click | `.icon-x.is-animating .part` | adds `is-animating`, removes it on `animationend` |
| state | `.icon-x[data-state="open"] .part` with a `transition` | toggles `data-state` between `closed` (rest) and `open` |
| entrance | `.icon-x.is-animating .part` with `animation-fill-mode: both` | adds `is-animating` when the icon appears |
| ambient | animation declared at rest, `infinite` | nothing |

As `<img>` or a CSS background, only ambient loops play; say so if they asked for anything else.

## Worked examples

- **Menu ↔ close (toggle):** three existing lines, centre pivot `transform-origin: 12px 12px`. Top: `rotate(45deg) translateY(6px)`. Bottom: `rotate(-45deg) translateY(-6px)`. Middle: `opacity: 0`. All under `[data-state="open"]` with a `transition` at rest. Write rotate first: CSS applies right to left, so the line moves to the centre and then turns.
- **Check (draw, entrance):** `drawLine` on the ring and the tick, `stroke-dasharray: 1` at rest, dashoffset 1 → 0 under `.is-animating` with `both` fill, tick 300ms later.
- **Like (pop then wiggle, click):** one keyframe timeline: 0–40% pop, 40–100% wiggle, `transform-box: fill-box; transform-origin: center`.

## Requests the rule rules out

These need shapes the icon doesn't have, or reshaping the ones it has. Say so in one sentence and offer the alternative:

| Request | Why not | Offer instead |
|---|---|---|
| Morph play ↔ pause, sun ↔ moon | changes path data | Cross-fade, if the user supplies both icons in one SVG; otherwise scale or rotate out and back |
| Add sparkles, motion lines, a badge dot, confetti | new shapes | Pop, bounce or shake the icon itself; the app can add a badge separately |
| Reveal with a mask or clip | adds a mask shape | Line drawing or a fade |
| Thicker stroke on hover | changes the drawing | Scale 1.05–1.1 or a color change |
| Blur, glow, shadow | adds a filter | Opacity or color change |

## Motion craft

- **Small amplitudes:** rotations 10–20°, moves 1–3px on a 24 grid, scale 0.85–1.15. Icons nudge; they don't dance.
- **One idea per icon.** A bell rings; it doesn't also change color and bounce.
- **Motion matches meaning:** download goes down, refresh turns clockwise, send goes forward.
- **Start and end on the static frame.** Except during `state: open`, the icon at rest must look exactly like the source.
- **Stagger** related parts by 40–80ms.

## House style (only when you draw the source yourself)

24×24 `viewBox`, 2px padding, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"` on the root, at most about 6 shapes, legible at 16px. Split parts that will move into separate elements now, because they can't be split later.

## Output formats

- **SVG** (default): `<name>.animated.svg`.
- **React:** keep the animated SVG as a file and render it as-is (for example Vite `import svg from "./bell.animated.svg?raw"` with `dangerouslySetInnerHTML`, or SVGR). Don't retype it as JSX by hand. Expose state as a prop that sets `data-state` or toggles `is-animating`.
- **Vue / other:** same approach: import the file, don't retype it.

## Checking any SVG

`node <skill-dir>/scripts/icon-motion.mjs verify <original.svg> <animated.svg>` confirms an animated file draws exactly what its original draws, wherever the animated file came from.

If Node isn't available, make only the edits the script would make (one `<style>`, classes, `pathLength="1"`, bare `<g>` wrappers), follow the CSS table exactly, and tell the user the output couldn't be machine-verified.
