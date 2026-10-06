#!/usr/bin/env node
// icon-motion: animate an SVG icon without changing its drawing.
//
//   node icon-motion.mjs inspect <icon.svg>
//       List the drawing elements by index, for writing a motion plan.
//   node icon-motion.mjs apply <icon.svg> <plan.json> [--out file.svg]
//       Apply the plan and write <icon>.animated.svg.
//       Refuses (exit 1) if the plan would change or add any shape.
//   node icon-motion.mjs verify <original.svg> <animated.svg>
//       Check any animated SVG against its original. Exit 1 if the drawing changed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { apply, verify, inspect } from "./motion-core.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const flags = {}, pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) { const k = rest[i].slice(2); flags[k] = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : true; }
  else pos.push(rest[i]);
}
const fail = (msg) => { console.error(msg); process.exit(1); };
const read = (p) => { if (!p || !existsSync(p)) fail(`File not found: ${p ?? "(missing argument)"}`); return readFileSync(p, "utf8"); };

try {
  if (cmd === "inspect") {
    const els = inspect(read(pos[0]));
    console.log(`${els.length} drawing elements (use these indexes as "el" in the plan):`);
    for (const e of els) console.log("  " + e.summary);
  } else if (cmd === "apply") {
    const svgPath = pos[0], planPath = pos[1];
    const original = read(svgPath);
    let plan;
    try { plan = JSON.parse(read(planPath)); } catch (e) { fail(`${planPath} isn't valid JSON: ${e.message}`); }
    const out = apply(original, plan);
    const outPath = typeof flags.out === "string" ? flags.out : join(dirname(svgPath), basename(svgPath).replace(/\.svg$/i, "") + ".animated.svg");
    if (resolve(outPath) === resolve(svgPath)) fail("Refusing to overwrite the original SVG. Pass a different --out.");
    writeFileSync(outPath, out);
    console.log(`✓ ${outPath}  (drawing verified unchanged)`);
  } else if (cmd === "verify") {
    const r = verify(read(pos[0]), read(pos[1]));
    if (r.ok) console.log("✓ Same drawing: no shapes added, removed or changed.");
    else fail("✗ The drawing changed:\n- " + r.problems.join("\n- "));
  } else {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 10).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  fail(e.message);
}
