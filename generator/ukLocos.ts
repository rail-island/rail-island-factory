// British diesel and electric locomotives on the box locomotive kit (stated
// with worldLocoKit.ts), at their real size on the W6a gauge: the Class 55
// Deltic and the Class 37 with their bonnet noses, the Class 47, the Class 66
// and the Class 86. See docs/models/uk-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
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
const C37: Body = { length: 18.75, W: 1.36, y0: 1.2, roof: 3.76, nose: "bonnets", bonnet: 1.8, hoodTop: 2.8, bogies: coCo(4.9, 1.75, 0.55), exhausts: [0], room: { kind: "grilles", n: 4, y: [2.4, 3.2] } };
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

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
const b = (k: string, v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string, v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

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
