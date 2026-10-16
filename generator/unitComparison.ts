// Orthographic comparison of the foreign multiple units' GLB vertices with the
// native BMP landmarks in assets/<folder>/native/<key>/landmarks.json (db628.ts,
// mavMdmot.ts, ice1.ts, tgv.ts). Node only. See docs/models/foreign-units.md.
//
// The method is emuComparison.ts's: every canvas is the native BMP's, 0.1 m a
// pixel, measured physically (v = 10 * (H - y)), the side's column follows the
// car's source x (`side`), ends are seen from outside: the front (+X) end
// u = 10 * (W/20 - z), the rear end u = 10 * (z + W/20), W the end canvas's width.
import fs from "node:fs";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import type { CoachComparisonRow, CoachLandmark } from "./csdCoachComparison.ts";
import { bmpSize } from "./csdCoachComparison.ts";
import { DB628_DESIGNS, DB628_LENGTH, DB628_MAP } from "./db628.ts";
import { MDMOT_DESIGNS, MDMOT_MAPS, mdmotLength } from "./mavMdmot.ts";
import { ICE1_DESIGNS, ICE1_MAPS, ice1Length, ICE1_K_Y } from "./ice1.ts";
import { TGV_DESIGNS, TGV_MAPS, tgvLength, TGV_K_Y_POWER } from "./tgv.ts";

export { meanAbsoluteError, bmpSize } from "./csdCoachComparison.ts";

/** One transferred vlakosimdb car with a measured comparison. */
export interface UnitTransfer {
  key: string;
  title: string;
  id: string;
  params: ParamValues;
  folder: string;
  native: string;
  report: string;
  /** Factory X to the side canvas's column (native pixels), physically. */
  side: (x: number) => number;
  /** The same with the documented length scale undone. */
  sideUnscaled: (x: number) => number;
  sideRule: string;
  kX: number;
  kY: number;
  kZ: number;
  files: string;
}

/** A side mapping from a body map: column u = 10 * (x0 - (X + length / 2) / k). */
function sideFns(x0: number, length: number, k = 1): Pick<UnitTransfer, "side" | "sideUnscaled" | "sideRule"> {
  return {
    side: (x) => 10 * (x0 * k - (x + length / 2)),
    sideUnscaled: (x) => 10 * (x0 - (x + length / 2) / k),
    sideRule: `u = 10 * (${x0.toFixed(2)} - (Factory X + ${(length / 2).toFixed(3)})${k === 1 ? "" : ` / ${k.toFixed(4)}`}): the BMP's cab at its left, the model's at +X`,
  };
}

const db = { ...sideFns(DB628_MAP.x0, DB628_LENGTH) };
const md = MDMOT_MAPS.motorCar;
const ice = ICE1_MAPS.powerCar;
const tgv = TGV_MAPS.powerCar;

export const UNIT_TRANSFERS: readonly UnitTransfer[] = [
  { key: "db_628", title: "DB 628 motor car", id: "veh-db-628", params: { livery: "mint" }, folder: "db-628", native: "native/db_628", report: "COMPARISON.md", ...db, kX: 1, kY: 1, kZ: 1, files: "`generator/db628.ts`" },
  { key: "mav_mdmot", title: "MAV MDmot motor car", id: "veh-mav-mdmot", params: { unit: "motorCar" }, folder: "mav-mdmot", native: "native/mav_mdmot", report: "COMPARISON.md", ...sideFns(md.x0, mdmotLength("motorCar")), kX: 1, kY: 1, kZ: 1, files: "`generator/mavMdmot.ts`" },
  { key: "ice_loco", title: "ICE 1 power car", id: "veh-ice-1", params: { unit: "powerCar" }, folder: "ice-1", native: "native/ice_loco", report: "COMPARISON.md", ...sideFns(ice.x0, ice1Length("powerCar")), kX: 1, kY: ICE1_K_Y, kZ: 1, files: "`generator/ice1.ts`" },
  { key: "tgv_loco", title: "TGV PSE power car", id: "veh-tgv", params: { unit: "powerCar", livery: "pse" }, folder: "tgv", native: "native/tgv_loco", report: "COMPARISON.md", ...sideFns(tgv.x0, tgvLength("powerCar")), kX: 1, kY: TGV_K_Y_POWER, kZ: 1, files: "`generator/tgv.ts`" },
];

const DESIGNS: readonly ProceduralDesign[] = [...DB628_DESIGNS, ...MDMOT_DESIGNS, ...ICE1_DESIGNS, ...TGV_DESIGNS];

export function unitTransfer(key: string): UnitTransfer {
  const t = UNIT_TRANSFERS.find((x) => x.key === key);
  if (!t) throw new Error(`no unit transfer ${key}`);
  return t;
}

export function unitBuild(t: UnitTransfer) {
  return DESIGNS.find((d) => d.id === t.id)!.build(t.params);
}

const ROOT = new URL("../", import.meta.url);

export function unitNativeFile(t: UnitTransfer, name: string): URL {
  return new URL(`assets/${t.folder}/${t.native}/${name}`, ROOT);
}

export function readUnitLandmarks(t: UnitTransfer): CoachLandmark[] {
  return (JSON.parse(fs.readFileSync(unitNativeFile(t, "landmarks.json"), "utf8")) as { annotations: CoachLandmark[] }).annotations;
}

/** The comparison rows of one car, on the physical canvas, or with `unscaled` the documented scales undone. */
export function unitComparison(key: string, unscaled = false): CoachComparisonRow[] {
  const t = unitTransfer(key);
  const mesh = unitBuild(t);
  const leaves: LeafNode[] = [];
  const walk = (n: TreeNode): void => {
    if (isLeaf(n)) leaves.push(n);
    else n.children.forEach(walk);
  };
  walk(mesh.sourceTree(t.id, t.title).root);
  const { json, bin } = parseGlb(mesh.toGlb(`${t.title} comparison`));
  const tris = collectTriangles(json, bin);
  const byMaterial = new Map<string, typeof tris>();
  for (const tri of tris) {
    let list = byMaterial.get(tri.material);
    if (!list) byMaterial.set(tri.material, (list = []));
    list.push(tri);
  }
  const sizes = new Map<string, [number, number]>();
  const size = (view: string) => {
    if (!sizes.has(view)) sizes.set(view, bmpSize(unitNativeFile(t, `${view}.bmp`)));
    return sizes.get(view)!;
  };
  return readUnitLandmarks(t).map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${key}: missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((x) => x.p);
    const canvas = size(row.view);
    const H = canvas[1] / 10;
    const half = canvas[0] / 20;
    const [ky, kz] = unscaled ? [t.kY, t.kZ] : [1, 1];
    const u = points.map((p) => (row.end ? (row.end === "rear" ? 10 * (p[2] / kz + half) : 10 * (half - p[2] / kz)) : unscaled ? t.sideUnscaled(p[0]) : t.side(p[0])));
    const v = points.map((p) => 10 * (H - p[1] / ky));
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
