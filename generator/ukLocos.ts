// British diesel and electric locomotives on the box locomotive kit (stated
// with worldLocoKit.ts), at their real size on the W6a gauge: the Class 55
// Deltic and the Class 37 with their bonnet noses, the Class 47, the Class 66
// and the Class 86. See docs/models/uk-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type RoofBox, type SideItem, type Table } from "./boxLocoKit.ts";
import { c, lerpTable } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

type Body = Omit<WorldLoco, "palette" | "side" | "number">;
const GREY = c("#5a5d60", 0.6);
const coCo = (pivot: number, base: number, r: number) => [[-pivot, [-base, 0, base], r], [pivot, [-base, 0, base], r]] as const;
/** Paint bands over a body: [top, colour] pairs from the sill up. */
const bands = (body: Body, number: string, ...list: Array<[number, string]>): WorldLoco => {
  const palette: WorldLoco["palette"] = { grey: GREY };
  const side: Array<[number, number, string]> = [[1.0, body.y0 + 0.25, "grey"]];
  let y = body.y0 + 0.25;
  list.forEach(([top, colour], i) => { palette[`p${i}`] = c(colour); side.push([y, top, `p${i}`]); y = top; });
  return { ...body, palette, side, number };
};
const GREEN = "#1f4d2e", LIGHT_GREEN = "#8fb48a", BR_BLUE = "#1d3f80";

const C55: Body = { length: 21.18, W: 1.36, y0: 1.2, roof: 3.76, nose: "bonnets", bonnet: 1.5, hoodTop: 2.75, bogies: coCo(5.5, 1.7, 0.55), exhausts: [-3.0, 3.0], room: { kind: "grilles", n: 5, y: [2.4, 3.2] } };
const C37: Body = { length: 18.75, W: 1.36, y0: 1.2, roof: 3.76, nose: "bonnets", bonnet: 2.05, hoodTop: 2.8, bogies: coCo(4.9, 1.75, 0.55), exhausts: [0], room: { kind: "grilles", n: 4, y: [2.4, 3.2] } };
const C47: Body = { length: 19.38, W: 1.36, y0: 1.2, roof: 3.76, nose: "raked", bogies: coCo(5.25, 1.75, 0.57), exhausts: [-1.0], room: { kind: "grilles", n: 5, y: [2.4, 3.2] } };
const C66: Body = { length: 21.35, W: 1.36, y0: 1.2, roof: 3.76, nose: "raked", bogies: coCo(5.6, 1.8, 0.53), exhausts: [-1.2], room: { kind: "grilles", n: 5, y: [2.4, 3.2] } };
const C86: Body = { length: 17.83, W: 1.36, y0: 1.25, roof: 3.85, nose: "flat", bogies: [[-4.6, [-1.45, 1.45], 0.58], [4.6, [-1.45, 1.45], 0.58]], pantograph: "singleArm", pantographX: 4.3, room: { kind: "grilles", n: 4, y: [2.4, 3.2] } };

const L: Record<string, Liveries> = {
  c55: { twoToneGreen: { title: "Two-tone green", loco: bands(C55, "D9000", [1.75, LIGHT_GREEN], [4.2, GREEN]) }, brBlue: { title: "BR blue", loco: bands(C55, "55 022", [4.2, BR_BLUE]) } },
  c37: { green: { title: "BR green", loco: bands(C37, "D6700", [4.2, GREEN]) }, brBlue: { title: "BR blue", loco: bands(C37, "37 025", [4.2, BR_BLUE]) }, railfreight: { title: "Railfreight", loco: bands(C37, "37 401", [1.75, "#3a3d40"], [4.2, "#9aa0a5"]) } },
  c47: { twoToneGreen: { title: "Two-tone green", loco: bands(C47, "D1500", [1.75, LIGHT_GREEN], [4.2, GREEN]) }, brBlue: { title: "BR blue", loco: bands(C47, "47 401", [4.2, BR_BLUE]) }, intercity: { title: "InterCity", loco: bands(C47, "47 828", [1.75, "#3a3d40"], [1.85, "#c8102e"], [2.7, "#f1f1ee"], [4.2, "#3a3d40"]) } },
  c66: { ews: { title: "EWS", loco: bands(C66, "66 001", [2.2, "#7a1f2e"], [2.3, "#e6b422"], [4.2, "#7a1f2e"]) }, freightliner: { title: "Freightliner", loco: bands(C66, "66 501", [2.0, "#0b5d3a"], [4.2, "#f2c31a"]) }, gbrf: { title: "GBRf", loco: bands(C66, "66 701", [2.0, "#1d3f80"], [4.2, "#e8701e"]) } },
  c86: { brBlue: { title: "BR blue", loco: bands(C86, "86 101", [4.2, BR_BLUE]) }, intercity: { title: "InterCity", loco: bands(C86, "86 229", [1.75, "#3a3d40"], [1.85, "#c8102e"], [2.7, "#f1f1ee"], [4.2, "#3a3d40"]) } },
};

/**
 * The three cab fronts drawn apart (the kit's bonnet and raked ends are one shape
 * each): the Deltic's short nose sloping down to a rounded front, a headcode box
 * on its brow and the windscreen leaning well back; the Class 37's long square
 * bonnet, flat on top with a rounded front edge, its centre headcode box at the
 * front and the windscreen almost upright; the Class 47's raked end with the
 * headcode panel in the cab roof's dome over the windscreen.
 */
interface Front {
  /** The end's centre line from the frame's |x| N, the shell's bottom y0 and the roof. */
  tip: (N: number, y0: number, roof: number) => Table;
  /** The end's plan below the bonnet's top (default the kit's). */
  bonnetPlan?: { top: number; plan: (w: number) => ReadonlyArray<readonly [number, number]> };
  /** Boxes on the bonnet at both ends, in the body's top colour. */
  boxes?: (N: number, body: string) => RoofBox[];
  /** End items replacing the kit's top headlight. */
  brow?: (spec: LocoSpec) => EndItem[];
}

const box = (name: string, x0: number, x1: number, w: number, y: readonly [number, number], mat: string): RoofBox[] =>
  [{ name, x: [x0, x1], w: [w, w * 0.94], y, mat }, { name: `${name} rear`, x: [-x1, -x0], w: [w, w * 0.94], y, mat }];

/** Where a bonnet's cab front stands, from the frame's |x|. */
const cabOf = (N: number, b: Body) => N - (b.bonnet ?? 1.6);

const FRONTS: Record<string, Front> = {
  c55: {
    tip: (N, y0, roof) => {
      const top = C55.hoodTop!, cab = cabOf(N, C55);
      return [[y0, N], [top - 0.3, N], [top - 0.15, N - 0.12], [top - 0.07, N - 0.3], [top + 0.17, cab + 0.05], [top + 0.19, cab], [roof - 0.15, cab - 0.38], [roof, cab - 0.62]];
    },
    bonnetPlan: { top: C55.hoodTop! + 0.18, plan: (w) => [[0, 0], [w * 0.62, 0.09], [w, 0.34]] },
    boxes: (N, body) => [...box("headcode box", N - 0.75, N - 0.3, 0.5, [2.5, 2.86], body), ...box("headcode glass", N - 0.31, N - 0.27, 0.4, [2.69, 2.82], "plate")],
  },
  c37: {
    tip: (N, y0, roof) => {
      const top = C37.hoodTop!, cab = cabOf(N, C37);
      return [[y0, N], [top - 0.2, N], [top - 0.06, N - 0.07], [top, N - 0.2], [top + 0.01, cab], [roof - 0.15, cab - 0.1], [roof, cab - 0.35]];
    },
    bonnetPlan: { top: C37.hoodTop! + 0.005, plan: (w) => [[0, 0], [w * 0.8, 0.04], [w, 0.2]] },
    boxes: (N, body) => [...box("headcode box", N - 0.62, N - 0.17, 0.55, [C37.hoodTop! - 0.05, C37.hoodTop! + 0.3], body), ...box("headcode glass", N - 0.18, N - 0.14, 0.44, [C37.hoodTop! + 0.03, C37.hoodTop! + 0.24], "plate")],
  },
  c47: {
    tip: (N, y0, roof) => [[y0, N], [y0 + (roof - y0) * 0.4, N], [roof - 0.3, N - 0.5], [roof - 0.1, N - 0.72], [roof, N - 1.0]],
    brow: (spec) => {
      const head = Math.max(...spec.endItems.filter((i) => i.kind === "window").map((i) => i.y[1]));
      return [{ kind: "paint", name: "headcode panel", z: [-0.42, 0.42], y: [head + 0.06, head + 0.27], mat: "plate", layer: 1 }];
    },
  },
};

/** The wall's end at height y: the tip less the plan's corner setback. */
const wallAt = (s: LocoSpec, y: number) => {
  const plan = s.endPlan(y, lerpTable(s.hw, y));
  return lerpTable(s.tip, y) - plan[plan.length - 1]![1];
};

/** A spec with its own cab front; the cab door and side window move back until they stay on the side wall. */
function withFront(spec: LocoSpec, f: Front | undefined): LocoSpec {
  if (!f) return spec;
  const N = spec.beam, roof = spec.hw[spec.hw.length - 1]![0];
  const kitPlan = spec.endPlan;
  const bp = f.bonnetPlan;
  const out: LocoSpec = {
    ...spec,
    tip: f.tip(N, spec.y0, roof),
    endPlan: bp ? (y, w) => (y < bp.top ? bp.plan(w) : kitPlan(y, w)) : kitPlan,
    roofItems: [...spec.roofItems, ...(f.boxes?.(N, spec.side[spec.side.length - 1]![2]) ?? [])],
    endItems: f.brow ? [...spec.endItems.filter((i) => i.name !== "top headlight"), ...f.brow(spec)] : spec.endItems,
  };
  const cab = spec.sideItems.filter((i) => i.name === "cab door" || i.name === "cab window");
  const need = Math.max(0, ...cab.map((i) => i.x[1] + 0.12 - Math.min(...[i.y[0], (i.y[0] + i.y[1]) / 2, i.y[1]].map((y) => wallAt(out, y)))));
  if (need > 0) out.sideItems = spec.sideItems.map((i): SideItem => (cab.includes(i) ? { ...i, x: [i.x[0] - need, i.x[1] - need] } : i));
  return out;
}

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
/** A UK locomotive's box-loco spec, its own cab front applied (c55, c37, c47, c66, c86). */
export const ukLocoSpec = (k: string, v?: ParamValues): LocoSpec => withFront(liverySpec(L[k]!, P[k]!, v), FRONTS[k]);
const b = (k: string, v?: ParamValues): MeshBuilder => buildBoxLoco(ukLocoSpec(k, v));
const lod = (k: string, v?: ParamValues): MeshBuilder => boxLocoLod(ukLocoSpec(k, v));

export function brClass55(v?: ParamValues): MeshBuilder { return b("c55", v); }
export function brClass55Lod(v?: ParamValues): MeshBuilder { return lod("c55", v); }
export function brClass37(v?: ParamValues): MeshBuilder { return b("c37", v); }
export function brClass37Lod(v?: ParamValues): MeshBuilder { return lod("c37", v); }
export function brClass47(v?: ParamValues): MeshBuilder { return b("c47", v); }
export function brClass47Lod(v?: ParamValues): MeshBuilder { return lod("c47", v); }
export function brClass66(v?: ParamValues): MeshBuilder { return b("c66", v); }
export function brClass66Lod(v?: ParamValues): MeshBuilder { return lod("c66", v); }
export function brClass86(v?: ParamValues): MeshBuilder { return b("c86", v); }
export function brClass86Lod(v?: ParamValues): MeshBuilder { return lod("c86", v); }

const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, electric = false): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog: electric ? ELECTRIC_LOCO_CATALOG : DIESEL_LOCO_CATALOG, loadingGauge: "uk", references: id });

export const UK_LOCOS: ProceduralDesign[] = [
  d("br-class-55", "Class 55 Deltic", "c55", brClass55, brClass55Lod, 99, 2460, 160),
  d("br-class-37", "Class 37", "c37", brClass37, brClass37Lod, 105, 1300, 145),
  d("br-class-47", "Class 47", "c47", brClass47, brClass47Lod, 117, 1925, 153),
  d("br-class-66", "Class 66", "c66", brClass66, brClass66Lod, 126, 2385, 120),
  d("br-class-86", "Class 86", "c86", brClass86, brClass86Lod, 83, 3010, 160, true),
];
