# flick

An agent skill that animates UI icons from a sentence. Describe how the icon should move; **your SVG stays exactly as it is** and only motion is added.

**Docs and live demos:** [`docs/index.html`](docs/index.html). To host them, turn on GitHub Pages for the `docs` folder.

## 1. Install

```bash
npx skills add Aaditxn13/flick
```

| For | Command |
|---|---|
| Any agent | `npx skills add Aaditxn13/flick` |
| Claude Code only | `npx skills add Aaditxn13/flick --agent claude-code` |
| All your projects | `npx skills add Aaditxn13/flick -g -y` |

This adds one folder: the skill's instructions and a small checking script. There are no dependencies; Node 18+ runs the checks. If your agent was already open, start a new session so it picks the skill up.

## 2. Add your idea

```
/flick <your idea>
```

Say which icon, and how it should move. Paste your SVG in the same message or give its path. No SVG yet? Name the icon and it draws a simple one first.

```
/flick bell that rings on hover
/flick heart that pops when liked, kinda bouncy
/flick ./icons/trash.svg lid lifts on hover, slow
/flick bell: wiggle · hover · playful · large · 2x · 500ms
/flick send: pop then fly-through, on click
/flick menu that turns into an X when open, as a React component
/flick download icon, only the arrow moves, loop with a pause
/flick notification bell like iOS, subtle
```

You get `<icon>.animated.svg` next to your file, plus one line on how to trigger it from your app. You can also skip the command and just ask ("animate this icon so it…"); the skill triggers on its own.

---

## Styles

wiggle · swing · shake · nudge · fly-through · bounce · pop · jelly · pulse · heartbeat · spin · tilt · grow · flip · blink · float · tada · draw · fade · slide-in · lid/hinge · toggle · color. Combine two with "then".

## Options

Say any of these, in any words. Anything left out gets a sensible default for that icon.

| Option | Say | Default |
|---|---|---|
| style | wiggle, pop, shake, nudge, spin, draw… or a verb like "jiggle" | per icon |
| trigger | on hover, while hovered, when clicked, turns into, when it appears, while loading | hover |
| feel | subtle, snappy, playful, bouncy, elastic | subtle |
| intensity | tiny, small, medium, large, big | medium |
| speed | slow, fast, or a duration like 500ms | per trigger |
| repeat | once, 2x, loop, loop with a pause | once |
| parts | "only the arrow", "the lid", "whole icon" | what the style is about |
| timing | "after 200ms", "one after another" | no delay |
| direction | up, down, forward, clockwise… | what the icon means |
| output | SVG, React, Vue, for an `<img>` | `.svg` file |

## Your SVG stays yours

The agent never writes your SVG. It writes a **motion plan** (CSS plus which existing shapes move), and a script applies it with a short list of allowed edits: one `<style>` block, class names, a bare `<g>` around a shape that already has a transform, `pathLength="1"` for line drawing, and `aria-hidden` / `data-state` on the root. It then compares every shape with your original and refuses to save if one differs.

It also rejects CSS that could reshape the icon (`d`, `r`, `stroke-width`, masks, filters, `url()`), CSS that reaches outside the icon, and anything that changes the icon at rest. A request that needs new shapes, like sparkles or play morphing into pause, gets the closest motion that keeps your drawing, with a note saying what was left out.

## CLI

The skill runs these for you. They live in the installed skill folder.

```bash
node scripts/icon-motion.mjs inspect bell.svg                  # list shapes by index
node scripts/icon-motion.mjs apply bell.svg bell.motion.json   # → bell.animated.svg
node scripts/icon-motion.mjs verify bell.svg bell.animated.svg # did any drawing change?
```


## Repo layout

```
skills/flick/
  SKILL.md                 instructions the agent follows
  scripts/motion-core.mjs  apply + verify engine (no dependencies)
  scripts/icon-motion.mjs  CLI: inspect, apply, verify
docs/
  index.html               docs site with live demos (built)
  build.mjs, demos.mjs     rebuild: REPO=you/flick node docs/build.mjs
```

Motion principles from [Interactive SVG Animations](https://www.svg.guide/) by Nanda Syahrasyad. MIT license.
