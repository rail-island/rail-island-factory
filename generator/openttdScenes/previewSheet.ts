// The OpenTTD view headlessly (docs/site/openttd-export.md, "The OpenTTD view"): a
// model's whole one-click pack drawn into its prerendered yard with its labels, as
// the model page's OpenTTD view draws it - the same sprite frames (projection.ts), zoom filter
// (pixels.ts) and placement (scene.ts) - with a small software rasterizer standing
// in for the page's WebGL renderer (flat Lambert, the same lights). For checks and
// for the images sent to the user; the site never runs it.
//
//   pnpm exec tsx generator/openttdScenes/previewSheet.ts <model id> <out.png> [--zoom 4x|1x] [--page n] [--fit <width>x<height>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { catalogFields, DESIGNS, toGlb } from "../generate.ts";
import { collectTriangles, parseGlb, triBounds, type Tri } from "../glbTriangles.ts";
import { catalogOpenttd, openttdFeatureOf } from "../openttd.ts";
import { zoomImages } from "../../src/openttd/pixels.ts";
import { applyMatrix, spriteViews, type ModelBox, type SpriteView } from "../../src/openttd/projection.ts";
import { oneClickItems, partLengths, resolveItem, type OpenttdFeature } from "../../src/openttd/properties.ts";
import {
  chooseView, FRONT_MARGIN, frontPoint, labelsOverlap, preferTags, kindOf, labelRect, placeParts, SCENE_SLOTS, sceneName, viewRect, type Placement, type PreviewZoom, type Rect,
} from "../../src/openttd/scene.ts";
import type { CatalogRecord } from "../catalog.ts";
import { GRF_ZOOM, type GrfImage } from "../../src/openttd/grf.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCENES = path.resolve(HERE, "../../src/openttd/scenes");
export const SUPERSAMPLE = 4;
/** Towards the light in tile units, and the lights' strengths: spriteRenderer.ts. */
const LIGHT = (() => {
  const v = [1, -0.5, 1.5];
  const n = Math.hypot(...v);
  return v.map((c) => c / n) as [number, number, number];
})();
const AMBIENT = 1.2;
const SUN = 1.5;

const toSrgb = (c: number): number => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/** One sprite's frame at RENDER_ZOOM x SUPERSAMPLE, premultiplied RGBA, top row first (SpriteRenderer.render). */
export function rasterize(tris: readonly Tri[], view: SpriteView, turned: boolean): Uint8Array {
  const W = view.width * SUPERSAMPLE;
  const H = view.height * SUPERSAMPLE;
  const rgba = new Uint8Array(W * H * 4);
  const depth = new Float32Array(W * H).fill(Infinity);
  for (const t of tris) {
    const tile = t.p.map((p) => applyMatrix(view.model, turned ? [-p[0], p[1], -p[2]] : p));
    // clipping: a triangle with a corner outside a plane is cut per pixel below
    const plane = view.clip.map((c) => tile.map((p) => c.normal[0] * p[0] + c.normal[1] * p[1] + c.normal[2] * p[2] + c.constant));
    if (plane.some((d) => d.every((v) => v < 0))) continue;
    const ndc = tile.map((p) => applyMatrix(view.projection, p));
    const sx = ndc.map((p) => ((p[0] + 1) / 2) * W);
    const sy = ndc.map((p) => ((1 - p[1]) / 2) * H);
    // flat Lambert: the face normal in tile units, turned to the viewer
    const [a, b, c] = tile as Array<[number, number, number]> as [[number, number, number], [number, number, number], [number, number, number]];
    const u = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
    const v = [c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!];
    let n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const len = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    n = n.map((x) => x / len);
    if (n[0]! + n[1]! + 2 * n[2]! < 0) n = n.map((x) => -x);
    const ndl = Math.max(0, n[0]! * LIGHT[0] + n[1]! * LIGHT[1] + n[2]! * LIGHT[2]);
    const k = (AMBIENT + SUN * ndl) / Math.PI;
    const col = [toSrgb(t.color[0] * k), toSrgb(t.color[1] * k), toSrgb(t.color[2] * k)];
    const minX = Math.max(0, Math.floor(Math.min(...sx)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(...sx)));
    const minY = Math.max(0, Math.floor(Math.min(...sy)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(...sy)));
    const area = (sx[1]! - sx[0]!) * (sy[2]! - sy[0]!) - (sx[2]! - sx[0]!) * (sy[1]! - sy[0]!);
    if (Math.abs(area) < 1e-9) continue;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((sx[1]! - px) * (sy[2]! - py) - (sx[2]! - px) * (sy[1]! - py)) / area;
        const w1 = ((sx[2]! - px) * (sy[0]! - py) - (sx[0]! - px) * (sy[2]! - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        if (plane.some((d) => w0 * d[0]! + w1 * d[1]! + w2 * d[2]! < 0)) continue;
        const z = w0 * ndc[0]![2] + w1 * ndc[1]![2] + w2 * ndc[2]![2];
        const i = y * W + x;
        if (z >= depth[i]!) continue;
        depth[i] = z;
        rgba.set([col[0]!, col[1]!, col[2]!, 255], i * 4);
      }
    }
  }
  return rgba;
}

interface Car {
  params: Record<string, string>;
  turned: boolean;
}

async function readRaw(file: string): Promise<{ width: number; height: number; data: Uint8Array }> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data) };
}

/** Draw straight RGBA `img` over `dst` at (x, y). */
function blend(dst: { width: number; height: number; data: Uint8Array }, img: { width: number; height: number; rgba: Uint8Array }, x0: number, y0: number): void {
  for (let y = 0; y < img.height; y++) {
    const dy = y0 + y;
    if (dy < 0 || dy >= dst.height) continue;
    for (let x = 0; x < img.width; x++) {
      const dx = x0 + x;
      if (dx < 0 || dx >= dst.width) continue;
      const s = (y * img.width + x) * 4;
      const a = img.rgba[s + 3]! / 255;
      if (a === 0) continue;
      const d = (dy * dst.width + dx) * 4;
      for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round(img.rgba[s + c]! * a + dst.data[d + c]! * (1 - a));
      dst.data[d + 3] = 255;
    }
  }
}

/** A vehicle drawn headlessly: its cars, measured and rasterized in one direction. */
async function drawItem(id: string, cars: Car[], feature: OpenttdFeature, direction: number, zoom: PreviewZoom): Promise<Array<{ length: number; image: GrfImage }>> {
  const design = DESIGNS.get(id)!;
  const out: Array<{ length: number; image: GrfImage }> = [];
  for (const car of cars) {
    const { json, bin } = parseGlb(toGlb(id, design.build(car.params)));
    const tris = collectTriangles(json, bin);
    const b = triBounds(tris);
    const box: ModelBox = car.turned
      ? { min: [-b.max[0], b.min[1], -b.max[2]], max: [-b.min[0], b.max[1], -b.min[2]] }
      : { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] };
    const lengths = partLengths(box.max[0] - box.min[0], feature);
    const views = spriteViews(feature, box, lengths, design.game?.draftFrac ?? 0, catalogFields(design).group === "tram");
    for (const [k, dirs] of views.entries()) {
      const zooms = zoomImages(rasterize(tris, dirs[direction]!, car.turned), dirs[direction]!, SUPERSAMPLE);
      out.push({ length: lengths[k]!, image: zooms.find((z) => z.zoom === (zoom === "1x" ? GRF_ZOOM.normal : GRF_ZOOM.in4x))! });
    }
  }
  return out;
}

const escape = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A model's whole one-click pack in its scene, as the model page's OpenTTD view
 * draws it: each preset and formation on its own slot of the yard of exactly that
 * many tracks, labelled with its OpenTTD name and local id, cropped to the
 * vehicles. `page` picks the next 10 of a larger pack.
 */
type LabelStyle = "labels" | "tags";

async function renderPack(id: string, zoom: PreviewZoom, page: number, labelPx: number, style: LabelStyle = "labels"): Promise<{ png: Buffer; all: Rect; front: Rect; labels: Rect[]; names: string[]; ids: string[]; size: [number, number]; scene: string }> {
  const design = DESIGNS.get(id);
  if (!design) throw new Error(`no model ${id}`);
  const fields = catalogFields(design);
  const feature = openttdFeatureOf(fields);
  if (!feature) throw new Error(`${id}: OpenTTD has no vehicle of this kind`);
  const ottd = catalogOpenttd(design, fields)!;
  const record = { id, title: design.title, category: fields.category, group: fields.group, traction: fields.traction, params: design.params, game: design.game, openttd: ottd } as unknown as CatalogRecord;
  const items = oneClickItems(record).slice(page * SCENE_SLOTS, page * SCENE_SLOTS + SCENE_SLOTS);
  const kind = kindOf(feature, ottd.railType ?? "RAIL", fields.group === "tram");
  const scene = sceneName(kind, items.length);
  const placement = JSON.parse(fs.readFileSync(path.join(SCENES, scene, "placement.json"), "utf8")) as Placement;
  const out = await readRaw(path.join(SCENES, scene, `background-${zoom}.png`));
  const fg = await readRaw(path.join(SCENES, scene, `foreground-${zoom}.png`));
  const rects: Rect[] = [];
  const fronts: Rect[] = [];
  for (const [i, item] of items.entries()) {
    const slot = placement.slots[i]!;
    const parts = await drawItem(id, item.cars.map((c) => ({ params: c.params, turned: !!c.turned })), feature, slot.direction, zoom);
    for (const p of placeParts(feature, slot, zoom, parts.map((q) => q.length), parts.map((q) => [q.image.xOffs, q.image.yOffs] as const))) {
      const img = parts[p.part]!.image;
      blend(out, img, p.x, p.y);
      rects.push([p.x, p.y, img.width, img.height]);
      if (p.part === 0) fronts.push([p.x, p.y, img.width, img.height]);
    }
  }
  blend(out, { width: fg.width, height: fg.height, rgba: fg.data }, 0, 0);
  // the labels, as SVG over the image (text widths estimated: the site measures them)
  const size = placement.sizes[zoom];
  // the type as OpenttdPreview.tsx labelType sizes it
  const fs1 = labelPx;
  const fs2 = Math.round(labelPx * 0.83);
  const pad = Math.max(3, Math.round(labelPx / 3));
  const gap = Math.max(1, Math.round(labelPx / 6));
  const line = Math.round(labelPx * 1.1);
  const svg: string[] = [];
  const labels: Rect[] = [];
  const names: string[] = [];
  const ids: string[] = [];
  for (const [i, item] of items.entries()) {
    const name = resolveItem(item).vehicle.name;
    const idText = item.baseId === undefined ? "-" : `0x${item.baseId.toString(16).toUpperCase().padStart(4, "0")}`;
    names.push(name);
    ids.push(idText);
    if (style === "tags") {
      const w = Math.max(Math.ceil(String(i + 1).length * fs1 * 0.62 + 2 * pad), line + pad);
      const r = labelRect(feature, frontPoint(feature, placement.slots[i]!, zoom), w, line + 2 * pad, zoom, size);
      rects.push(r);
      fronts.push(r);
      labels.push(r);
      svg.push(`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="rgb(20,20,28)" fill-opacity="0.88"/>`);
      svg.push(`<text x="${r[0] + r[2] / 2}" y="${r[1] + pad + fs1 * 0.85}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${fs1}" fill="white">${i + 1}</text>`);
      continue;
    }
    const width = Math.ceil(Math.max(name.length * fs1 * 0.58, idText.length * fs2 * 0.62) + 2 * pad);
    const height = 2 * pad + line + gap + Math.round(fs2 * 1.1);
    const r = labelRect(feature, frontPoint(feature, placement.slots[i]!, zoom), width, height, zoom, size);
    rects.push(r);
    fronts.push(r);
    labels.push(r);
    svg.push(`<rect x="${r[0] + 0.5}" y="${r[1] + 0.5}" width="${r[2] - 1}" height="${r[3] - 1}" fill="rgb(20,20,28)" fill-opacity="0.82" stroke="white" stroke-opacity="0.35"/>`);
    svg.push(`<text x="${r[0] + pad}" y="${r[1] + pad + fs1 * 0.85}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${fs1}" fill="white">${escape(name)}</text>`);
    svg.push(`<text x="${r[0] + pad}" y="${r[1] + pad + line + gap + fs2 * 0.85}" font-family="DejaVu Sans Mono, monospace" font-size="${fs2}" fill="#b8e0b0">${escape(idText)}</text>`);
  }
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${out.width}" height="${out.height}">${svg.join("")}</svg>`);
  const png = await sharp(Buffer.from(out.data), { raw: { width: out.width, height: out.height, channels: 4 } })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
  return { png, all: viewRect(rects, zoom, size), front: viewRect(fronts, zoom, size, FRONT_MARGIN), labels, names, ids, size: [size[0], size[1]], scene };
}

/** The labels' least size on screen, CSS pixels, and their size in image pixels at each zoom (OpenttdPreview.tsx). */
const LABEL_CSS_PX = 12;
const LABEL_PX: Record<PreviewZoom, number> = { "4x": 18, "1x": 9 };

/**
 * A model's whole one-click pack, as the model page's OpenTTD view draws it: at a
 * zoom, cropped to the pack; or, with `fit` (a stage's width and height, CSS
 * pixels), as the view's "Auto" fits it there (scene.ts chooseView) - a stage-sized
 * image, the view centred on it, scrolled to its top left when larger.
 */
export async function packSheet(id: string, zoom: PreviewZoom = "4x", page = 0, fit?: [number, number]): Promise<{ png: Buffer; width: number; height: number; scene: string; note: string }> {
  if (!fit) {
    const r = await renderPack(id, zoom, page, LABEL_PX[zoom]);
    const [x, y, w, h] = r.all;
    return { png: await sharp(r.png).extract({ left: x, top: y, width: w, height: h }).png().toBuffer(), width: w, height: h, scene: r.scene, note: `${zoom}, whole` };
  }
  // as OpenttdPreview.tsx: choose, then again with the labels at the size the choice
  // needs; full labels where they fit at 4x and apart, else number tags and a legend
  const pxFor = (c: { zoom: PreviewZoom; scale: number }) => Math.max(LABEL_PX[c.zoom], Math.round(LABEL_CSS_PX / c.scale));
  const choose = async (style: LabelStyle, room: [number, number]) => {
    let px4 = LABEL_PX["4x"];
    let l = await renderPack(id, "4x", page, px4, style);
    let c = chooseView(l.all, l.front, l.size, room);
    for (let i = 0; i < 2 && c.zoom === "4x" && pxFor(c) !== px4; i++) {
      px4 = pxFor(c);
      l = await renderPack(id, "4x", page, px4, style);
      c = chooseView(l.all, l.front, l.size, room);
    }
    return c;
  };
  const n = (await renderPack(id, "1x", page, LABEL_PX["1x"])).names.length;
  const legendH = Math.min(Math.round(fit[1] / 2), n * 18 + 8);
  let choice = await choose("labels", fit);
  let style: LabelStyle = "labels";
  const crowded = async (c: { zoom: PreviewZoom; scale: number }) => labelsOverlap((await renderPack(id, c.zoom, page, pxFor(c))).labels);
  const tagged = await choose("tags", [fit[0], Math.max(100, fit[1] - legendH)]);
  if (preferTags(choice, tagged, await crowded(choice))) {
    choice = tagged;
    style = "tags";
  }
  const labelPx = pxFor(choice);
  const r = await renderPack(id, choice.zoom, page, labelPx, style);
  const [x, y, w, h] = choice.fit === "front" ? choice.rect : r.all;
  const stageH = style === "tags" ? fit[1] - legendH : fit[1];
  const cw = Math.round(w * choice.scale);
  const ch = Math.round(h * choice.scale);
  const view = await sharp(r.png).extract({ left: x, top: y, width: w, height: h })
    .resize(cw, ch, { kernel: choice.scale < 1 ? "lanczos3" : "nearest" }).png().toBuffer();
  // on the stage: centred, or from the top left where larger (the view scrolls)
  // the picture and its legend as one block, centred on the stage (factory.css .factory-ottd)
  const left = cw < fit[0] ? Math.floor((fit[0] - cw) / 2) : 0;
  const blockH = Math.min(ch, stageH) + (style === "tags" ? legendH : 0);
  const top = Math.max(0, Math.floor((fit[1] - blockH) / 2));
  const shown = await sharp(view).extract({ left: 0, top: 0, width: Math.min(cw, fit[0]), height: Math.min(ch, stageH) }).png().toBuffer();
  const layers: Array<{ input: Buffer; left: number; top: number }> = [{ input: shown, left, top }];
  if (style === "tags") {
    // the legend under the view, a row a vehicle (OpenttdPreview.tsx)
    const rows = r.names.map((name, i) => `<text x="12" y="${top + Math.min(ch, stageH) + 4 + 18 * i + 13}" font-family="DejaVu Sans, sans-serif" font-size="13" fill="#e6e6ea"><tspan font-weight="bold" fill="white">${i + 1}</tspan>  ${escape(name)}  <tspan font-family="DejaVu Sans Mono, monospace" fill="#9a9aa6">${r.ids[i]}</tspan></text>`);
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fit[0]}" height="${fit[1]}">${rows.join("")}</svg>`), left: 0, top: 0 });
  }
  const png = await sharp({ create: { width: fit[0], height: fit[1], channels: 4, background: { r: 30, g: 30, b: 35, alpha: 1 } } })
    .composite(layers).png().toBuffer();
  const note = `${choice.zoom === "4x" ? "4x" : "normal zoom"}, ${choice.fit === "front" ? "cut to the fronts" : "whole"}, at ${Math.round(choice.scale * 100)}%, ${style === "tags" ? "tags and a legend" : "labels"}`;
  return { png, width: fit[0], height: fit[1], scene: r.scene, note };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = args.indexOf(name);
    if (i < 0) return undefined;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
  };
  const zoom = (flag("--zoom") ?? "4x") as PreviewZoom;
  const page = Number(flag("--page") ?? "1") - 1;
  const fitText = flag("--fit");
  const fit = fitText ? (fitText.split("x").map(Number) as [number, number]) : undefined;
  const [id, outFile] = args;
  if (!id || !outFile) throw new Error("usage: previewSheet.ts <model id> <out.png> [--zoom 4x|1x] [--page n] [--fit <width>x<height>]");
  const sheet = await packSheet(id, zoom, page, fit);
  fs.writeFileSync(outFile, sheet.png);
  console.log(`${outFile}: ${sheet.width} x ${sheet.height} (${sheet.scene}; ${sheet.note})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

