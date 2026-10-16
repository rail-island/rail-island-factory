// Orthographic comparison of actual GLB vertices with native vlakosimdb BMP
// landmarks for the package's locomotives (docs/models/cz-electrics.md): each
// design keeps its annotated boxes in assets/<folder>/native/landmarks.json,
// in native pixel edges, and its own mapping from the model's frame to the
// native canvases. Node-only (reads the landmark files).
import fs from "node:fs";
import type { Vec3 } from "./meshCore.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { cd110 } from "./cd110.ts";
import { cd130 } from "./cd130.ts";
import { cd140 } from "./cd140.ts";
import { cd169 } from "./cd169.ts";

/** x_front: the front BMP at the +X end, seen from ahead (u = 1.5 - z); z_right: the side BMP on the +Z side. */
export type View = "x_front" | "z_right";

export interface Landmark {
  id: string;
  view: View;
  /** Native pixel edges: left, top, right, bottom. */
  box: number[];
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface ComparedDesign {
  id: string;
  title: string;
  folder: string;
  build: () => MeshBuilder;
  /** Native pixels of a model point in a view. */
  project: (view: View, p: Vec3) => [number, number];
  canvas: Record<View, [number, number]>;
  /** The native files each view was measured on. */
  files: Record<View, string>;
  mapping: string;
}

const front = (p: Vec3, rowsPerMetre = 10, top = 6): [number, number] => [10 * (1.5 - p[2]), rowsPerMetre * (top - p[1])];

export const COMPARED: readonly ComparedDesign[] = [
  {
    id: "proc-vehicle-cd-110", title: "CD 110 046-0", folder: "cd-110", build: () => cd110(),
    project: (v, p) => (v === "x_front" ? front(p) : [72 - 10 * p[0], 10 * (6 - p[1])]),
    canvas: { x_front: [30, 60], z_right: [144, 60] },
    files: { x_front: "native/cd_110_046/x_both.bmp", z_right: "native/cd_110_046/z_both.bmp" },
    mapping: "side column px = 72 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)",
  },
  {
    id: "proc-vehicle-cd-130", title: "CD 130 036-7", folder: "cd-130", build: () => cd130(),
    project: (v, p) => (v === "x_front" ? front(p) : [79.5 - 10 * p[0], 10 * (6 - p[1])]),
    canvas: { x_front: [30, 60], z_right: [170, 60] },
    files: { x_front: "native/cd_130/x_both.bmp", z_right: "native/cd_130/z_both.bmp" },
    mapping: "side column px = 79.5 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)",
  },
  {
    id: "proc-vehicle-cd-140", title: "CD 140 040", folder: "cd-140", build: () => cd140(),
    project: (v, p) => (v === "x_front" ? front(p) : [85.5 - p[0] / (0.1 * (14.5 / 16.1)), 10 * (6 - p[1])]),
    canvas: { x_front: [30, 60], z_right: [180, 60] },
    files: { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    mapping: "side column px = 85.5 - x / 0.09006 (the native body scaled to the published 14.50 m), row = 10 (6 - y); front column = 10 (1.5 - z)",
  },
  {
    id: "proc-vehicle-cd-169", title: "CD 169 001", folder: "cd-169", build: () => cd169(),
    project: (v, p) => (v === "x_front" ? front(p) : [90 - p[0] / (0.1 * (16.7 / 17.2)), 10 * (6 - p[1])]),
    canvas: { x_front: [30, 60], z_right: [180, 60] },
    files: { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    mapping: "side column px = 90 - x / 0.0971 (the native body scaled to the published 16.70 m), row = 10 (6 - y); front column = 10 (1.5 - z)",
  },
];

export function landmarks(folder: string): Landmark[] {
  const file = new URL(`../assets/${folder}/native/landmarks.json`, import.meta.url);
  return (JSON.parse(fs.readFileSync(file, "utf8")) as { annotations: Landmark[] }).annotations;
}

export interface ComparisonRow extends Landmark {
  source: number[];
  model: number[];
  sourcePercent: number[];
  modelPercent: number[];
  delta: number[];
}

/** Every landmark of a design measured on its default build. */
export function compare(d: ComparedDesign, rows = landmarks(d.folder)): ComparisonRow[] {
  const mesh = d.build();
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
    const source = dims(row.box), model = dims(actual);
    const sourcePercent = source.map((x, i) => (100 * x) / canvas[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / canvas[i]!);
    return { ...row, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** Mean absolute error over the four components of every row, in percentage points. */
export const mae = (rows: ComparisonRow[]): number => rows.reduce((s, r) => s + r.delta.reduce((a, d) => a + Math.abs(d), 0), 0) / (4 * Math.max(1, rows.length));
