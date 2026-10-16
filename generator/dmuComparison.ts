// Orthographic comparison of actual GLB vertices with native vlakosimdb BMP
// landmarks for the package's railcars (docs/models/czech-dmus.md): each
// compared car keeps its annotated boxes in assets/<folder>/native/<key>/landmarks.json,
// in native pixel edges, and maps the model's frame back to the native canvases
// through its Car frame (dmuKit.ts), undoing the documented scales.
// Node-only (reads the landmark files).
import fs from "node:fs";
import type { Vec3 } from "./meshCore.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { CZ_DMUS } from "./czDmus.ts";
import { K810 } from "./dmu810.ts";
import { K812 } from "./dmu812.ts";
import { K131 } from "./dmuM131.ts";
import { K240 } from "./dmuM240.ts";
import { K296 } from "./dmuM296.ts";

/** side: the side BMP on the +Z side (z_dec or z_both); front: the front BMP of the +X end, seen from ahead. */
export type View = "side" | "front";

export interface Landmark {
  id: string;
  view: View;
  /** Native pixel edges: left, top, right, bottom. */
  box: number[];
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface ComparedCar {
  id: string;
  params: ParamValues;
  title: string;
  folder: string;
  /** The native folder under assets/<folder>/native/ holding landmarks.json. */
  key: string;
  report: string;
  /** Native pixels of a model point in a view, scales undone. */
  project: (view: View, p: Vec3) => [number, number];
  canvas: Record<View, [number, number]>;
  files: Record<View, string>;
  mapping: string;
}

/** The side and front projections of a car frame: model x -> column (x / kx + centre) * 10, y -> row (H - y / ky) * 10. */
function frame(kx: number, ky: number, kz: number, centre: number, sideH: number, frontH: number, flipX = false) {
  return (view: View, p: Vec3): [number, number] =>
    view === "side"
      ? [10 * ((flipX ? -p[0] : p[0]) / kx + centre), 10 * (sideH - p[1] / ky)]
      : [10 * (1.5 - p[2] / kz), 10 * (frontH - p[1] / ky)];
}

export const DMU_COMPARED: ComparedCar[] = [
  {
    id: "proc-vehicle-cd-810", params: {}, title: "CD 810 604-9 (red)", folder: "cd-810", key: "cd_810_1", report: "COMPARISON.md",
    project: frame(K810, 1, 1, 6.65, 4, 4),
    canvas: { side: [140, 40], front: [30, 40] },
    files: { side: "native/cd_810_1/z_dec.bmp", front: "native/cd_810_1/2x_both.bmp" },
    mapping: "side column = 10 (x / 1.04824 + 6.65) (the XML body scaled to the published 13.103 m), row = 10 (4 - y); front column = 10 (1.5 - z), row = 10 (4 - y)",
  },
  {
    id: "proc-vehicle-cd-812", params: {}, title: "CD 812 613-8 (motor car)", folder: "cd-812", key: "cd_812_613", report: "COMPARISON.md",
    project: frame(K812, 1, 1, 7.5, 6, 6),
    canvas: { side: [160, 60], front: [30, 60] },
    files: { side: "native/cd_812_613/z_dec.bmp", front: "native/cd_812_613/x_both.bmp" },
    mapping: "side column = 10 (x / 0.96467 + 7.5) (the XML scaled to the published 14.47 m over the buffers), row = 10 (6 - y); the front is compared with photographs, not the BMP",
  },
  {
    id: "proc-vehicle-cd-843", params: {}, title: "CD 843 024-1 (motor car)", folder: "cd-843", key: "cd_843", report: "COMPARISON.md",
    project: frame(1, 1, 1, 12.05, 5, 5),
    canvas: { side: [250, 50], front: [30, 50] },
    files: { side: "native/cd_843/843_z_both.bmp", front: "native/cd_843/843_x_both.bmp" },
    mapping: "side column = 10 (x + 12.05) (unscaled: the XML's 24.1 m body is the published one), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y)",
  },
  {
    id: "proc-vehicle-csd-m131", params: {}, title: "CSD M 131.1238 (motor car)", folder: "csd-m131", key: "csd_m131", report: "COMPARISON.md",
    project: frame(K131, 1, 1, 5.85, 5, 5),
    canvas: { side: [140, 50], front: [30, 50] },
    files: { side: "native/csd_m131/z_both.bmp", front: "native/csd_m131/x_both.bmp" },
    mapping: "side column = 10 (x / 1.05217 + 5.85) (the XML scaled to the published 12.1 m over the buffers), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y)",
  },
  {
    id: "proc-vehicle-csd-m240", params: {}, title: "CSD M 240.0113", folder: "csd-m240", key: "csd_m240", report: "COMPARISON.md",
    project: frame(K240, 1, 1, 9.55, 4, 4),
    canvas: { side: [191, 40], front: [30, 40] },
    files: { side: "native/csd_m240/z_both.bmp", front: "native/csd_m240/x_both.bmp" },
    mapping: "side column = 10 (x / 0.97368 + 9.55) (the XML scaled to the published 18.5 m over the buffers), row = 10 (4 - y); front column = 10 (1.5 - z), row = 10 (4 - y)",
  },
  {
    id: "proc-vehicle-csd-m296", params: {}, title: "CSD M 296.1028", folder: "csd-m296", key: "csd_m296", report: "COMPARISON.md",
    project: frame(K296, 1, 1, 12.45, 5, 5),
    canvas: { side: [250, 50], front: [30, 50] },
    files: { side: "native/csd_m296/z_both.bmp", front: "native/csd_m296/x_dec.bmp" },
    mapping: "side column = 10 (x / 1.00772 + 12.45) (the XML scaled to the published 24.79 m over the buffers), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y)",
  },
];

export function landmarks(d: ComparedCar): Landmark[] {
  const file = new URL(`../assets/${d.folder}/native/${d.key}/landmarks.json`, import.meta.url);
  return (JSON.parse(fs.readFileSync(file, "utf8")) as { annotations: Landmark[] }).annotations;
}

export interface ComparisonRow extends Landmark {
  source: number[];
  model: number[];
  sourcePercent: number[];
  modelPercent: number[];
  delta: number[];
}

/** Every landmark of a compared car measured on its build. */
export function compare(d: ComparedCar, rows = landmarks(d)): ComparisonRow[] {
  const design = CZ_DMUS.find((x) => x.id === d.id)!;
  const mesh: MeshBuilder = design.build(d.params);
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(mesh.sourceTree(d.id, d.title).root);
  const { json, bin } = parseGlb(mesh.toGlb(`${d.title} comparison`));
  const tris = collectTriangles(json, bin);
  const byMaterial = new Map<string, typeof tris>();
  for (const t of tris) byMaterial.set(t.material, [...(byMaterial.get(t.material) ?? []), t]);
  return rows.map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${d.id}: missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((t) => t.p);
    const uv = points.map((p) => d.project(row.view, p as Vec3));
    const actual = [Math.min(...uv.map((q) => q[0])), Math.min(...uv.map((q) => q[1])), Math.max(...uv.map((q) => q[0])), Math.max(...uv.map((q) => q[1]))];
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const [W, H] = d.canvas[row.view];
    const canvas = [W, H, W, H];
    const source = dims(row.box);
    const model = dims(actual);
    const sourcePercent = source.map((x, i) => (100 * x) / canvas[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / canvas[i]!);
    return { ...row, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** Mean absolute error over the four components of every row, in percentage points. */
export const mae = (rows: ComparisonRow[]): number => rows.reduce((s, r) => s + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, rows.length));
