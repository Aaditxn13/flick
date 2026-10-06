// motion-core: apply a motion plan to an SVG without changing its drawing.
// Dependency-free; runs in Node and in the browser.
//
// The only edits this engine can make:
//   - a <style data-motion> block right after the <svg> tag
//   - class names on existing elements (or on a <g data-motion> wrapper)
//   - pathLength="1" on elements chosen for line drawing
//   - class / aria-hidden / focusable / data-state on the root <svg>
// verify() re-checks any output against the original independently of apply().

export const DRAWING = new Set(["path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "use", "text", "tspan", "textPath", "image"]);
export const TRIGGERS = ["hover", "click", "state", "entrance", "ambient"];
const ROOT_EXTRA = new Set(["class", "aria-hidden", "focusable", "data-state", "role", "aria-label"]);
const NAME_RE = /^[a-z][a-z0-9-]{0,40}$/;

/* ---------------- tokenizer ---------------- */

function parseAttrs(text) {
  const out = [];
  const re = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while ((m = re.exec(text))) out.push({ name: m[1], value: m[2] ?? m[3] ?? "" });
  return out;
}

export function tokenize(src) {
  const tags = [];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(src))) {
    if (!m[2]) continue;
    const t = { name: m[2], close: !!m[1], self: !!m[4], start: m.index, end: re.lastIndex, attrs: parseAttrs(m[3] || "") };
    tags.push(t);
    if (!t.close && !t.self && /^(style|script)$/i.test(t.name)) {
      const endIdx = src.indexOf("</" + t.name, re.lastIndex);
      if (endIdx < 0) throw new Error(`<${t.name}> is never closed.`);
      t.body = src.slice(re.lastIndex, endIdx);
      re.lastIndex = endIdx;
    }
  }
  return tags;
}

const attrMap = (t) => Object.fromEntries(t.attrs.map((a) => [a.name, a.value]));
const opens = (tags, name) => tags.filter((t) => !t.close && t.name === name);
const drawingTags = (tags) => tags.filter((t) => !t.close && DRAWING.has(t.name));
const hasMarker = (t) => t.attrs.some((a) => a.name === "data-motion");

function matchingCloseEnd(tags, i) {
  const open = tags[i];
  if (open.self) return open.end;
  let depth = 0;
  for (let j = i; j < tags.length; j++) {
    const t = tags[j];
    if (t.name !== open.name) continue;
    if (!t.close && !t.self) depth++;
    else if (t.close && --depth === 0) return t.end;
  }
  throw new Error(`<${open.name}> is never closed.`);
}

/** Describe the drawing elements so a plan can refer to them by index. */
export function inspect(svg) {
  const tags = tokenize(svg);
  if (!tags.some((t) => !t.close && t.name === "svg")) throw new Error("No <svg> element found.");
  return drawingTags(tags).map((t, i) => {
    const a = attrMap(t);
    const geo = a.d ? `d="${a.d.length > 60 ? a.d.slice(0, 60) + "…" : a.d}"`
      : ["points", "cx", "cy", "r", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "href"]
          .filter((k) => k in a).map((k) => `${k}="${a[k]}"`).join(" ");
    return { index: i, tag: t.name, summary: `${i}: <${t.name} ${geo}${a.class ? ` class="${a.class}"` : ""}${a.transform ? ` transform="${a.transform}"` : ""}>` };
  });
}

/* ---------------- CSS checks ---------------- */

const REST_PROPS = ["transform-origin", "transform-box", "will-change"];
const PAINT_PROPS = ["transform", "opacity", "stroke-dashoffset", "stroke-dasharray", "fill", "stroke", "color", "fill-opacity", "stroke-opacity", "visibility"];
const isTiming = (p) => p.startsWith("animation") || p.startsWith("transition");
const TRIGGER_RE = /:hover|:focus|:active|\.is-animating|\[data-state/;

function parseCss(s) {
  let i = 0;
  function block(depth) {
    const items = [];
    let buf = "";
    while (i < s.length) {
      const c = s[i];
      if (c === "{") {
        i++;
        const prelude = buf.trim(); buf = "";
        if (/^@(media|supports)\b/.test(prelude)) items.push({ type: "at", prelude, children: block(depth + 1) });
        else if (/^@(-webkit-)?keyframes\b/.test(prelude)) items.push({ type: "keyframes", prelude, children: block(depth + 1) });
        else if (prelude.startsWith("@")) throw new Error(`"${prelude}" isn't allowed in icon CSS.`);
        else {
          const j = s.indexOf("}", i);
          if (j < 0) throw new Error("A CSS rule is missing its closing }.");
          if (s.slice(i, j).includes("{")) throw new Error(`Nested rules aren't allowed (in "${prelude}").`);
          items.push({ type: "rule", prelude, decls: s.slice(i, j) });
          i = j + 1;
        }
      } else if (c === "}") {
        if (depth === 0) throw new Error("The CSS has an extra }.");
        if (buf.trim()) throw new Error(`Stray CSS text: "${buf.trim().slice(0, 40)}".`);
        i++;
        return items;
      } else { buf += c; i++; }
    }
    if (depth > 0) throw new Error("The CSS is missing a closing }.");
    if (buf.trim()) throw new Error(`Stray CSS text: "${buf.trim().slice(0, 40)}".`);
    return items;
  }
  return block(0);
}

function decls(text) {
  return text.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
    const k = d.indexOf(":");
    if (k < 0) throw new Error(`"${d}" isn't a CSS declaration.`);
    return { prop: d.slice(0, k).trim().toLowerCase(), value: d.slice(k + 1).trim() };
  });
}

export function checkCss(css, name) {
  const problems = [];
  const scope = ".icon-" + name;
  if (/<|url\s*\(|@import|expression\s*\(|\\/i.test(css)) problems.push("CSS may not contain <, url(), @import or backslashes.");
  let items;
  try { items = parseCss(css.replace(/\/\*[\s\S]*?\*\//g, "")); } catch (e) { return [e.message]; }
  const keyframes = new Set();

  const checkRule = (r, inReduced) => {
    const parts = r.prelude.split(",").map((p) => p.trim());
    for (const p of parts) if (!p.includes(scope)) problems.push(`Selector "${p}" must include ${scope} so it can't affect anything else on the page.`);
    const triggered = parts.every((p) => TRIGGER_RE.test(p));
    for (const { prop, value } of decls(r.decls)) {
      if (inReduced) { if (!isTiming(prop)) problems.push(`Only animation/transition may be set inside prefers-reduced-motion (found ${prop}).`); continue; }
      if (isTiming(prop) || REST_PROPS.includes(prop)) continue;
      if (triggered && PAINT_PROPS.includes(prop)) continue;
      if (!triggered && prop === "stroke-dasharray" && value.replace(/\s+/g, "") === "1") continue; // full-length dash = unchanged look
      if (PAINT_PROPS.includes(prop)) problems.push(`"${prop}" in "${r.prelude}" would change the icon at rest. Put it in @keyframes or under a trigger (:hover, .is-animating, [data-state]).`);
      else problems.push(`"${prop}" isn't allowed: icon CSS may only move, fade, recolor or line-draw existing shapes.`);
    }
  };

  for (const it of items) {
    if (it.type === "rule") checkRule(it, false);
    else if (it.type === "at") {
      if (!/prefers-reduced-motion/.test(it.prelude)) { problems.push(`Only @media (prefers-reduced-motion) is allowed (found "${it.prelude}").`); continue; }
      for (const c of it.children) c.type === "rule" ? checkRule(c, true) : problems.push("Only plain rules are allowed inside @media.");
    } else if (it.type === "keyframes") {
      const kf = it.prelude.replace(/^@(-webkit-)?keyframes\s+/, "").trim();
      if (!kf.startsWith(name + "-")) problems.push(`Keyframes "${kf}" must be named ${name}-something.`);
      keyframes.add(kf);
      for (const c of it.children) {
        if (c.type !== "rule") { problems.push("Keyframes may only contain frames."); continue; }
        for (const { prop } of decls(c.decls)) if (!PAINT_PROPS.includes(prop) && prop !== "animation-timing-function") problems.push(`"${prop}" isn't allowed in keyframes.`);
      }
    }
  }
  return problems;
}

/* ---------------- plan ---------------- */

export function validatePlan(plan, elementCount) {
  const p = [];
  if (!plan || typeof plan !== "object") return ["The motion plan must be a JSON object."];
  if (!NAME_RE.test(plan.name || "")) p.push(`"name" must be lowercase letters, digits and hyphens (got "${plan.name}").`);
  if (!TRIGGERS.includes(plan.trigger)) p.push(`"trigger" must be one of ${TRIGGERS.join(", ")}.`);
  if (!Array.isArray(plan.targets) || !plan.targets.length) p.push(`"targets" must list at least one element to animate.`);
  else for (const t of plan.targets) {
    if (!Number.isInteger(t.el) || t.el < 0 || t.el >= elementCount) p.push(`Target element ${t.el} doesn't exist (the icon has ${elementCount} drawing elements, 0–${elementCount - 1}).`);
    if (!NAME_RE.test(t.class || "")) p.push(`Target class "${t.class}" must be lowercase letters, digits and hyphens.`);
  }
  if (typeof plan.css !== "string" || !plan.css.trim()) p.push(`"css" is required.`);
  else if (plan.css.length > 10000) p.push(`"css" is too long for an icon.`);
  else if (NAME_RE.test(plan.name || "")) p.push(...checkCss(plan.css, plan.name));
  return p;
}

function withAttrs(src, tag, { addClass, set = {} }) {
  let text = src.slice(tag.start, tag.end);
  const tail = tag.self ? /\s*\/>$/ : /\s*>$/;
  const has = attrMap(tag);
  if (addClass) {
    if ("class" in has) {
      const merged = [...new Set((has.class + " " + addClass).split(/\s+/).filter(Boolean))].join(" ");
      text = text.replace(/(\sclass\s*=\s*)("[^"]*"|'[^']*')/, `$1"${merged}"`);
    } else set = { class: addClass, ...set };
  }
  const extra = Object.entries(set).filter(([k]) => !(k in has)).map(([k, v]) => ` ${k}="${v}"`).join("");
  return text.replace(tail, (m) => extra + m);
}

export function apply(svg, plan) {
  const source = svg.replace(/^﻿/, "");
  const tags = tokenize(source);
  const rootIdx = tags.findIndex((t) => !t.close && t.name === "svg");
  if (rootIdx < 0) throw new Error("No <svg> element found.");
  const drawing = drawingTags(tags);
  const problems = validatePlan(plan, drawing.length);
  if (problems.length) { const e = new Error("The motion plan was refused:\n- " + problems.join("\n- ")); e.problems = problems; throw e; }

  // merge targets per element
  const per = new Map();
  for (const t of plan.targets) {
    const cur = per.get(t.el) || { classes: [], drawLine: false, wrap: false };
    cur.classes.push(t.class); cur.drawLine ||= !!t.drawLine; cur.wrap ||= !!t.wrap;
    per.set(t.el, cur);
  }

  const edits = []; // {start, end, text}
  const root = tags[rootIdx];
  const rootAttrs = attrMap(root);
  const rootSet = {};
  if (!("aria-hidden" in rootAttrs) && !("role" in rootAttrs) && !("aria-label" in rootAttrs)) Object.assign(rootSet, { "aria-hidden": "true", focusable: "false" });
  if (plan.trigger === "state") rootSet["data-state"] = "closed";
  const reduced = `@media (prefers-reduced-motion: reduce) { .icon-${plan.name}, .icon-${plan.name} * { animation: none !important; transition: none !important; } }`;
  edits.push({ start: root.start, end: root.end, text: withAttrs(source, root, { addClass: `icon icon-${plan.name}`, set: rootSet }) + `\n<style data-motion="">\n${plan.css.trim()}\n${reduced}\n</style>\n` });

  for (const [el, t] of per) {
    const tag = drawing[el];
    const a = attrMap(tag);
    if (t.drawLine && ("pathLength" in a || "stroke-dasharray" in a)) throw new Error(`Element ${el} already has pathLength or a dash pattern; line drawing would change how it looks.`);
    const wrap = t.wrap || "transform" in a;
    const cls = t.classes.join(" ");
    const tagText = withAttrs(source, tag, { addClass: wrap ? (t.drawLine ? t.classes.map((c) => c + "-line").join(" ") : "") : cls, set: t.drawLine ? { pathLength: "1" } : {} });
    if (wrap) {
      const end = matchingCloseEnd(tags, tags.indexOf(tag));
      edits.push({ start: tag.start, end: tag.end, text: `<g class="${cls}" data-motion="">` + tagText });
      edits.push({ start: end, end, text: "</g>" });
    } else edits.push({ start: tag.start, end: tag.end, text: tagText });
  }

  edits.sort((x, y) => y.start - x.start || y.end - x.end);
  let out = source;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  const check = verify(source, out);
  if (!check.ok) throw new Error("Internal check failed, nothing was written:\n- " + check.problems.join("\n- "));
  return out;
}

/* ---------------- verify ---------------- */

const textOutside = (src) => src.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const sameAttrs = (a, b, ignore = new Set()) => {
  const ka = Object.keys(a).filter((k) => !ignore.has(k)).sort();
  const kb = Object.keys(b).filter((k) => !ignore.has(k)).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
};

/** Check that `output` draws exactly what `original` draws: same shapes, same geometry, nothing new. */
export function verify(original, output) {
  const problems = [];
  let A, B;
  try { A = tokenize(original); B = tokenize(output); } catch (e) { return { ok: false, problems: [e.message] }; }

  // 1. drawing elements: same count, order, tag and attributes (class may gain names; pathLength="1" may be added)
  const da = drawingTags(A), db = drawingTags(B);
  if (da.length !== db.length) problems.push(`Drawing elements changed: the original has ${da.length}, the output has ${db.length}. Nothing may be added or removed.`);
  da.forEach((t, i) => {
    const u = db[i];
    if (!u) return;
    if (t.name !== u.name) return problems.push(`Element ${i} was <${t.name}>, now <${u.name}>.`);
    const x = attrMap(t), y = attrMap(u);
    const ignore = new Set(["class"]);
    if (!("pathLength" in x) && y.pathLength === "1") ignore.add("pathLength");
    if (!sameAttrs(x, y, ignore)) problems.push(`Element ${i} (<${t.name}>) had its attributes changed.`);
    if ("class" in x && !(y.class || "").split(/\s+/).includes(x.class.split(/\s+/)[0])) problems.push(`Element ${i} lost its original class.`);
  });

  // 2. every other element: unchanged, except the root's accessibility/state attributes and our marked <g>/<style>
  const others = (tags) => tags.filter((t) => !t.close && !DRAWING.has(t.name) && !hasMarker(t));
  const oa = others(A), ob = others(B);
  if (oa.length !== ob.length) {
    const count = (ts) => ts.reduce((m, t) => m.set(t.name, (m.get(t.name) || 0) + 1), new Map());
    const ca = count(oa), cb = count(ob);
    const diff = [...new Set([...ca.keys(), ...cb.keys()])].filter((n) => ca.get(n) !== cb.get(n))
      .map((n) => `${(cb.get(n) || 0) > (ca.get(n) || 0) ? "added" : "removed"} <${n}>`);
    problems.push(`Structure changed (${diff.join(", ")}). Only <g data-motion> wrappers and one <style data-motion> may be added.`);
  }
  else oa.forEach((t, i) => {
    const u = ob[i];
    const isRoot = i === 0 && t.name === "svg";
    if (t.name !== u.name) problems.push(`<${t.name}> became <${u.name}>.`);
    else if (!sameAttrs(attrMap(t), attrMap(u), isRoot ? ROOT_EXTRA : new Set())) problems.push(`<${t.name}> had its attributes changed.`);
    else if (t.name === "style" && t.body !== u.body) problems.push("An existing <style> block was edited.");
  });

  // 3. what we added: <g data-motion> with only a class, and at most one <style data-motion>
  for (const t of B.filter((t) => !t.close && hasMarker(t))) {
    if (t.name === "g") { if (!sameAttrs(attrMap(t), { class: attrMap(t).class || "", "data-motion": "" })) problems.push("A motion wrapper <g> carries more than a class."); }
    else if (t.name !== "style") problems.push(`<${t.name} data-motion> isn't something the engine adds.`);
  }
  const styles = B.filter((t) => !t.close && t.name === "style" && hasMarker(t));
  if (styles.length > 1) problems.push("More than one motion <style> block.");
  const name = (attrMap(B.find((t) => !t.close && t.name === "svg") || { attrs: [] }).class || "").match(/icon-([a-z][a-z0-9-]*)/)?.[1];
  if (styles[0]) {
    if (!name) problems.push("The root <svg> is missing its icon-NAME class.");
    else problems.push(...checkCss(styles[0].body.replace(/@media \(prefers-reduced-motion: reduce\) \{ [^{}]*\{[^{}]*\} \}\s*$/, ""), name));
  }

  // 4. text content unchanged
  if (textOutside(original) !== textOutside(output)) problems.push("Text content changed.");

  return { ok: problems.length === 0, problems };
}
