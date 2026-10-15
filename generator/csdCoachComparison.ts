// Orthographic comparison of the CSD coaches' GLB vertices with the native BMP
// landmarks in assets/csd-<name>/native/landmarks.json (csdCoaches.ts). Node only.
//
// Side canvases: u = 10 * (source x) = 10 * (X + centre), v = 10 * (H - y), the
// same orientation on both sides (the -z elevation is mirrored relative to an
// outside observer, as the BMP is). End canvases are seen from outside: the rear
// (-X) end u = 10 * (z + 1.5), the front (+X) end u = 10 * (1.5 - z).
import fs from "node:fs";
import { COACH_TRANSFERS, transferBuild, type CoachTransfer } from "./coachTransfers.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";

export interface CoachLandmark {
  id: string;
  view: string;
  side?: "right" | "left";
  end?: "front" | "rear";
  element: string;
  box: number[];
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface CoachComparisonRow extends CoachLandmark {
  canvas: [number, number];
  source: number[];
  model: number[];
  sourcePercent: number[];
  modelPercent: number[];
  delta: number[];
}

const ROOT = new URL("../", import.meta.url);

/** A BMP's width and height in pixels, from its header. */
export function bmpSize(file: URL): [number, number] {
  const b = fs.readFileSync(file);
  return [b.readInt32LE(18), Math.abs(b.readInt32LE(22))];
}

/** A transfer by its vlakosimdb key ("csd_a"). */
export function transfer(key: string): CoachTransfer {
  const t = COACH_TRANSFERS.find((c) => c.key === key);
  if (!t) throw new Error(`no coach transfer ${key}`);
  return t;
}

/** A file of a transfer's native folder, e.g. "landmarks.json". */
export function nativeFile(t: CoachTransfer, name: string): URL {
  return new URL(`assets/${t.folder}/${t.native}/${name}`, ROOT);
}

export function readLandmarks(key: string): CoachLandmark[] {
  return (JSON.parse(fs.readFileSync(nativeFile(transfer(key), "landmarks.json"), "utf8")) as { annotations: CoachLandmark[] }).annotations;
}

/** The comparison rows of one transferred vehicle (its vlakosimdb key, e.g. "csd_a"). */
export function coachComparison(key: string): CoachComparisonRow[] {
  const coach = transfer(key);
  const folder = key;
  const mesh = transferBuild(coach);
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(mesh.sourceTree(coach.id, coach.title).root);
  const { json, bin } = parseGlb(mesh.toGlb(`${coach.title} comparison`));
  const tris = collectTriangles(json, bin);
  const byMaterial = new Map<string, typeof tris>();
  for (const t of tris) {
    let list = byMaterial.get(t.material);
    if (!list) byMaterial.set(t.material, (list = []));
    list.push(t);
  }
  const sizes = new Map<string, [number, number]>();
  const size = (view: string) => {
    if (!sizes.has(view)) sizes.set(view, bmpSize(nativeFile(coach, `${view}.bmp`)));
    return sizes.get(view)!;
  };
  return readLandmarks(key).map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${folder}: missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((t) => t.p);
    const canvas = size(row.view);
    const H = canvas[1] / 10;
    const u = points.map((p) => (row.end ? (row.end === "rear" ? 10 * (p[2] + 1.5) : 10 * (1.5 - p[2])) : 10 * (p[0] + coach.centre)));
    const v = points.map((p) => 10 * (H - p[1]));
    const box = [Math.min(...u), Math.min(...v), Math.max(...u), Math.max(...v)];
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const source = dims(row.box);
    const model = dims(box);
    const scale = [canvas[0], canvas[1], canvas[0], canvas[1]];
    const sourcePercent = source.map((x, i) => (100 * x) / scale[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / scale[i]!);
    return { ...row, canvas, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** Mean absolute error in percentage points over (left, top, width, height) of `rows`. */
export function meanAbsoluteError(rows: Array<{ delta: number[] }>): number {
  return rows.reduce((s, r) => s + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, rows.length));
}
