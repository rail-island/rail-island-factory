// Orthographic comparison of the diesel locomotives' actual GLB vertices with
// native BMP landmarks (assets/<folder>/native/landmarks.json): each face against
// the shared front BMP `x_both`, each side against the shared side BMP `z_both`.
// One configuration per design maps Factory coordinates to native pixels.
import fs from "node:fs";
import type { Vec3 } from "./meshCore.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { cd750 } from "./cd750.ts";
import { cd781 } from "./cd781.ts";
import { csdT6790, K as T679_K } from "./csdT679.ts";
import { csdT499 } from "./csdT499.ts";
import { cd771, K as CD771_K } from "./cd771.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";

export type View = "x_front" | "x_rear" | "z_right" | "z_left";

export interface DieselLandmark {
  id: string;
  view: View;
  /** Native pixel edges: left, top, right, bottom. */
  box: number[];
  /** A photo- or dimension-calibrated box that supersedes `box` where the BMP cannot resolve the feature. */
  photoBox?: number[];
  photoNote?: string;
  /** Source-tree scope ids (a prefix selects the whole scope). */
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface DieselComparisonConfig {
  id: string;
  title: string;
  folder: string;
  /** The vlakosimdb model the default livery comes from. */
  source: string;
  build: () => MeshBuilder;
  /** Native canvases in pixels: the side (z_both) and the front (x_both); 0.1 m a pixel. */
  side: [number, number];
  front: [number, number];
  /** Factory x to the side BMP's source x (metres). */
  sourceX: (x: number) => number;
  /** True when the side BMP draws +X at its left (the canvas runs against Factory x). */
  flipped?: boolean;
  /** How the mapping was set up, for the report. */
  mapping: string;
}

export const DIESEL_COMPARISONS: readonly DieselComparisonConfig[] = [
  {
    id: "proc-vehicle-cd-750", title: "CD 750 (Brejlovec), default livery", folder: "cd-750", source: "cd_750", build: () => cd750(),
    side: [160, 50], front: [30, 50], sourceX: (x) => x + 7.65,
    mapping: "source x = Factory x + 7.65; the side canvas is 16 x 5 m, the front 3 x 5 m",
  },
  {
    id: "proc-vehicle-cd-781", title: "CD 781, default livery", folder: "cd-781", source: "cd_781", build: () => cd781(),
    side: [180, 50], front: [30, 50], sourceX: (x) => x + 8.8,
    mapping: "source x = Factory x + 8.8; the side canvas is 18 x 5 m, the front 3 x 5 m",
  },
  {
    id: "proc-vehicle-csd-t679-0", title: "CSD T 679.0", folder: "csd-t679", source: "csd_t_679", build: () => csdT6790(),
    side: [190, 44], front: [30, 44], sourceX: (x) => x / T679_K + 9.45,
    mapping: `source x = Factory x / ${T679_K} + 9.45 (the drawing is scaled to the published 18.0 m over the buffers); the side canvas is 19 x 4.4 m, the front 3 x 4.4 m`,
  },
  {
    id: "proc-vehicle-csd-t499", title: "CSD T 499.0", folder: "csd-t499", source: "csd_t499", build: () => csdT499(),
    side: [180, 50], front: [30, 50], sourceX: (x) => x + 8.75,
    mapping: "source x = Factory x + 8.75; the side canvas is 18 x 5 m, the front 3 x 5 m",
  },
  {
    id: "proc-vehicle-cd-771", title: "CD 771 235, default livery", folder: "cd-771", source: "cd_771.235", build: () => cd771(),
    side: [180, 60], front: [30, 60], sourceX: (x) => 8.8 - x / CD771_K, flipped: true,
    mapping: `source x = 8.8 - Factory x / ${CD771_K} (the short hood toward +X; the drawing is scaled to the published 17.24 m over the buffers); the side canvas is 18 x 6 m, the front 3 x 6 m`,
  },
];

export const comparisonConfig = (id: string): DieselComparisonConfig => {
  const c = DIESEL_COMPARISONS.find((x) => x.id === id);
  if (!c) throw new Error(`no comparison for ${id}`);
  return c;
};

/** Native pixel coordinates (0.1 m each) of a model point in a view. */
export function project(c: DieselComparisonConfig, view: View, p: Vec3): [number, number] {
  const H = (view.startsWith("x_") ? c.front[1] : c.side[1]) / 10;
  const v = 10 * (H - p[1]);
  const hw = c.front[0] / 20;
  if (view === "x_front") return [10 * (hw - p[2]), v];
  if (view === "x_rear") return [10 * (hw + p[2]), v];
  return [10 * c.sourceX(p[0]), v];
}
export const canvasOf = (c: DieselComparisonConfig, view: View): [number, number] => (view.startsWith("x_") ? c.front : c.side);

export function readLandmarks(c: DieselComparisonConfig): DieselLandmark[] {
  const json = JSON.parse(fs.readFileSync(new URL(`../assets/${c.folder}/native/landmarks.json`, import.meta.url), "utf8")) as { annotations: DieselLandmark[] };
  return json.annotations;
}

export function dieselComparison(c: DieselComparisonConfig, build: () => MeshBuilder = c.build) {
  const rows = readLandmarks(c);
  const mesh = build();
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(mesh.sourceTree(c.id, c.title).root);
  const { json, bin } = parseGlb(mesh.toGlb(`${c.title} comparison`));
  const tris = collectTriangles(json, bin);
  const byMaterial = new Map<string, typeof tris>();
  for (const t of tris) byMaterial.set(t.material, [...(byMaterial.get(t.material) ?? []), t]);
  return rows.map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${c.id}: missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((t) => t.p);
    const uv = points.map((p) => project(c, row.view, p));
    const actual = [Math.min(...uv.map((q) => q[0])), Math.min(...uv.map((q) => q[1])), Math.max(...uv.map((q) => q[0])), Math.max(...uv.map((q) => q[1]))];
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const [W, H] = canvasOf(c, row.view);
    const canvas = [W, H, W, H];
    const source = dims(row.photoBox ?? row.box), model = dims(actual);
    const sourcePercent = source.map((x, i) => (100 * x) / canvas[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / canvas[i]!);
    return {
      ...row,
      reference: row.photoBox ? "photo" : "native",
      source,
      model,
      sourcePercent,
      modelPercent,
      delta: modelPercent.map((x, i) => x - sourcePercent[i]!),
    };
  });
}

/** Mean absolute error in percentage points over the rows' four components. */
export const meanAbsoluteError = (rows: ReadonlyArray<{ delta: number[] }>): number =>
  rows.reduce((sum, r) => sum + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, rows.length));
