// Render the train parade (trainParade.ts) into the export: one lossless WebP per
// distinct car (or section of a long car) in export/trains/, and
// export/trains.json, which railisland.com reads in the browser
// (docs/site/train-parade.md). Part of `pnpm build`, after build:models.
//
// A car with distance-driven animation clips (a steam locomotive's running gear,
// rolling spoked wheels, a horse team's gait) is drawn as a sprite: one cycle of
// its moving parts in frames stacked top to bottom.
//
// Incremental: every image's name carries a hash of what shapes it - the design's
// build-cache key (its sources and the renderer, buildCache.ts), the car's values,
// turned, and this file - and export/.trains-keys.json keeps what each hash
// rendered (length, images, frames). An image whose hash is already there is not
// rendered again; the deploy restores the last export, so a deploy that changed no
// listed design renders nothing. Images no train uses any more are deleted.
//
//   pnpm build:trains

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import sharp from "sharp";
import { BUILD_CACHE_DIR } from "./buildCache.ts";
import { isSideViewCategory } from "./catalog.ts";
import type { ParamValues } from "./design.ts";
import { DESIGNS, EXPORT_DIR, toGlb } from "./generate.ts";
import { parseGlb } from "./glbParse.ts";
import { poseGlb } from "./glbPose.ts";
import type { Tri, Vec3 } from "./glbTriangles.ts";
import { dot, norm, triBounds } from "./glbTriangles.ts";
import type { AnimationClipSpec } from "./meshCore.ts";
import { OPENTTD_TABLE } from "./openttdTable.ts";
import { SIDE_BOTTOM_M, SIDE_MARGIN_M, SIDE_PX_PER_M, SIDE_TOP_M, rasterize, readTriangles, sideFrame } from "./renderGlbThumb.ts";
import {
  TRAIN_PARADE, carImageBase, carKey, carSections, fleetCounts, fleetStats, layOutTrain, resolveTrains,
  type CarImages, type CountedModel, type SpriteRect, type TrainCar, type TrainContext, type TrainSpec, type TrainsFile,
} from "./trainParade.ts";

const CONFIRMED = new Set<string>(
  (JSON.parse(fs.readFileSync(fileURLToPath(new URL("./catalogModels.json", import.meta.url)), "utf8")) as { ids: string[] }).ids,
);

/** The factory as trainParade.ts sees it: the designs, the confirmed list, the OpenTTD table. */
export const FACTORY_TRAIN_CONTEXT: TrainContext = {
  model(id) {
    const d = DESIGNS.get(id);
    if (!d || !d.catalog) return undefined;
    return { category: d.catalog.category, params: d.params, openttd: d.openttd ?? OPENTTD_TABLE[id] };
  },
  confirmed: (id) => CONFIRMED.has(id),
  isSideView: isSideViewCategory,
};

/** Every design as the caption's counts read it. */
export function countedModels(): CountedModel[] {
  return [...DESIGNS.values()].flatMap((d) =>
    d.catalog ? [{ id: d.id, category: d.catalog.category, group: d.catalog.group, traction: d.catalog.traction, params: d.params }] : [],
  );
}

// The side view's supersampling and light, as renderGlbThumb.ts draws its side
// thumbnails (SS, SIDE_AMBIENT, SIDE_KEY, SIDE_KEY_DIR there). They are repeated
// here, not imported, because renderGlbThumb.ts is an input of every design's build
// cache key (buildCache.ts): touching it rebuilds the whole cache. test/trainParade.test.ts
// checks that renderSide draws a car exactly as renderGlbSideThumb does.
const SS = 3;
const SIDE_AMBIENT = 1.2 / Math.PI;
const SIDE_KEY = 1.5 / Math.PI;
const SIDE_KEY_DIR = norm([-0.4, 1, -1.2]);

/** Frames per cycle of a car's moving parts: enough for rods and wheels to read at the parade's speed. */
export const FRAMES_PER_CYCLE = 12;
/** At least this many frames per cycle of the car's shortest clip (a team's stride inside a wheel's turn). */
export const MIN_FRAMES_PER_CLIP = 8;
/** The most frames one sprite holds. */
export const MAX_FRAMES = 16;
/** Unchanged pixels round a sprite's moving pixels: a client's frame step may land up to half a screen pixel off. */
export const SPRITE_MARGIN_PX = 4;
/**
 * Transparent rows between two frames of a sprite sheet: scaled down on screen, a
 * frame's edge would otherwise pick up its neighbour's first row (a line under the
 * wheels); with the gap it blends with nothing, and the still image shows there.
 */
export const SPRITE_GAP_PX = 4;

/**
 * The side view of `tris` (renderGlbSideThumb's, for triangles already read and
 * moved), framed on the stretch `xRange` of the model when given: metres along X,
 * plus the margins. A section of a whole articulated train is drawn so, and every
 * frame of an animated car is framed on its pose at rest.
 */
export function renderSide(tris: Tri[], xRange?: readonly [number, number]): PNG {
  const { min, max } = triBounds(tris);
  const [x0, x1] = xRange ?? [min[0], max[0]];
  const f = sideFrame(x0, x1);
  const right = x1 + SIDE_MARGIN_M; // the nose's end of the frame, drawn at the left edge
  const k = f.pxPerM * SS;
  const camZ = min[2] - 100;
  const eyeDir: Vec3 = [0, 0, -1];
  return rasterize(
    tris,
    f.width,
    f.height,
    (p) => ({ x: (right - p[0]) * k, y: (SIDE_TOP_M - p[1]) * k, w: p[2] - camZ }),
    false,
    () => eyeDir,
    (n) => SIDE_AMBIENT + SIDE_KEY * Math.max(0, dot(n, SIDE_KEY_DIR)),
  );
}

const turn = (v: Vec3): Vec3 => [-v[0], v[1], -v[2]];

/** A car's triangles turned half round about the vertical axis: seen from the same side, its nose is on the right. */
export function turnedRound(tris: Tri[]): Tri[] {
  return tris.map((t) => ({ ...t, p: t.p.map(turn) as Tri["p"], n: t.n.map(turn) as Tri["n"] }));
}

/** A distance-driven clip of a built car: its index in the GLB, its speed, its sample times and the metres of one cycle. */
export interface DistanceClip {
  index: number;
  speed: number;
  times: number[];
  cycleM: number;
}

/** The car's clips that the distance travelled plays (`drive: "distance"`), with their GLB index. */
export function distanceClips(clips: readonly AnimationClipSpec[], glb: Uint8Array): DistanceClip[] {
  const names = ((parseGlb(glb).json as { animations?: { name?: string }[] }).animations ?? []).map((a) => a.name);
  return clips.flatMap((c) => {
    if (c.drive.drive !== "distance" || c.times.length < 2) return [];
    const index = names.indexOf(c.name);
    if (index < 0) throw new Error(`clip "${c.name}" is not in the GLB`);
    const duration = c.times[c.times.length - 1]!;
    return [{ index, speed: c.drive.speed, times: c.times, cycleM: c.drive.speed * duration }];
  });
}

/**
 * One cycle of all of a car's distance clips together - the shortest whole number
 * (up to 4) of the longest clip's cycles over which every clip comes round to its
 * start (within 1 %), else the longest cycle - and how many frames show it.
 */
export function spriteCycle(clips: readonly Pick<DistanceClip, "cycleM">[]): { cycleM: number; frames: number } | null {
  if (!clips.length) return null;
  const longest = Math.max(...clips.map((c) => c.cycleM));
  const shortest = Math.min(...clips.map((c) => c.cycleM));
  let cycleM = longest;
  for (let m = 1; m <= 4; m++) {
    const L = longest * m;
    if (clips.every((c) => Math.abs(L / c.cycleM - Math.round(L / c.cycleM)) < 0.01)) {
      cycleM = L;
      break;
    }
  }
  const frames = Math.min(MAX_FRAMES, Math.max(FRAMES_PER_CYCLE, Math.round((MIN_FRAMES_PER_CLIP * cycleM) / shortest)));
  return { cycleM: Math.round(cycleM * 1e4) / 1e4, frames };
}

/** The GLB posed at `distanceM` travelled: every distance clip at its nearest sample. */
export function poseAtDistance(glb: Uint8Array, clips: readonly DistanceClip[], distanceM: number): Uint8Array {
  let out = glb;
  for (const c of clips) {
    const duration = c.times[c.times.length - 1]!;
    const t = (((distanceM / c.speed) % duration) + duration) % duration;
    let k = 0;
    for (let i = 1; i < c.times.length; i++) if (Math.abs(c.times[i]! - t) < Math.abs(c.times[k]! - t)) k = i;
    out = poseGlb(out, k, c.index);
  }
  return out;
}

/** A rendered car: its CarImages and the encoded images, by name. */
export interface RenderedCar extends CarImages {
  files: { name: string; bytes: Buffer }[];
}

/**
 * Build `car`, find its distance clips and draw it: one image per section, each a
 * sprite of its frames when it moves. A turned car's clips run backwards, so on
 * screen its wheels turn the same way as every other car's.
 */
export async function renderCar(car: TrainCar, base: (section?: number) => string): Promise<RenderedCar> {
  const design = DESIGNS.get(car.model);
  if (!design) throw new Error(`no procedural model "${car.model}"`);
  const model = design.build(car.params);
  const glb = toGlb(car.model, model);
  const clips = distanceClips(model.animations(), glb);
  const cycle = spriteCycle(clips);
  const posed = (distanceM: number) => {
    const tris = readTriangles(cycle ? poseAtDistance(glb, clips, distanceM) : glb);
    return car.turned ? turnedRound(tris) : tris;
  };
  const rest = posed(0);
  const { min, max } = triBounds(rest);
  const lengthM = max[0] - min[0];
  const sections = carSections(lengthM);
  const sign = car.turned ? -1 : 1;
  const frames = cycle ? Array.from({ length: cycle.frames }, (_, f) => (f === 0 ? rest : posed((sign * f * cycle.cycleM) / cycle.frames))) : [rest];
  const files: RenderedCar["files"] = [];
  const images: string[] = [];
  const sprites: (SpriteRect | null)[] = [];
  for (let i = 0; i < sections.length; i++) {
    const [s0, s1] = sections[i]!;
    // a section from s0 to s1 metres behind the nose, which is at max X
    const range: [number, number] = sections.length > 1 ? [max[0] - s1, max[0] - s0] : [min[0], max[0]];
    if (sideFrame(range[0], range[1]).pxPerM !== SIDE_PX_PER_M) throw new Error(`${carKey(car)}: too long for the parade's scale`);
    const pngs = frames.map((tris) => renderSide(tris, range));
    const name = base(sections.length > 1 ? i : undefined);
    // a copy: clearing the moving pixels in frame 0 itself emptied the sprite's
    // first frame, so every animated car lost its wheels and legs once per cycle
    const still = new PNG({ width: pngs[0]!.width, height: pngs[0]!.height });
    pngs[0]!.data.copy(still.data);
    const rect = pngs.length > 1 ? changedRect(pngs, SPRITE_MARGIN_PX) : null;
    if (rect) {
      // Two layers that must add up to each frame without a seam once both are
      // scaled down on screen and the train moves by fractions of a pixel
      // (clearing the whole rectangle from the still drew a seam at its edge that
      // flickered): the still keeps every pixel but the moving ones (a pixel wider
      // each way); the sprite holds the moving pixels and, round them, the
      // unchanged pixels that are fully opaque - drawn twice they look the same,
      // so the two layers overlap there instead of meeting at an edge. Unchanged
      // pixels that are partly transparent (outlines) come from the still alone,
      // as twice they would darken.
      const { x, y, w, h } = rect;
      const moving = changedMask(pngs);
      for (let i = 0; i < moving.length; i++) if (moving[i]) still.data.fill(0, i * 4, i * 4 + 4);
      const pitch = h + SPRITE_GAP_PX;
      const sheet = new PNG({ width: w, height: pitch * pngs.length - SPRITE_GAP_PX });
      sheet.data.fill(0);
      pngs.forEach((p, f) => {
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const i = (y + row) * p.width + (x + col);
            if (!moving[i] && p.data[i * 4 + 3] !== 255) continue;
            p.data.copy(sheet.data, ((f * pitch + row) * w + col) * 4, i * 4, i * 4 + 4);
          }
        }
      });
      files.push({ name: `${name}--frames.webp`, bytes: await webp(sheet, true) });
    }
    images.push(`${name}.webp`);
    files.push({ name: `${name}.webp`, bytes: await webp(still) });
    sprites.push(rect ? { image: `${name}--frames.webp`, ...rect, pitch: rect.h + SPRITE_GAP_PX } : null);
  }
  const animated = cycle && sprites.some(Boolean);
  return { lengthM, images, ...(animated ? { sprites, frames: cycle.frames, cycleM: cycle.cycleM } : {}), files };
}

/**
 * A PNG as WebP: lossless, which flat-shaded vehicles compress far better than
 * lossy does; with `orLossy`, the lossy encoding (quality 85, exact alpha) instead
 * when it is smaller - a team's shaded legs over many frames, where it saves about
 * half and its artefacts are invisible at the parade's size.
 */
async function webp(png: PNG, orLossy = false): Promise<Buffer> {
  const img = () => sharp(png.data, { raw: { width: png.width, height: png.height, channels: 4 } });
  const lossless = await img().webp({ lossless: true, effort: 6 }).toBuffer();
  if (!orLossy) return lossless;
  const lossy = await img().webp({ quality: 85, alphaQuality: 100, effort: 6 }).toBuffer();
  return lossy.length < lossless.length ? lossy : lossless;
}

/** Per pixel of the frames, whether it differs from the first in any frame, grown by a pixel each way (8-neighbourhood). */
export function changedMask(frames: readonly PNG[]): Uint8Array {
  const { width, height } = frames[0]!;
  const first = frames[0]!.data;
  const diff = new Uint8Array(width * height);
  for (const f of frames.slice(1)) {
    const d = f.data;
    for (let i = 0; i < diff.length; i++) {
      const o = i * 4;
      if (d[o] !== first[o] || d[o + 1] !== first[o + 1] || d[o + 2] !== first[o + 2] || d[o + 3] !== first[o + 3]) diff[i] = 1;
    }
  }
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!diff[y * width + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < width && yy < height) out[yy * width + xx] = 1;
        }
      }
    }
  }
  return out;
}

/**
 * The smallest rectangle outside which every frame equals the first, `pad` pixels
 * wider each way (within the image); null when none differs. The margin is pixels
 * every frame shares, so a client that lands a frame a fraction of a pixel off
 * shows the same picture at its edge.
 */
export function changedRect(frames: readonly PNG[], pad = 1): { x: number; y: number; w: number; h: number } | null {
  const { width, height } = frames[0]!;
  const first = frames[0]!.data;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (const f of frames.slice(1)) {
    const d = f.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        if (d[o] === first[o] && d[o + 1] === first[o + 1] && d[o + 2] === first[o + 2] && d[o + 3] === first[o + 3]) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad);
  y1 = Math.min(height - 1, y1 + pad);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const SELF = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");

/** The design's build-cache key (build-cache/facts/<id>.json), or null when it has none. */
function factsKey(id: string): string | null {
  try {
    return (JSON.parse(fs.readFileSync(path.join(BUILD_CACHE_DIR, "facts", `${id}.json`), "utf8")) as { facts?: { key?: string } }).facts?.key ?? null;
  } catch {
    return null;
  }
}

/** The hash a car's images are named and cached by, or null when its design has no build-cache key (always rendered). */
export function carHash(car: TrainCar): string | null {
  const key = factsKey(car.model);
  if (!key) return null;
  const params: ParamValues = Object.fromEntries(Object.keys(car.params).sort().map((k) => [k, car.params[k]!]));
  return crypto.createHash("sha256").update(JSON.stringify({ key, model: car.model, params, turned: car.turned, writer: SELF })).digest("hex").slice(0, 12);
}

/** export/.trains-keys.json: what each car hash rendered. */
interface TrainsKeys {
  version: 1;
  cars: Record<string, CarImages>;
}

/**
 * Resolve `list`, render every distinct car whose images are not already in
 * `<dir>/trains/` under its hash, delete the images no car uses, and write
 * `<dir>/trains.json`. Returns the file and how many cars were rendered and reused.
 */
export async function writeTrains(
  list: readonly TrainSpec[] = TRAIN_PARADE,
  dir = EXPORT_DIR,
  log: (s: string) => void = () => {},
): Promise<{ file: TrainsFile; rendered: number; reused: number }> {
  const trains = resolveTrains(list, FACTORY_TRAIN_CONTEXT);
  const outDir = path.join(dir, "trains");
  const keysPath = path.join(dir, ".trains-keys.json");
  fs.mkdirSync(outDir, { recursive: true });
  let old: TrainsKeys = { version: 1, cars: {} };
  try {
    const read = JSON.parse(fs.readFileSync(keysPath, "utf8")) as TrainsKeys;
    if (read.version === 1 && read.cars) old = read;
  } catch {
    // no earlier run: render everything
  }
  const keys: TrainsKeys = { version: 1, cars: {} };
  const byCar = new Map<string, CarImages>();
  let rendered = 0;
  let reused = 0;
  for (const car of trains.flatMap((t) => t.cars)) {
    const id = carKey(car);
    if (byCar.has(id)) continue;
    const hash = carHash(car);
    const cached = hash ? old.cars[hash] : undefined;
    const cachedFiles = cached ? [...cached.images, ...(cached.sprites ?? []).flatMap((sp) => (sp ? [sp.image] : []))] : [];
    if (hash && cached && cachedFiles.every((n) => fs.existsSync(path.join(outDir, n)))) {
      byCar.set(id, cached);
      keys.cars[hash] = cached;
      reused++;
      continue;
    }
    const suffix = hash ?? crypto.randomBytes(6).toString("hex");
    const r = await renderCar(car, (section) => `${carImageBase(car, section)}-${suffix}`);
    for (const f of r.files) fs.writeFileSync(path.join(outDir, f.name), f.bytes);
    const { files, ...images } = r;
    byCar.set(id, images);
    if (hash) keys.cars[hash] = images;
    rendered++;
    const kib = files.reduce((n, f) => n + f.bytes.length, 0) / 1024;
    log(`  ${id}: ${files.length} file(s), ${kib.toFixed(1)} KiB${r.frames ? ` (${r.frames} frames / ${r.cycleM} m)` : ""}`);
  }
  // drop what no car uses any more (old hashes, an earlier run's PNGs)
  const used = new Set([...byCar.values()].flatMap((c) => [...c.images, ...(c.sprites ?? []).flatMap((sp) => (sp ? [sp.image] : []))]));
  for (const name of fs.readdirSync(outDir)) if (!used.has(name)) fs.rmSync(path.join(outDir, name), { recursive: true, force: true });
  fs.writeFileSync(keysPath, JSON.stringify(keys, null, 1) + "\n");

  const models = countedModels();
  const file: TrainsFile = {
    version: 1,
    pxPerM: SIDE_PX_PER_M,
    heightM: Math.round((SIDE_TOP_M - SIDE_BOTTOM_M) * 1000) / 1000,
    bottomM: SIDE_BOTTOM_M,
    fleet: fleetCounts(models, FACTORY_TRAIN_CONTEXT.confirmed),
    stats: fleetStats(models, FACTORY_TRAIN_CONTEXT.confirmed),
    trains: trains.map((t) => {
      const cars = layOutTrain(t.cars, (c) => byCar.get(carKey(c))!, SIDE_MARGIN_M, SIDE_PX_PER_M);
      const last = cars[cars.length - 1]!;
      return { id: t.id, ground: t.ground, lengthM: Math.round((last.offsetM + last.widthM - SIDE_MARGIN_M) * 1000) / 1000, cars };
    }),
  };
  fs.writeFileSync(path.join(dir, "trains.json"), JSON.stringify(file, null, 1) + "\n");
  return { file, rendered, reused };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const started = Date.now();
  console.log("train parade:");
  const { file, rendered, reused } = await writeTrains(TRAIN_PARADE, EXPORT_DIR, console.log);
  const images = new Set(file.trains.flatMap((t) => t.cars.map((c) => c.image))).size;
  const types = Object.entries(file.fleet.types).map(([k, n]) => `${k} ${n}`).join(", ");
  console.log(`fleet: ${types}; ${file.fleet.variants} variants`);
  console.log(
    `wrote export/trains.json: ${file.trains.length} trains, ${images} images (${rendered} cars rendered, ${reused} reused), ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
}
