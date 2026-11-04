// The OpenTTD view headlessly (docs/site/openttd-export.md, "The preview"): a model
// variant or formation drawn into its prerendered scene, as the model page's
// OpenTTD view draws it - the same sprite frames (projection.ts), zoom filter
// (pixels.ts) and placement (scene.ts) - with a small software rasterizer standing
// in for the page's WebGL renderer (flat Lambert, the same lights). For checks and
// for the images sent to the user; the site never runs it.
//
//   pnpm exec tsx generator/openttdScenes/previewSheet.ts <model id> <out.png> [name=value ...] [--formation <name>] [--zoom 1x|4x] [--crop]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { catalogFields, DESIGNS, toGlb } from "../generate.ts";
import { collectTriangles, parseGlb, triBounds, type Tri } from "../glbTriangles.ts";
import { catalogOpenttd, openttdFeatureOf } from "../openttd.ts";
import { zoomImages } from "../../src/openttd/pixels.ts";
import { applyMatrix, RENDER_ZOOM, spriteViews, type ModelBox, type SpriteView } from "../../src/openttd/projection.ts";
import { partLengths } from "../../src/openttd/properties.ts";
import { placeParts, sceneOf, trackOf, ZOOM_SCALE, type Placement, type PreviewZoom } from "../../src/openttd/scene.ts";
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

export async function previewSheet(id: string, params: Record<string, string>, opts: { formation?: string; zoom?: PreviewZoom }): Promise<{ width: number; height: number; data: Uint8Array; placement: Placement; boxes: Array<[number, number, number, number]> }> {
  const design = DESIGNS.get(id);
  if (!design) throw new Error(`no model ${id}`);
  const fields = catalogFields(design);
  const feature = openttdFeatureOf(fields);
  if (!feature) throw new Error(`${id}: OpenTTD has no vehicle of this kind`);
  const ottd = catalogOpenttd(design, fields);
  const formation = opts.formation ? ottd?.formations?.find((f) => f.name === opts.formation) : undefined;
  if (opts.formation && !formation) throw new Error(`${id}: no formation "${opts.formation}"`);
  const cars: Car[] = formation ? formation.cars.map((c) => ({ params: c.params, turned: !!c.turned })) : [{ params, turned: false }];
  const zoom = opts.zoom ?? "1x";
  const track = trackOf(feature, ottd?.railType ?? "RAIL", fields.group === "tram");
  const scene = sceneOf(track);
  const placement = JSON.parse(fs.readFileSync(path.join(SCENES, scene, "placement.json"), "utf8")) as Placement;
  const slots = placement.slots.filter((s) => s.track === track);
  const directions = [...new Set(slots.map((s) => s.direction))];
  // every part's images in the slots' directions
  const parts: Array<{ length: number; images: Map<number, GrfImage> }> = [];
  for (const car of cars) {
    const { json, bin } = parseGlb(toGlb(id, design.build(car.params)));
    const tris = collectTriangles(json, bin);
    const b = triBounds(tris);
    const box: ModelBox = car.turned
      ? { min: [-b.max[0], b.min[1], -b.max[2]], max: [-b.min[0], b.max[1], -b.min[2]] }
      : { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] };
    const lengths = partLengths(box.max[0] - box.min[0], feature);
    const views = spriteViews(feature, box, lengths, design.game?.draftFrac ?? 0);
    for (const [k, dirs] of views.entries()) {
      const images = new Map<number, GrfImage>();
      for (const d of directions) {
        const zooms = zoomImages(rasterize(tris, dirs[d]!, car.turned), dirs[d]!, SUPERSAMPLE);
        images.set(d, zooms.find((z) => z.zoom === (zoom === "1x" ? GRF_ZOOM.normal : GRF_ZOOM.in4x))!);
      }
      parts.push({ length: lengths[k]!, images });
    }
  }
  const out = await readRaw(path.join(SCENES, scene, `background-${zoom}.png`));
  const fg = await readRaw(path.join(SCENES, scene, `foreground-${zoom}.png`));
  const boxes: Array<[number, number, number, number]> = [];
  for (const slot of slots) {
    const imgs = parts.map((p) => p.images.get(slot.direction)!);
    for (const p of placeParts(feature, slot, zoom, parts.map((q) => q.length), imgs.map((i) => [i.xOffs, i.yOffs] as const))) {
      const img = imgs[p.part]!;
      blend(out, img, p.x, p.y);
      boxes.push([p.x, p.y, img.width, img.height]);
    }
  }
  blend(out, { width: fg.width, height: fg.height, rgba: fg.data }, 0, 0);
  return { ...out, placement, boxes };
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
  const crop = args.includes("--crop");
  if (crop) args.splice(args.indexOf("--crop"), 1);
  const formation = flag("--formation");
  const zoom = (flag("--zoom") ?? "1x") as PreviewZoom;
  const [id, outFile, ...rest] = args;
  if (!id || !outFile) throw new Error("usage: previewSheet.ts <model id> <out.png> [name=value ...] [--formation <name>] [--zoom 1x|4x] [--crop]");
  const params = Object.fromEntries(rest.map((kv) => kv.split("=") as [string, string]));
  const img = await previewSheet(id, params, { formation, zoom });
  let { width, height, data } = img;
  let left = 0;
  let top = 0;
  if (crop) {
    // round the drawn sprites, a margin of a tile
    const m = 64 * ZOOM_SCALE[zoom];
    left = Math.max(0, Math.min(...img.boxes.map((b) => b[0])) - m);
    top = Math.max(0, Math.min(...img.boxes.map((b) => b[1])) - m);
    const right = Math.min(width, Math.max(...img.boxes.map((b) => b[0] + b[2])) + m);
    const bottom = Math.min(height, Math.max(...img.boxes.map((b) => b[1] + b[3])) + m);
    width = right - left;
    height = bottom - top;
  }
  await sharp(Buffer.from(data), { raw: { width: img.width, height: img.height, channels: 4 } })
    .extract({ left, top, width, height })
    .png()
    .toFile(outFile);
  console.log(`${outFile}: ${width} x ${height}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { RENDER_ZOOM };
