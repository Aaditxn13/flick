#!/usr/bin/env node
// Builds docs/index.html from template.html. Every demo icon is produced by the
// skill's own engine, so the docs can only show motion that keeps the drawing intact.
//   REPO=you/flick node docs/build.mjs [--body-only out.html]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { apply, verify } from "../skills/flick/scripts/motion-core.mjs";
import { DEMOS } from "./demos.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.REPO || "Aaditxn13/flick";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const TRIGGER_LABEL = { hover: "on hover", click: "on click", state: "toggles", entrance: "on appear", ambient: "loops" };

const animated = new Map();
for (const d of DEMOS) {
  const out = apply(d.svg, d.plan);
  if (!verify(d.svg, out).ok) throw new Error(`Demo ${d.style} failed verification`);
  animated.set(d.style, out.replace(/^<\?xml[^>]*>\s*/, ""));
}
const demoButton = (d, label) => `<button class="demo" data-trigger="${d.trigger}" aria-label="${esc(label)}">${animated.get(d.style)}</button>`;

const cards = DEMOS.map((d) => `
          <article class="card">
            ${demoButton(d, `${d.style} demo on a ${d.icon} icon, plays ${TRIGGER_LABEL[d.trigger]}`)}
            <div class="row"><span class="name">${d.style}</span><span class="trig">${TRIGGER_LABEL[d.trigger]}</span></div>
            <p class="desc">${esc(d.desc)}</p>
            <p class="ask">${esc(d.prompt)}</p>
          </article>`).join("");
const strip = ["wiggle", "pop", "nudge", "spin", "lid", "toggle", "draw"].map((s) => {
  const d = DEMOS.find((x) => x.style === s);
  return demoButton(d, `${d.icon} icon, ${s}, plays ${TRIGGER_LABEL[d.trigger]}`);
}).join("");

const body = readFileSync(join(here, "template.html"), "utf8")
  .replace("__CARDS__", cards).replace("__STRIP__", strip).replaceAll("__REPO__", REPO);

const bodyOnlyIdx = process.argv.indexOf("--body-only");
if (bodyOnlyIdx > -1) writeFileSync(process.argv[bodyOnlyIdx + 1], body);

const [title, ...rest] = body.split("\n");
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="An agent skill that animates SVG UI icons from a sentence, without changing the drawing.">
${title}
${rest.join("\n").replace("<style>\n", "<style>\nhtml, body { margin: 0; }\n")}
</html>
`.replace(/(<\/style>)\n/, "$1\n</head>\n<body>\n").replace(/\n<\/html>\n$/, "\n</body>\n</html>\n");
writeFileSync(join(here, "index.html"), page);
console.log(`✓ docs/index.html  (${DEMOS.length} demos verified, repo ${REPO})`);
