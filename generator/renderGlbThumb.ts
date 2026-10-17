// Offline thumbnail renderer for a GLB -- the build's in-memory bytes, or a file
// for the CLI: a tiny software rasterizer (no WebGL, no
// browser) that reads the model's triangles and baseColorFactor materials and
// shades them. The background is transparent, so the PNG drops onto any card
// colour. Pure Node (pngjs). Two views:
//
//  - the three-quarter view (renderGlbThumb): a perspective view from above a
//    corner, fitted to a square, with the three-light setup the game's in-app
//    building thumbnails use -- buildings, ships, aircraft, cable car cabins;
//  - the side view (renderGlbSideThumb): an orthographic elevation of a road or
//    rail vehicle, nose to the LEFT, at a fixed scale (SIDE_PX_PER_M) over a fixed
//    height window from just below the rail (SIDE_BOTTOM_M..SIDE_TOP_M), lit as the
//    game lights its own side views. It is the game's side thumbnail exactly
//    framed (webapp src/models/modelThumbRender.ts), so the webapp can ship it
//    in place of rendering the default variant itself.
//
//   pnpm exec tsx generator/renderGlbThumb.ts <design id | model.glb> <out.png> [size|side]
//
// A design id is built in memory (the export holds no GLB files).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import {
  collectTriangles, cross, dot, norm, parseGlb, sub, triBounds, xformPoint,
  type Mat4, type Tri, type Vec3,
} from "./glbTriangles.ts";

const VIEW_DIR = norm([0.8, 0.7, 0.9]);
const KEY_DIR = norm([40, 80, 30]);
const FILL_DIR = norm([-30, 20, -40]);
const AMBIENT = 0.38;
const KEY = 0.72;
const FILL = 0.22;
const FOV_DEG = 45;
const FIT = 0.9; // fraction of the frame the model's bounding box fills
const SS = 3; // supersampling factor (rendered at size*SS, box-filtered down)

/**
 * The side view's frame, in metres of the model (y = 0 is the rail or the road).
 * The vertical window and the margins are the game's (webapp
 * src/models/modelThumbRender.ts SIDE_BOTTOM_M, SIDE_TOP_M, SIDE_MARGIN_M): change
 * them only together with it.
 */
export const SIDE_BOTTOM_M = -0.3;
export const SIDE_TOP_M = 5.7;
export const SIDE_MARGIN_M = 0.3;
/** Pixels per metre of a side view: twice the game's 16, so the site gets a sharp picture. */
export const SIDE_PX_PER_M = 32;
/** The widest side image, in pixels; a longer vehicle is drawn at a smaller scale. */
export const SIDE_MAX_PX = 4096;
/**
 * The side view's light: the game's ambient 1.2 and directional 1.5 (three.js
 * physically based units, diffuse = colour / pi per unit), the light at (0.4, 1,
 * 1.2) of the game's vehicle frame -- the factory's frame turned round, (-0.4, 1, -1.2).
 */
const SIDE_AMBIENT = 1.2 / Math.PI;
const SIDE_KEY = 1.5 / Math.PI;
const SIDE_KEY_DIR = norm([-0.4, 1, -1.2]);

/** What a side thumbnail spans: the image's metres, for drawing it to scale. */
export interface SideFrame {
  /** Metres from the left edge to the right edge: the vehicle's length and both margins. */
  widthM: number;
  /** Metres from the bottom edge to the top edge (SIDE_TOP_M - SIDE_BOTTOM_M). */
  heightM: number;
  /** The rail's (or road's) height above the bottom edge is -bottomM. */
  bottomM: number;
}

function toSrgb(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** A point projected into the supersampled buffer: pixel x and y, and view depth (> 0). */
type Projected = { x: number; y: number; w: number };

/**
 * Rasterize `tris` into a `width` x `height` RGBA PNG (rendered at SS times the
 * size and box-filtered down, coverage kept as alpha). `project` takes a world
 * point to the supersampled buffer; `perspective` interpolates depth-correctly;
 * `toEye` is the direction from a world point to the camera, which flips a normal
 * that faces away (the rasterizer does not cull, so a face wound inward still
 * looks right here -- the game would not draw it, the mesh builder's winding test
 * is what catches that).
 */
function rasterize(
  tris: readonly Tri[],
  width: number,
  height: number,
  project: (p: Vec3) => Projected | null,
  perspective: boolean,
  toEye: (world: Vec3) => Vec3,
  shade: (n: Vec3) => number,
): PNG {
  const W = width * SS;
  const H = height * SS;
  const depth = new Float64Array(W * H).fill(Infinity);
  const rgb = new Float64Array(W * H * 3);
  const cov = new Uint8Array(W * H);

  for (const tri of tris) {
    const ps = tri.p.map(project);
    if (ps.some((v) => v === null)) continue;
    const [a, b, c] = ps as [Projected, Projected, Projected];
    const sx = [a.x, b.x, c.x];
    const sy = [a.y, b.y, c.y];
    const iw = perspective ? [1 / a.w, 1 / b.w, 1 / c.w] : [1, 1, 1];
    const dw = [a.w, b.w, c.w];
    const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
    if (area === 0) continue;
    const x0 = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2])));
    const x1 = Math.min(W - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2])));
    const y0 = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2])));
    const y1 = Math.min(H - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2])));
    for (let y = y0; y <= y1; y++) {
      const py = y + 0.5;
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        let b0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
        let b1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
        let b2 = 1 - b0 - b1;
        if (b0 < 0 || b1 < 0 || b2 < 0) continue;
        let z: number;
        if (perspective) {
          // perspective-correct interpolation weights
          const wsum = b0 * iw[0] + b1 * iw[1] + b2 * iw[2];
          z = 1 / wsum; // view-space depth
          b0 = (b0 * iw[0]) / wsum;
          b1 = (b1 * iw[1]) / wsum;
          b2 = 1 - b0 - b1;
        } else {
          z = b0 * dw[0] + b1 * dw[1] + b2 * dw[2];
        }
        const at = y * W + x;
        if (z >= depth[at]) continue;
        depth[at] = z;
        let n: Vec3 = norm([
          tri.n[0][0] * b0 + tri.n[1][0] * b1 + tri.n[2][0] * b2,
          tri.n[0][1] * b0 + tri.n[1][1] * b1 + tri.n[2][1] * b2,
          tri.n[0][2] * b0 + tri.n[1][2] * b1 + tri.n[2][2] * b2,
        ]);
        const world: Vec3 = [
          tri.p[0][0] * b0 + tri.p[1][0] * b1 + tri.p[2][0] * b2,
          tri.p[0][1] * b0 + tri.p[1][1] * b1 + tri.p[2][1] * b2,
          tri.p[0][2] * b0 + tri.p[1][2] * b1 + tri.p[2][2] * b2,
        ];
        if (dot(n, toEye(world)) < 0) n = [-n[0], -n[1], -n[2]];
        const lit = shade(n);
        rgb[at * 3] = tri.color[0] * lit;
        rgb[at * 3 + 1] = tri.color[1] * lit;
        rgb[at * 3 + 2] = tri.color[2] * lit;
        cov[at] = 1;
      }
    }
  }

  // Box-filter the supersampled buffer down, keeping coverage as alpha.
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const at = (y * SS + sy) * W + (x * SS + sx);
          if (!cov[at]) continue;
          r += rgb[at * 3];
          g += rgb[at * 3 + 1];
          b += rgb[at * 3 + 2];
          a += 1;
        }
      }
      const o = (y * width + x) * 4;
      if (a === 0) {
        png.data[o] = png.data[o + 1] = png.data[o + 2] = png.data[o + 3] = 0;
        continue;
      }
      png.data[o] = Math.round(toSrgb(r / a) * 255);
      png.data[o + 1] = Math.round(toSrgb(g / a) * 255);
      png.data[o + 2] = Math.round(toSrgb(b / a) * 255);
      png.data[o + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return png;
}

/** A GLB: its bytes, or the path of a file holding them. */
export type GlbSource = Uint8Array | string;

function readTriangles(glb: GlbSource): Tri[] {
  const { json, bin } = parseGlb(typeof glb === "string" ? fs.readFileSync(glb) : glb);
  const tris = collectTriangles(json, bin);
  if (tris.length === 0) throw new Error(`${typeof glb === "string" ? path.basename(glb) : "the GLB"} has no triangles`);
  return tris;
}

/** Render the GLB as a `size` x `size` RGBA PNG, in the three-quarter view. */
export function renderGlbThumb(glb: GlbSource, size: number): PNG {
  const tris = readTriangles(glb);
  const { min: mn, max: mx } = triBounds(tris);
  const center: Vec3 = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  const maxDim = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1;

  const fov = (FOV_DEG * Math.PI) / 180;
  const corners: Vec3[] = [];
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++)
    corners.push([a ? mx[0] : mn[0], b ? mx[1] : mn[1], c ? mx[2] : mn[2]]);

  // View matrix for a camera at `center + VIEW_DIR * dist` looking at the centre.
  const viewFor = (dist: number): { m: Mat4; eye: Vec3 } => {
    const eye: Vec3 = [center[0] + VIEW_DIR[0] * dist, center[1] + VIEW_DIR[1] * dist, center[2] + VIEW_DIR[2] * dist];
    const zAxis = norm(sub(eye, center)); // camera looks down -z
    const xAxis = norm(cross([0, 1, 0], zAxis));
    const yAxis = cross(zAxis, xAxis);
    return {
      eye,
      m: [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
      ],
    };
  };

  const f = 1 / Math.tan(fov / 2);
  let dist = maxDim * 2.5;
  const near = maxDim / 100;
  const far = maxDim * 100;
  // Auto-frame: pull the camera back until the bounding box fits within FIT of
  // the frame. Perspective makes this non-linear, so converge over a few passes.
  for (let pass = 0; pass < 12; pass++) {
    const { m } = viewFor(dist);
    let worst = 0;
    for (const c of corners) {
      const v = xformPoint(m, c);
      const w = Math.max(1e-6, -v[2]);
      worst = Math.max(worst, Math.abs((v[0] * f) / w), Math.abs((v[1] * f) / w));
    }
    if (worst <= 1e-6) break;
    dist *= worst / FIT;
    if (Math.abs(worst - FIT) < 0.002) break;
  }
  const { m: view, eye } = viewFor(dist);
  const W = size * SS;
  const H = size * SS;
  return rasterize(
    tris,
    size,
    size,
    (p) => {
      const v = xformPoint(view, p);
      const w = -v[2];
      // No near-plane clipping: the camera is auto-framed outside the model.
      if (w <= near || w >= far) return null;
      return { x: ((v[0] * f) / w * 0.5 + 0.5) * W, y: (0.5 - (v[1] * f) / w * 0.5) * H, w };
    },
    true,
    (world) => norm(sub(eye, world)),
    (n) => AMBIENT + KEY * Math.max(0, dot(n, KEY_DIR)) + FILL * Math.max(0, dot(n, FILL_DIR)),
  );
}

/** The side view's frame for a model spanning `minX`..`maxX` metres, and its pixel size. */
export function sideFrame(minX: number, maxX: number): SideFrame & { width: number; height: number; pxPerM: number } {
  const widthM = maxX - minX + 2 * SIDE_MARGIN_M;
  const heightM = SIDE_TOP_M - SIDE_BOTTOM_M;
  const pxPerM = Math.min(SIDE_PX_PER_M, SIDE_MAX_PX / widthM);
  return {
    widthM,
    heightM,
    bottomM: SIDE_BOTTOM_M,
    width: Math.max(1, Math.round(widthM * pxPerM)),
    height: Math.max(1, Math.round(heightM * pxPerM)),
    pxPerM,
  };
}

/** The side frame of the GLB, without rendering it. */
export function glbSideFrame(glb: GlbSource): SideFrame {
  const { min, max } = triBounds(readTriangles(glb));
  const { widthM, heightM, bottomM } = sideFrame(min[0], max[0]);
  return { widthM, heightM, bottomM };
}

/**
 * Render the GLB -- a road or rail vehicle built nose-first along +X -- in the
 * side view: seen from its -Z flank, nose on the left, orthographic.
 */
export function renderGlbSideThumb(glb: GlbSource): { png: PNG; frame: SideFrame } {
  const tris = readTriangles(glb);
  const { min, max } = triBounds(tris);
  const f = sideFrame(min[0], max[0]);
  const right = max[0] + SIDE_MARGIN_M; // the nose's end of the frame, drawn at the left edge
  const k = f.pxPerM * SS;
  const camZ = min[2] - 100;
  const eyeDir: Vec3 = [0, 0, -1];
  const png = rasterize(
    tris,
    f.width,
    f.height,
    (p) => ({ x: (right - p[0]) * k, y: (SIDE_TOP_M - p[1]) * k, w: p[2] - camZ }),
    false,
    () => eyeDir,
    (n) => SIDE_AMBIENT + SIDE_KEY * Math.max(0, dot(n, SIDE_KEY_DIR)),
  );
  return { png, frame: { widthM: f.widthM, heightM: f.heightM, bottomM: f.bottomM } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [glbArg, outArg, sizeArg] = process.argv.slice(2);
  if (!glbArg || !outArg) {
    console.error("usage: tsx generator/renderGlbThumb.ts <design id | model.glb> <out.png> [size|side]");
    process.exit(1);
  }
  // a design id is built here; imported lazily, as generate.ts imports this module
  const glb: GlbSource = glbArg.toLowerCase().endsWith(".glb") ? glbArg : (await import("./generate.ts")).designGlb(glbArg);
  const png = sizeArg === "side" ? renderGlbSideThumb(glb).png : renderGlbThumb(glb, sizeArg ? Number(sizeArg) : 512);
  fs.mkdirSync(path.dirname(outArg), { recursive: true });
  fs.writeFileSync(outArg, PNG.sync.write(png));
  console.log(`wrote ${outArg} (${png.width}x${png.height})`);
}
