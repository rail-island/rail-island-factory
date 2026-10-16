// Orthographic comparison of actual GLB vertices with native vlakosimdb BMP
// landmarks for the small diesels (docs/models/small-diesels.md): each design
// keeps its annotated boxes in assets/<folder>/native/landmarks.json, in native
// pixel edges, and its own mapping from the model's frame to the native
// canvases. Node-only (reads the landmark files).
import fs from "node:fs";
import type { Vec3 } from "./meshCore.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { cd704 } from "./cd704.ts";
import { cd710 } from "./cd710.ts";
import { cd714 } from "./cd714.ts";

/**
 * x_front: the end BMP at the +X end, seen from ahead; x_rear: at the -X end;
 * z_right: the side BMP on the +Z side; z_left: on the -Z side.
 */
export type View = "x_front" | "x_rear" | "z_right" | "z_left";

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
  /** Toward the viewer, for the overlays' depth test. */
  depth: (view: View, p: Vec3) => number;
  canvas: Record<string, [number, number]>;
  files: Record<string, string>;
  mapping: string;
}

const depth = (v: View, p: Vec3): number => (v === "x_front" ? p[0] : v === "x_rear" ? -p[0] : v === "z_right" ? p[2] : -p[2]);
/** An end BMP of width w px (0.1 m a pixel, centred) and top `top` m: seen from ahead, +Z is on the left. */
const end = (v: View, p: Vec3, w: number, top: number): [number, number] => [v === "x_front" ? w / 2 - 10 * p[2] : w / 2 + 10 * p[2], 10 * (top - p[1])];

export const COMPARED: readonly ComparedDesign[] = [
  {
    id: "veh-cd-704", title: "CD 704", folder: "cd-704", build: () => cd704(), depth,
    project: (v, p) => (v.startsWith("x") ? end(v, p, 28, 4) : [10 * (p[0] + 3.75), 10 * (4 - p[1])]),
    canvas: { x_front: [28, 40], z_right: [80, 40] },
    files: { x_front: "native/cd_704/x_both.bmp", z_right: "native/cd_704/z_both.bmp" },
    mapping: "side column px = 10 (x + 3.75), row = 10 (4 - y); end column = 14 - 10 z, row = 10 (4 - y)",
  },
  {
    id: "veh-cd-710", title: "CD 710 620-6", folder: "cd-710", build: () => cd710(), depth,
    project: (v, p) => (v.startsWith("x") ? end(v, p, 30, 4.2) : [10 * (p[0] + 4.5), 10 * (4.2 - p[1])]),
    canvas: { x_front: [30, 42], z_right: [100, 42] },
    files: { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    mapping: "side column px = 10 (x + 4.5), row = 10 (4.2 - y); end column = 15 - 10 z, row = 10 (4.2 - y)",
  },
  {
    id: "veh-cd-714", title: "CD 714 017-1", folder: "cd-714", build: () => cd714(), depth,
    project: (v, p) => (v.startsWith("x") ? end(v, p, 30, 5) : [10 * (p[0] + 7), 10 * (5 - p[1])]),
    canvas: { x_front: [30, 50], z_right: [140, 50] },
    files: { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    mapping: "side column px = 10 (x + 7), row = 10 (5 - y); end column = 15 - 10 z, row = 10 (5 - y)",
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
    const [W, H] = d.canvas[row.view]!;
    const canvas = [W, H, W, H];
    const source = dims(row.box), model = dims(actual);
    const sourcePercent = source.map((x, i) => (100 * x) / canvas[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / canvas[i]!);
    return { ...row, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** Mean absolute error over the four components of every row, in percentage points. */
export const mae = (rows: ComparisonRow[]): number => rows.reduce((s, r) => s + r.delta.reduce((a, d) => a + Math.abs(d), 0), 0) / (4 * Math.max(1, rows.length));
