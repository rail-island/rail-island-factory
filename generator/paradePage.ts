// The train parade's overview page, factory.railisland.com/parade/: every chain
// railisland.com drives across its hero, with its id - the value of the site's
// `?parade=` parameter, which plays that one chain only, for checking it - its
// category, length and a picture, in list order, shuffled into one round as the
// site plays it, or sorted by category (docs/site/train-parade.md).
//
// A standalone page written by writeParade.ts next to parade.json, not a route of
// the catalog app: it is a debugging aid, its data is inlined, and it embeds the
// source of `playOrder` itself, so Shuffle shows exactly the order the site uses.

import { RAILISLAND_URL, TRAIN_CATEGORIES, playOrder, type ParadeFile } from "./trainParade.ts";

/** Text for an HTML text node or a double-quoted attribute. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The overview page for `file`, a complete HTML document. */
export function paradePage(file: ParadeFile): string {
  // JSON inside <script>: "<" escaped so no string can close the element
  const data = JSON.stringify({ file, categories: TRAIN_CATEGORIES, site: RAILISLAND_URL }).replace(/</g, "\\u003c");
  const kinds = Object.entries(file.fleet.types).map(([k, n]) => `${esc(k)} ${n}`).join(", ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Train parade - Rail Island Factory</title>
<style>
  :root { color-scheme: dark; --bg: #0f1722; --panel: #172233; --line: #26364d; --text: #e6edf6; --muted: #9fb0c6; --accent: #f4b41a; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header, main { max-width: 1200px; margin: 0 auto; padding: 16px; }
  h1 { margin: 8px 0 4px; font-size: 22px; }
  h2 { margin: 24px 0 8px; font-size: 15px; color: var(--accent); }
  p { margin: 4px 0; color: var(--muted); }
  a { color: var(--accent); }
  code { font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 4px; }
  button { font: inherit; color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
  button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
  .chain { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; margin: 8px 0; }
  .head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
  .num { color: var(--muted); min-width: 2.5em; }
  .id { font-weight: 600; }
  .meta { color: var(--muted); }
  .strip { overflow-x: auto; margin-top: 8px; padding-bottom: 4px; }
  .train { position: relative; }
  .train > div { position: absolute; top: 0; }
  .train img { position: absolute; max-width: none; }
  .rail { position: absolute; left: 0; right: 0; height: 1px; background: #ffffff30; }
</style>
</head>
<body>
<header>
  <p><a href="/">Rail Island Factory</a></p>
  <h1>Train parade</h1>
  <p>The vehicle chains <a href="${esc(RAILISLAND_URL)}/">railisland.com</a> drives across its landing page, one at a time, each once per round in an order that spreads the categories. Open one alone there with <code>?parade=&lt;id&gt;</code>, for checking it.</p>
  <p>${file.trains.length} chains. Its caption counts: ${kinds}; ${file.fleet.variants} variants.</p>
  <div class="bar" role="group" aria-label="Order">
    <button type="button" data-order="list" aria-pressed="true">List order</button>
    <button type="button" data-order="shuffle" aria-pressed="false">Shuffle (one round, as the site plays it)</button>
    <button type="button" data-order="category" aria-pressed="false">Sort by category</button>
  </div>
</header>
<main id="chains"></main>
<script type="application/json" id="parade-data">${data}</script>
<script>
// playOrder's own source, as the build compiled it (its compiler may name functions through __name)
const __name = (f) => f;
const playOrder = ${playOrder.toString()};
const { file, categories, site } = JSON.parse(document.getElementById("parade-data").textContent);
const PX_PER_M = 8;
const main = document.getElementById("chains");

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  for (const c of children) e.append(c);
  return e;
}

// Animated cars on the page: each a canvas with its still image and the current
// frame of its sprite drawn into it, as railisland.com draws them (two images laid
// on each other would be snapped to device pixels separately and shimmer).
const SPEED_MPS = 22; // the site's speed, in metres of the model per second
const movers = [];
function load(src) {
  return new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
}
function animated(car, h) {
  const sp = car.sprite;
  const dpr = window.devicePixelRatio || 1;
  const canvas = el("canvas", { style: "position:absolute;inset:0;width:100%;height:100%" });
  canvas.width = Math.max(1, Math.round(car.widthM * PX_PER_M * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  Promise.all([load("/" + car.image), load("/" + sp.image)]).then(([still, sheet]) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    const k = canvas.width / car.widthM; // canvas pixels per metre
    movers.push({
      canvas, ctx, still, sheet, shown: -1, frames: sp.frames, cycleM: sp.cycleM,
      frameH: Math.round(sp.heightM * file.pxPerM), pitch: Math.round((sp.pitchM ?? sp.heightM) * file.pxPerM),
      dx: sp.xM * k, dy: sp.yM * k, dw: sp.widthM * k, dh: sp.heightM * k,
    });
  }, () => {});
  return canvas;
}
function draw(m, frame) {
  m.shown = frame;
  m.ctx.clearRect(0, 0, m.canvas.width, m.canvas.height);
  m.ctx.drawImage(m.still, 0, 0, m.canvas.width, m.canvas.height);
  m.ctx.drawImage(m.sheet, 0, frame * m.pitch, m.sheet.naturalWidth, m.frameH, m.dx, m.dy, m.dw, m.dh);
}
// the wheels turn as if the train ran at the site's speed (it stands still here)
function tick(now) {
  const distance = (now / 1000) * SPEED_MPS;
  for (let i = movers.length - 1; i >= 0; i--) {
    const m = movers[i];
    if (!m.canvas.isConnected) { movers.splice(i, 1); continue; }
    const cycle = distance / m.cycleM;
    const frame = Math.floor((cycle - Math.floor(cycle)) * m.frames) % m.frames;
    if (frame !== m.shown) draw(m, frame);
  }
  requestAnimationFrame(tick);
}
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(tick);
else setInterval(() => movers.forEach((m) => m.shown < 0 && draw(m, 0)), 500);

// One chain at PX_PER_M: every car's still image; an animated car as a canvas whose wheels and legs move.
function picture(train) {
  const h = file.heightM * PX_PER_M;
  const box = el("div", { class: "train", style: "height:" + h + "px;width:" + (train.lengthM + 1) * PX_PER_M + "px" });
  box.append(el("div", { class: "rail", style: "bottom:" + -file.bottomM * PX_PER_M + "px" }));
  for (const car of train.cars) {
    const c = el("div", { style: "left:" + (car.offsetM + 0.5) * PX_PER_M + "px;width:" + car.widthM * PX_PER_M + "px;height:" + h + "px" });
    if (car.sprite && car.sprite.frames > 1) c.append(animated(car, h));
    else c.append(el("img", { src: "/" + car.image, alt: "", loading: "lazy", style: "inset:0;width:100%;height:100%" }));
    box.append(c);
  }
  return el("div", { class: "strip" }, box);
}

function row(train, n) {
  const link = el("a", { href: site + "/?parade=" + encodeURIComponent(train.id), target: "_blank", rel: "noopener" }, "Show on railisland.com");
  const animated = train.cars.some((c) => c.sprite) ? ", animated" : "";
  const wire = train.wireM ? ", under a wire at " + train.wireM + " m" : "";
  const smoke = train.cars.some((c) => c.emitters && c.emitters.length) ? ", smokes" : "";
  const speed = train.speedMps ? ", " + train.speedMps + " m/s" : "";
  const head = el("div", { class: "head" },
    el("span", { class: "num" }, n + "."),
    el("code", { class: "id" }, train.id),
    el("span", {}, categories[train.category] || train.category),
    el("span", { class: "meta" }, train.lengthM.toFixed(1) + " m, " + train.cars.length + " image(s), " + (train.ground === "road" ? "on the road" : "on rails") + wire + animated + smoke + speed),
    link);
  return el("section", { class: "chain", id: train.id }, head, picture(train));
}

function show(order) {
  main.replaceChildren();
  let list = file.trains;
  if (order === "shuffle") list = playOrder(file.trains);
  if (order === "category") {
    for (const key of Object.keys(categories)) {
      const some = file.trains.filter((t) => t.category === key);
      if (!some.length) continue;
      main.append(el("h2", {}, categories[key] + " (" + some.length + ")"));
      some.forEach((t, i) => main.append(row(t, i + 1)));
    }
    return;
  }
  list.forEach((t, i) => main.append(row(t, i + 1)));
}

for (const b of document.querySelectorAll("[data-order]")) {
  b.addEventListener("click", () => {
    for (const o of document.querySelectorAll("[data-order]")) o.setAttribute("aria-pressed", String(o === b));
    show(b.dataset.order);
  });
}
show("list");
</script>
</body>
</html>
`;
}
