// The measured comparison of the trams and the metro car with their vlakosimdb
// drawings (trams.ts, metro.ts): native pixel boxes on the side and end BMPs in
// assets/<folder>/native/<key>/landmarks.json against the orthographic extents
// of the named source-tree scopes at rest, projected back onto the drawing's
// canvas through the design's own map (tramKit.ts). Node only.
//
// Side views (z_inc, z_dec, z_both): u = 10 * (c - X / kx), v = 10 * (H - Y / ky);
// end views (x_inc, x_dec, x_both): u = 10 * (1.5 - Z / kz), v = 10 * (H - Y / ky),
// H the canvas height in source metres. Because the map scales the drawing onto
// the published dimensions, the comparison is of proportions: a box that
// matches here sits where the drawing puts it, relative to the whole car.

import fs from "node:fs";
import type { ParamValues } from "./design.ts";
import { DESIGNS } from "./generate.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { bmpSize } from "./csdCoachComparison.ts";
import type { TramMap } from "./tramKit.ts";
import { GT4_MAP, KT4_MAP, KT8_MAP, T3_MAP, T6_MAP } from "./trams.ts";
import { METRO_MAP } from "./metro.ts";

/** One transferred vlakosimdb vehicle (the default build of its design). */
export interface TramTransfer {
  /** The vlakosimdb folder name, "#" written "_". */
  key: string;
  /** Its vlakosimdb path under db/. */
  source: string;
  title: string;
  id: string;
  params?: ParamValues;
  folder: string;
  map: TramMap;
}

export const TRAM_TRANSFERS: readonly TramTransfer[] = [
  { key: "tram_ckd_t3", source: "tram/tram_ckd_t3", title: "Tatra T3", id: "veh-tatra-t3", params: { variant: "t3" }, folder: "tatra-t3", map: T3_MAP },
  { key: "tram_ckd_t6", source: "tram/tram_ckd_t6", title: "Tatra T6A5", id: "veh-tatra-t6", folder: "tatra-t6", map: T6_MAP },
  { key: "tram_ckd_kt8", source: "tram/tram_ckd_kt8", title: "Tatra KT8D5", id: "veh-tatra-kt8", params: { livery: "redWhite" }, folder: "tatra-kt8", map: KT8_MAP },
  { key: "tram_ckd_kt4", source: "tram/tram_ckd_kt4", title: "Tatra KT4", id: "veh-tatra-kt4", folder: "tatra-kt4", map: KT4_MAP },
  { key: "tram_kvag_gt4", source: "tram/tram_kvag_gt4", title: "GT4", id: "veh-kvag-gt4", folder: "gt4", map: GT4_MAP },
  { key: "m_mmz_81-71l", source: "train/metro/mmz/m_mmz_81-71l", title: "Metro 81-71 head car", id: "veh-metro-81-71", params: { unit: "headCar" }, folder: "metro-81-71", map: METRO_MAP },
];

export type TramView = "z_inc" | "z_dec" | "z_both" | "x_inc" | "x_dec" | "x_both";

export interface TramLandmark {
  id: string;
  element: string;
  view: TramView;
  /** Native pixel edges [left, top, right, bottom] on the view's BMP. */
  box: number[];
  /** Source-tree ids whose leaves (and descendants) make up the element. */
  nodes: string[];
  tolerancePixels: number;
  uncertainty: string;
}

export interface TramComparisonRow extends TramLandmark {
  canvas: [number, number];
  source: number[];
  model: number[];
  sourcePercent: number[];
  modelPercent: number[];
  delta: number[];
}

const ROOT = new URL("../", import.meta.url);

export function tramTransfer(key: string): TramTransfer {
  const found = TRAM_TRANSFERS.find((x) => x.key === key);
  if (!found) throw new Error(`no tram transfer ${key}`);
  return found;
}

/** A file in a transfer's native folder. */
export function tramNativeFile(tr: TramTransfer, name: string): URL {
  return new URL(`assets/${tr.folder}/native/${tr.key}/${name}`, ROOT);
}

export function readTramLandmarks(key: string): TramLandmark[] {
  return (JSON.parse(fs.readFileSync(tramNativeFile(tramTransfer(key), "landmarks.json"), "utf8")) as { annotations: TramLandmark[] }).annotations;
}

/** The comparison rows of one transfer. */
export function tramComparison(key: string): TramComparisonRow[] {
  const tr = tramTransfer(key);
  const design = DESIGNS.get(tr.id)!;
  const tree = design.build(tr.params).sourceTree(tr.id, tr.title);
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(tree.root);
  const { c, kx, ky, kz } = tr.map;
  return readTramLandmarks(key).map((row) => {
    const nodes = leaves.filter((n) => n.triangles > 0 && row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${key}: landmark ${row.id} matches no geometry (${row.nodes.join(", ")})`);
    const canvas = bmpSize(tramNativeFile(tr, `${row.view}.bmp`));
    const H = canvas[1] / 10;
    const end = row.view.startsWith("x");
    const across = (p: [number, number, number]) => (end ? 10 * (1.5 - p[2] / kz) : 10 * (c - p[0] / kx));
    const us = nodes.flatMap((n) => [across(n.min!), across(n.max!)]);
    const v0 = Math.min(...nodes.map((n) => 10 * (H - n.max![1] / ky)));
    const v1 = Math.max(...nodes.map((n) => 10 * (H - n.min![1] / ky)));
    const dims = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
    const source = dims(row.box);
    const model = dims([Math.min(...us), v0, Math.max(...us), v1]);
    const scale = [canvas[0], canvas[1], canvas[0], canvas[1]];
    const sourcePercent = source.map((x, i) => (100 * x) / scale[i]!);
    const modelPercent = model.map((x, i) => (100 * x) / scale[i]!);
    return { ...row, canvas, source, model, sourcePercent, modelPercent, delta: modelPercent.map((x, i) => x - sourcePercent[i]!) };
  });
}

/** The largest edge difference of a row in native pixels. */
export function worstTramPixels(row: TramComparisonRow): number {
  const a = [row.source[0]!, row.source[1]!, row.source[0]! + row.source[2]!, row.source[1]! + row.source[3]!];
  const b = [row.model[0]!, row.model[1]!, row.model[0]! + row.model[2]!, row.model[1]! + row.model[3]!];
  return Math.max(...a.map((x, i) => Math.abs(x - b[i]!)));
}
