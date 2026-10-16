// The measured comparison of the steam locomotives and tenders with their
// vlakosimdb side views (steamLocos.ts): native pixel boxes on z_both.bmp in
// assets/<folder>/native/<key>/landmarks.json against the orthographic side
// extents of the named source-tree scopes at rest. Node only.
//
// Canvas: u = 10 * source x = 10 * (xc - X), v = 10 * (H - y), H the canvas
// height in metres, origin top left; percentages of the canvas as in the
// coaches' comparison (csdCoachComparison.ts).

import fs from "node:fs";
import type { ParamValues } from "./design.ts";
import { STEAM_DESIGNS } from "./steamLocos.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { bmpSize } from "./csdCoachComparison.ts";

/** One transferred vlakosimdb vehicle. */
export interface SteamTransfer {
  /** The vlakosimdb folder name, "#" written "_". */
  key: string;
  title: string;
  id: string;
  params?: ParamValues;
  folder: string;
  /** Source x of the model's x = 0: midway between the buffer heads. */
  centre: number;
  /** The side view's file name in the native folder. */
  view: string;
}

const t = (key: string, title: string, id: string, folder: string, heads: [number, number], params?: ParamValues, view = "z_both"): SteamTransfer => ({
  key, title, id, folder, centre: (heads[0] + heads[1]) / 2, view, ...(params ? { params } : {}),
});

export const STEAM_TRANSFERS: readonly SteamTransfer[] = [
  t("csd_433_0", "CSD 433.0", "proc-vehicle-csd-433-0", "steam-433-0", [0, 12.06], { livery: "black" }),
  t("csd_433_0_2", "CSD 433.0#2", "proc-vehicle-csd-433-0", "steam-433-0", [0, 12.06], { livery: "redLining" }),
  t("csd_456_0", "CSD 456.0", "proc-vehicle-csd-456-0", "steam-456-0", [0, 14.95]),
  t("csd_475_179_l", "CSD 475.179 L", "proc-vehicle-csd-475-1", "steam-475-1", [0, 13.0], { unit: "locomotive" }),
  t("csd_475_179_t", "CSD 475.179 T", "proc-vehicle-csd-475-1", "steam-475-1", [-0.3, 7.12], { unit: "tender" }),
  t("csd_477_0", "CSD 477.0", "proc-vehicle-csd-477-0", "steam-477-0", [0.05, 16.92], undefined, "steam1_z_both"),
  t("csd_498_1", "CSD 498.1", "proc-vehicle-csd-498-1", "steam-498-1", [0.05, 18.1], { unit: "locomotive" }),
  t("csd_498_1_t", "CSD 498.1 T", "proc-vehicle-csd-498-1", "steam-498-1", [-0.3, 8.62], { unit: "tender" }),
  t("csd_556_0", "CSD 556.0", "proc-vehicle-csd-556-0", "steam-556-0", [0, 14.95], { unit: "locomotive" }),
  t("csd_556_0_t", "CSD 556.0 T", "proc-vehicle-csd-556-0", "steam-556-0", [-0.2, 8.22], { unit: "tender" }),
  t("csd_636", "CSD 636 Mallet", "proc-vehicle-csd-636", "steam-636", [0, 15.1], { unit: "locomotive" }),
  t("csd_636tend", "CSD 636 Tender", "proc-vehicle-csd-636", "steam-636", [-0.3, 7.8], { unit: "tender" }),
  t("csd_386", "CSD 386", "proc-vehicle-csd-386", "steam-386", [0.1, 15.1], { unit: "locomotive" }),
  t("csd_386tend", "CSD 386 Tender", "proc-vehicle-csd-386", "steam-386", [-0.3, 8.3], { unit: "tender" }),
  t("csd_m112", "CSD M112", "proc-vehicle-csd-m112", "steam-m112", [0, 8.4]),
];

export interface SteamLandmark {
  id: string;
  element: string;
  /** Native pixel edges [left, top, right, bottom] on the side view. */
  box: number[];
  /** Source-tree ids whose leaves (and descendants) make up the element. */
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface SteamComparisonRow extends SteamLandmark {
  canvas: [number, number];
  source: number[];
  model: number[];
  sourcePercent: number[];
  modelPercent: number[];
  delta: number[];
}

const ROOT = new URL("../", import.meta.url);

export function steamTransfer(key: string): SteamTransfer {
  const found = STEAM_TRANSFERS.find((x) => x.key === key);
  if (!found) throw new Error(`no steam transfer ${key}`);
  return found;
}

/** A file in a transfer's native folder. */
export function steamNativeFile(tr: SteamTransfer, name: string): URL {
  return new URL(`assets/${tr.folder}/native/${tr.key}/${name}`, ROOT);
}

export function readSteamLandmarks(key: string): SteamLandmark[] {
  return (JSON.parse(fs.readFileSync(steamNativeFile(steamTransfer(key), "landmarks.json"), "utf8")) as { annotations: SteamLandmark[] }).annotations;
}

/** The comparison rows of one transfer. */
export function steamComparison(key: string): SteamComparisonRow[] {
  const tr = steamTransfer(key);
  const design = STEAM_DESIGNS.find((d) => d.id === tr.id)!;
  const tree = design.build(tr.params).sourceTree(tr.id, tr.title);
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(tree.root);
  const canvas = bmpSize(steamNativeFile(tr, `${tr.view}.bmp`));
  const H = canvas[1] / 10;
  return readSteamLandmarks(key).map((row) => {
    const nodes = leaves.filter((n) => n.triangles > 0 && row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${key}: landmark ${row.id} matches no geometry (${row.nodes.join(", ")})`);
    const u0 = Math.min(...nodes.map((n) => 10 * (tr.centre - n.max![0])));
    const u1 = Math.max(...nodes.map((n) => 10 * (tr.centre - n.min![0])));
    const v0 = Math.min(...nodes.map((n) => 10 * (H - n.max![1])));
    const v1 = Math.max(...nodes.map((n) => 10 * (H - n.min![1])));
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const source = dims(row.box);
    const model = dims([u0, v0, u1, v1]);
    const scale = [canvas[0], canvas[1], canvas[0], canvas[1]];
    const sourcePercent = source.map((x, i) => (100 * x) / scale[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / scale[i]!);
    return { ...row, canvas, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** The largest edge difference of a row in native pixels. */
export function worstPixels(row: SteamComparisonRow): number {
  const a = [row.source[0]!, row.source[1]!, row.source[0]! + row.source[2]!, row.source[1]! + row.source[3]!];
  const b = [row.model[0]!, row.model[1]!, row.model[0]! + row.model[2]!, row.model[1]! + row.model[3]!];
  return Math.max(...a.map((x, i) => Math.abs(x - b[i]!)));
}
