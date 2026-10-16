// Orthographic comparison of actual GLB vertices with the native BMP landmarks
// of the CD 230 (assets/cd-230/native/landmarks.json). Both noses are compared
// with the shared x_both front, both sides with the shared z_both side.
import fs from "node:fs";
import type { Vec3 } from "./meshCore.ts";
import { cd230 } from "./cd230.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";

export interface Cd230Landmark {
  id: string;
  /** x_both / x_both_rear: the front BMP at the +X / -X end; z_right / z_left: the side BMP on the +Z / -Z side. */
  view: "x_both" | "x_both_rear" | "z_right" | "z_left";
  /** Native pixel edges: left, top, right, bottom. */
  box: number[];
  /** A photo-calibrated box that supersedes `box` where photographs resolve what the BMP cannot. */
  photoBox?: number[];
  photoNote?: string;
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

/** Native pixel coordinates (0.1 m each) of a model point in a view: source x = 8.2 - x, front u = 1.5 - z seen from ahead. */
export function project(view: Cd230Landmark["view"], p: Vec3): [number, number] {
  const v = 10 * (6 - p[1]);
  if (view === "x_both") return [10 * (1.5 - p[2]), v];
  if (view === "x_both_rear") return [10 * (1.5 + p[2]), v];
  return [10 * (8.2 - p[0]), v];
}
export const canvasOf = (view: Cd230Landmark["view"]): [number, number] => (view.startsWith("x_") ? [30, 60] : [170, 60]);

export function cd230Comparison(build = cd230) {
  const reference = JSON.parse(
    fs.readFileSync(new URL("../assets/cd-230/native/landmarks.json", import.meta.url), "utf8"),
  ) as { annotations: Cd230Landmark[] };
  const mesh = build();
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(mesh.sourceTree("proc-vehicle-cd-230", "CD 230").root);
  const { json, bin } = parseGlb(mesh.toGlb("CD 230 comparison"));
  const tris = collectTriangles(json, bin);
  const byMaterial = new Map<string, typeof tris>();
  for (const t of tris) byMaterial.set(t.material, [...(byMaterial.get(t.material) ?? []), t]);
  return reference.annotations.map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`Missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((t) => t.p);
    const uv = points.map((p) => project(row.view, p));
    const actual = [Math.min(...uv.map((q) => q[0])), Math.min(...uv.map((q) => q[1])), Math.max(...uv.map((q) => q[0])), Math.max(...uv.map((q) => q[1]))];
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const [W, H] = canvasOf(row.view);
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
