// Shaded orthographic review views of a mesh, for the foreign multiple units'
// reports (unitReport.ts): a small depth-buffered rasterizer, as emuReport.ts has.
// Node only. Generated images go to export/review/, never committed.
import fs from "node:fs";
import { PNG } from "pngjs";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import type { MeshBuilder } from "./meshBuilder.ts";

export type P3 = readonly number[];

export interface Tri {
  p: P3[];
  rgb: number[];
  n: number[];
}

/** Rasterizes triangles with a per-pixel depth buffer; `project` gives (u, v, depth) in output pixels. */
export function raster(tris: Tri[], W: number, H: number, project: (p: P3) => number[], shade: (t: Tri) => number[]): PNG {
  const png = new PNG({ width: W, height: H });
  const zb = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set([229, 231, 235, 255], i * 4);
  for (const t of tris) {
    const q = t.p.map(project);
    const [a, b, c] = q as [number[], number[], number[]];
    const den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(den) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(...q.map((v) => v[0]!))));
    const x1 = Math.min(W - 1, Math.ceil(Math.max(...q.map((v) => v[0]!))));
    const y0 = Math.max(0, Math.floor(Math.min(...q.map((v) => v[1]!))));
    const y1 = Math.min(H - 1, Math.ceil(Math.max(...q.map((v) => v[1]!))));
    const rgb = shade(t);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const l1 = ((b[1]! - c[1]!) * (x + 0.5 - c[0]!) + (c[0]! - b[0]!) * (y + 0.5 - c[1]!)) / den;
        const l2 = ((c[1]! - a[1]!) * (x + 0.5 - c[0]!) + (a[0]! - c[0]!) * (y + 0.5 - c[1]!)) / den;
        const l3 = 1 - l1 - l2;
        if (Math.min(l1, l2, l3) < -1e-7) continue;
        const z = l1 * a[2]! + l2 * b[2]! + l3 * c[2]!;
        const i = y * W + x;
        if (z <= zb[i]!) continue;
        zb[i] = z;
        png.data.set([...rgb, 255], i * 4);
      }
  }
  return png;
}

export function trianglesOf(mesh: MeshBuilder, id: string): Tri[] {
  const { json, bin } = parseGlb(mesh.toGlb(id));
  const tree = mesh.sourceTree(id, id);
  const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
  return collectTriangles(json, bin).map((t) => {
    const hex = colors.get(t.material)!.slice(1);
    const u = [0, 1, 2].map((k) => t.p[1]![k]! - t.p[0]![k]!);
    const v = [0, 1, 2].map((k) => t.p[2]![k]! - t.p[0]![k]!);
    const n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    return { p: t.p, rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), n: n.map((x) => x / l) };
  });
}

const lit = (t: Tri) => {
  const light = [0.35, 0.8, 0.5].map((x) => x / Math.hypot(0.35, 0.8, 0.5));
  const k = 0.55 + 0.45 * Math.max(0, t.n[0]! * light[0]! + t.n[1]! * light[1]! + t.n[2]! * light[2]!);
  return t.rgb.map((c) => Math.min(255, Math.round(c * k + 10)));
};

/** A shaded orthographic view: yaw about y (degrees, 0 = looking at the +Z side), pitch down. */
function view(tris: Tri[], yawDeg: number, pitchDeg: number, width: number): PNG {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const rot = (p: P3) => {
    const x = p[0]! * Math.cos(yaw) - p[2]! * Math.sin(yaw);
    const z = p[0]! * Math.sin(yaw) + p[2]! * Math.cos(yaw);
    return [x, p[1]! * Math.cos(pitch) - z * Math.sin(pitch), p[1]! * Math.sin(pitch) + z * Math.cos(pitch)];
  };
  const pts = tris.flatMap((t) => t.p.map(rot));
  const [minX, maxX] = [Math.min(...pts.map((p) => p[0]!)), Math.max(...pts.map((p) => p[0]!))];
  const [minY, maxY] = [Math.min(...pts.map((p) => p[1]!)), Math.max(...pts.map((p) => p[1]!))];
  const s = width / (maxX - minX + 0.4);
  return raster(tris, Math.ceil((maxX - minX + 0.4) * s), Math.ceil((maxY - minY + 0.4) * s), (p) => {
    const r = rot(p);
    return [(r[0]! - minX + 0.2) * s, (maxY - r[1]! + 0.2) * s, r[2]!];
  }, lit);
}

/** Writes the standard review views of a mesh into `dir`. */
export function writeViews(mesh: MeshBuilder, id: string, dir: URL): void {
  fs.mkdirSync(dir, { recursive: true });
  const tris = trianglesOf(mesh, id);
  const views: Array<[string, number, number, number]> = [
    ["side-right", 0, 0, 1800],
    ["side-left", 180, 0, 1800],
    ["front", 90, 0, 500],
    ["rear", -90, 0, 500],
    ["three-quarter-front", -35, 22, 1600],
    ["three-quarter-rear", 145, 22, 1600],
    ["top", 0, 89.9, 1800],
  ];
  for (const [name, yaw, pitch, w] of views) fs.writeFileSync(new URL(`${name}.png`, dir), PNG.sync.write(view(tris, yaw, pitch, w)));
}

