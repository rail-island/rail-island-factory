// Orthographic review views of a design (side, front, rear, top, three-quarter
// thumbnail) rendered headlessly to PNGs, for checking a vehicle against its
// drawings and photographs. Node only:
//
//   pnpm exec tsx generator/orthoViews.ts <id> <out-dir> [name=value ...]
//
// Writes <out-dir>/<id>[-params]-{right,left,front,rear,top,thumb}.png.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { DESIGNS } from "./generate.ts";
import { collectTriangles, parseGlb, type Vec3 } from "./glbTriangles.ts";
import { renderGlbThumb } from "./renderGlbThumb.ts";

type View = { name: string; u: (p: Vec3) => number; v: (p: Vec3) => number; d: (p: Vec3) => number; light: Vec3 };

const VIEWS: View[] = [
  { name: "right", u: (p) => p[0], v: (p) => p[1], d: (p) => p[2], light: [0.3, 0.5, 1] },
  { name: "left", u: (p) => -p[0], v: (p) => p[1], d: (p) => -p[2], light: [-0.3, 0.5, -1] },
  { name: "front", u: (p) => -p[2], v: (p) => p[1], d: (p) => p[0], light: [1, 0.5, -0.3] },
  { name: "rear", u: (p) => p[2], v: (p) => p[1], d: (p) => -p[0], light: [-1, 0.5, 0.3] },
  { name: "top", u: (p) => p[0], v: (p) => -p[2], d: (p) => p[1], light: [0.2, 1, 0.3] },
];

function srgb(c: number): number {
  const v = Math.min(1, Math.max(0, c));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
}

export function orthoPng(glb: Uint8Array, view: View, pxPerM: number): PNG {
  const { json, bin } = parseGlb(glb);
  const tris = collectTriangles(json, bin);
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const t of tris) for (const p of t.p) {
    u0 = Math.min(u0, view.u(p)); u1 = Math.max(u1, view.u(p));
    v0 = Math.min(v0, view.v(p)); v1 = Math.max(v1, view.v(p));
  }
  const pad = 0.2;
  const W = Math.ceil((u1 - u0 + 2 * pad) * pxPerM);
  const H = Math.ceil((v1 - v0 + 2 * pad) * pxPerM);
  const png = new PNG({ width: W, height: H });
  const depth = new Float64Array(W * H).fill(-Infinity);
  const L = view.light;
  const ll = Math.hypot(...L);
  for (const t of tris) {
    const [a, b, c] = t.p;
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    const nl = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    const shade = 0.45 + 0.55 * Math.abs((n[0]! * L[0] + n[1]! * L[1] + n[2]! * L[2]) / (nl * ll));
    const col = t.color;
    const P = [a, b, c].map((p) => [(view.u(p) - u0 + pad) * pxPerM, (v1 + pad - view.v(p)) * pxPerM, view.d(p)] as const);
    const minX = Math.max(0, Math.floor(Math.min(P[0]![0], P[1]![0], P[2]![0])));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(P[0]![0], P[1]![0], P[2]![0])));
    const minY = Math.max(0, Math.floor(Math.min(P[0]![1], P[1]![1], P[2]![1])));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(P[0]![1], P[1]![1], P[2]![1])));
    const area = (P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[2]![0] - P[0]![0]) * (P[1]![1] - P[0]![1]);
    if (Math.abs(area) < 1e-12) continue;
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((P[1]![0] - px) * (P[2]![1] - py) - (P[2]![0] - px) * (P[1]![1] - py)) / area;
        const w1 = ((P[2]![0] - px) * (P[0]![1] - py) - (P[0]![0] - px) * (P[2]![1] - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * P[0]![2] + w1 * P[1]![2] + w2 * P[2]![2];
        const i = y * W + x;
        if (z <= depth[i]!) continue;
        depth[i] = z;
        png.data[i * 4] = srgb(col[0]! * shade);
        png.data[i * 4 + 1] = srgb(col[1]! * shade);
        png.data[i * 4 + 2] = srgb(col[2]! * shade);
        png.data[i * 4 + 3] = 255;
      }
  }
  return png;
}

if (process.argv[1] && process.argv[1].endsWith("orthoViews.ts")) {
  const [id, out, ...rest] = process.argv.slice(2);
  if (!id || !out) throw new Error("usage: tsx generator/orthoViews.ts <id> <out-dir> [name=value ...]");
  const params = Object.fromEntries(rest.map((a) => a.split("=") as [string, string]));
  const design = DESIGNS.get(id);
  if (!design) throw new Error(`no design ${id}`);
  const m = design.build(params);
  const glb = m.toGlb(`preview (${id})`, id);
  const tag = rest.length ? `${id}-${rest.map((a) => a.split("=")[1]).join("-")}` : id;
  fs.mkdirSync(out, { recursive: true });
  for (const v of VIEWS) fs.writeFileSync(path.join(out, `${tag}-${v.name}.png`), PNG.sync.write(orthoPng(glb, v, 40)));
  const tmp = path.join(os.tmpdir(), `${tag}.glb`);
  fs.writeFileSync(tmp, glb);
  fs.writeFileSync(path.join(out, `${tag}-thumb.png`), PNG.sync.write(renderGlbThumb(tmp, 640)));
  console.log(`${tag}: ${m.triangleCount()} triangles`);
}
