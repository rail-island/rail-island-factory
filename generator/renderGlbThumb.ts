// Offline thumbnail renderer for a GLB: a tiny software rasterizer (no WebGL, no
// browser) that reads the model's triangles and baseColorFactor materials and
// shades them with the three-light setup the game's in-app building thumbnails
// use, from the same three-quarter view. The background is transparent, so the
// PNG drops onto any card colour. Pure Node (pngjs):
//
//   pnpm exec tsx generator/renderGlbThumb.ts <model.glb> <out.png> [size]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import {
  collectTriangles, cross, dot, norm, parseGlb, sub, triBounds, xformPoint,
  type Mat4, type Vec3,
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

function toSrgb(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Render the GLB at `glbPath` as a `size` x `size` RGBA PNG. */
export function renderGlbThumb(glbPath: string, size: number): PNG {
  const { json, bin } = parseGlb(fs.readFileSync(glbPath));
  const tris = collectTriangles(json, bin);
  if (tris.length === 0) throw new Error(`${path.basename(glbPath)} has no triangles`);

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
  const depth = new Float64Array(W * H).fill(Infinity);
  const rgb = new Float64Array(W * H * 3);
  const cov = new Uint8Array(W * H);
  const shade = (n: Vec3): number =>
    AMBIENT + KEY * Math.max(0, dot(n, KEY_DIR)) + FILL * Math.max(0, dot(n, FILL_DIR));

  for (const tri of tris) {
    const vs = tri.p.map((p) => xformPoint(view, p)) as [Vec3, Vec3, Vec3];
    // No near-plane clipping: the camera is auto-framed outside the model.
    if (vs.some((v) => -v[2] <= near || -v[2] >= far)) continue;
    const sx: number[] = [], sy: number[] = [], iw: number[] = [];
    for (const v of vs) {
      const w = -v[2];
      iw.push(1 / w);
      sx.push(((v[0] * f) / w * 0.5 + 0.5) * W);
      sy.push((0.5 - (v[1] * f) / w * 0.5) * H);
    }
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
        // perspective-correct interpolation weights
        const wsum = b0 * iw[0] + b1 * iw[1] + b2 * iw[2];
        const z = 1 / wsum; // view-space depth
        const at = y * W + x;
        if (z >= depth[at]) continue;
        depth[at] = z;
        b0 = (b0 * iw[0]) / wsum;
        b1 = (b1 * iw[1]) / wsum;
        b2 = 1 - b0 - b1;
        let n: Vec3 = norm([
          tri.n[0][0] * b0 + tri.n[1][0] * b1 + tri.n[2][0] * b2,
          tri.n[0][1] * b0 + tri.n[1][1] * b1 + tri.n[2][1] * b2,
          tri.n[0][2] * b0 + tri.n[1][2] * b1 + tri.n[2][2] * b2,
        ]);
        // Shade the visible side: the rasterizer does not cull, so a face wound
        // inward still looks right here (the game would not draw it -- the mesh
        // builder's winding test is what catches that).
        const world: Vec3 = [
          tri.p[0][0] * b0 + tri.p[1][0] * b1 + tri.p[2][0] * b2,
          tri.p[0][1] * b0 + tri.p[1][1] * b1 + tri.p[2][1] * b2,
          tri.p[0][2] * b0 + tri.p[1][2] * b1 + tri.p[2][2] * b2,
        ];
        if (dot(n, norm(sub(eye, world))) < 0) n = [-n[0], -n[1], -n[2]];
        const lit = shade(n);
        rgb[at * 3] = tri.color[0] * lit;
        rgb[at * 3 + 1] = tri.color[1] * lit;
        rgb[at * 3 + 2] = tri.color[2] * lit;
        cov[at] = 1;
      }
    }
  }

  // Box-filter the supersampled buffer down, keeping coverage as alpha.
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
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
      const o = (y * size + x) * 4;
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [glbArg, outArg, sizeArg] = process.argv.slice(2);
  if (!glbArg || !outArg) {
    console.error("usage: tsx generator/renderGlbThumb.ts <model.glb> <out.png> [size]");
    process.exit(1);
  }
  const png = renderGlbThumb(glbArg, sizeArg ? Number(sizeArg) : 512);
  fs.mkdirSync(path.dirname(outArg), { recursive: true });
  fs.writeFileSync(outArg, PNG.sync.write(png));
  console.log(`wrote ${outArg} (${png.width}x${png.height})`);
}
