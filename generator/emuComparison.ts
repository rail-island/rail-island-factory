// Orthographic comparison of the Czech electric units' GLB vertices with the
// native BMP landmarks in assets/<folder>/native/<key>/landmarks.json (emu471.ts,
// emu680.ts). Node only. See docs/models/czech-emus.md.
//
// Every canvas is the native BMP's, 0.1 m a pixel, measured physically: v = 10 *
// (H - y) with H the canvas height in metres, so a documented height scale (the
// 471's 4.635 m against the XML's 4.8 m) shows as a residual, not hidden by the
// mapping. Side u follows the source column of the car (`side`), ends are seen
// from outside: the front (+X) end u = 10 * (1.5 - z), the rear end u = 10 * (z + 1.5).
import fs from "node:fs";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "./sourceTree.ts";
import { EMU471_DESIGNS, elefantCentre, ELEFANT_LAYOUTS, K_Y, K_Z } from "./emu471.ts";
import type { CoachLandmark, CoachComparisonRow } from "./csdCoachComparison.ts";

export { meanAbsoluteError, bmpSize } from "./csdCoachComparison.ts";
import { bmpSize } from "./csdCoachComparison.ts";

/** One transferred vlakosimdb car with a measured comparison. */
export interface EmuTransfer {
  /** The vlakosimdb folder name, e.g. "cd_471". */
  key: string;
  title: string;
  id: string;
  params: ParamValues;
  /** assets/<folder>/ */
  folder: string;
  /** The native files, relative to assets/<folder>/. */
  native: string;
  /** The comparison table, relative to assets/<folder>/. */
  report: string;
  /** Factory X to the side canvas's column (native pixels). */
  side: (x: number) => number;
  /** The side canvas's mapping, as the report states it. */
  sideRule: string;
  /** The documented scales from source to model: heights (y) and widths (z). */
  kY: number;
  kZ: number;
}

const elefant = ELEFANT_LAYOUTS.motorCar;
const elefantC = elefantCentre(elefant);

export const EMU_TRANSFERS: readonly EmuTransfer[] = [
  {
    key: "cd_471",
    title: "CD 471 motor car",
    id: "veh-cd-471",
    params: { unit: "motorCar", variant: "cd471" },
    folder: "cd-471",
    native: "native/cd_471",
    report: "COMPARISON.md",
    // the BMP's cab is at column 0: u = 10 * (25.1 - body metres), body metres = X + centre
    side: (x) => 10 * (25.1 - (x + elefantC)),
    sideRule: `u = 10 * (25.1 - (Factory X + ${elefantC.toFixed(3)})): the BMP has the cab at column 0, the model at +X`,
    kY: K_Y,
    kZ: K_Z,
  },
];

const DESIGNS: readonly ProceduralDesign[] = [...EMU471_DESIGNS];

export function emuTransfer(key: string): EmuTransfer {
  const t = EMU_TRANSFERS.find((x) => x.key === key);
  if (!t) throw new Error(`no EMU transfer ${key}`);
  return t;
}

export function emuBuild(t: EmuTransfer) {
  return DESIGNS.find((d) => d.id === t.id)!.build(t.params);
}

const ROOT = new URL("../", import.meta.url);

export function emuNativeFile(t: EmuTransfer, name: string): URL {
  return new URL(`assets/${t.folder}/${t.native}/${name}`, ROOT);
}

export function readEmuLandmarks(t: EmuTransfer): CoachLandmark[] {
  return (JSON.parse(fs.readFileSync(emuNativeFile(t, "landmarks.json"), "utf8")) as { annotations: CoachLandmark[] }).annotations;
}

/**
 * The comparison rows of one transferred car, on the physical canvas, or with
 * `unscaled` the documented height and width scales undone (y / kY, z / kZ).
 */
export function emuComparison(key: string, unscaled = false): CoachComparisonRow[] {
  const t = emuTransfer(key);
  const mesh = emuBuild(t);
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
    if (!sizes.has(view)) sizes.set(view, bmpSize(emuNativeFile(t, `${view}.bmp`)));
    return sizes.get(view)!;
  };
  return readEmuLandmarks(t).map((row) => {
    const nodes = leaves.filter((n) => row.nodes.some((id) => n.id === id || n.id.startsWith(id + "/")));
    if (!nodes.length) throw new Error(`${key}: missing landmark ${row.id}: ${row.nodes.join(", ")}`);
    const points = nodes.flatMap((n) => byMaterial.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((x) => x.p);
    const canvas = size(row.view);
    const H = canvas[1] / 10;
    const [ky, kz] = unscaled ? [t.kY, t.kZ] : [1, 1];
    const u = points.map((p) => (row.end ? (row.end === "rear" ? 10 * (p[2] / kz + 1.5) : 10 * (1.5 - p[2] / kz)) : t.side(p[0])));
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
