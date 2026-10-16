// Orthographic comparison of actual GLB vertices with native BMP landmarks.
import fs from "node:fs";
import { cd150 } from "./cd150.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type TreeNode, type LeafNode } from "./sourceTree.ts";
export interface Landmark {
  id: string;
  view: string;
  box: number[];
  /** A photo-calibrated box that supersedes `box` where photographs resolve what the BMP cannot. */
  photoBox?: number[];
  photoNote?: string;
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}
export function cd150Comparison() {
  const reference = JSON.parse(
    fs.readFileSync(
      new URL("../assets/cd-150/native/landmarks.json", import.meta.url),
      "utf8",
    ),
  ) as { annotations: Landmark[] };
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  const mesh = cd150();
  walk(mesh.sourceTree("proc-vehicle-cd-150", "CD 150").root);
  const { json, bin } = parseGlb(mesh.toGlb("CD 150 comparison"));
  const tris = collectTriangles(json, bin);
  const materials = new Map(
    [...new Set(tris.map((t) => t.material))].map((mat) => [
      mat,
      tris.filter((t) => t.material === mat),
    ]),
  );
  return reference.annotations.map((row) => {
    const nodes = leaves.filter((n) =>
      row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")),
    );
    if (!nodes.length)
      throw new Error(`Missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes
      .flatMap((n) =>
        materials.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1]),
      )
      .flatMap((t) => t.p);
    const u = points.map((p) =>
      row.view === "x_both" ? 10 * (1.5 - p[2]) : 10 * (p[0] + 8.5),
    );
    const v = points.map((p) => 10 * (6 - p[1]));
    const actual = [
      Math.min(...u),
      Math.min(...v),
      Math.max(...u),
      Math.max(...v),
    ];
    const dimensions = (b: number[]) => [
      b[0]!,
      b[1]!,
      b[2]! - b[0]!,
      b[3]! - b[1]!,
    ];
    const reference = row.photoBox ? "photo" : "native";
    const source = dimensions(row.photoBox ?? row.box),
      model = dimensions(actual);
    const canvas =
      row.view === "x_both" ? [30, 60, 30, 60] : [170, 60, 170, 60];
    const sourcePercent = source.map((x, i) => (100 * x) / canvas[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / canvas[i]!);
    return {
      ...row,
      reference,
      source,
      model,
      sourcePercent,
      modelPercent,
      delta: modelPercent.map((x, i) => x - sourcePercent[i]!),
    };
  });
}
