// Spanish electric and diesel locomotives on the box locomotive kit (stated
// with worldLocoKit.ts): the 354 "Virgen" that hauled the Talgo, the 252,
// the 269 "Japonesa", the 277 "Inglesa", the 319 and the 333.
// See docs/models/spain-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";
import { ES252_PARAMS, renfe252, renfe252Lod } from "./es252.ts";
import { renfe354, renfe354Lod } from "./es354.ts";
import { ES269_PARAMS, renfe269, renfe269Lod } from "./es269.ts";
import { ES319_PARAMS, renfe319, renfe319Lod } from "./es319.ts";

type Body = Omit<WorldLoco, "palette" | "side" | "number">;
const GREY = c("#5a5d60", 0.6);
const pair = (pivot: number, base: number, r: number, axles: 2 | 3) => [[-pivot, axles === 3 ? [-base, 0, base] : [-base, base], r], [pivot, axles === 3 ? [-base, 0, base] : [-base, base], r]] as const;
/** Paint bands over a body: [top, colour] pairs from the sill up. */
const bands = (body: Body, number: string, ...list: Array<[number, string]>): WorldLoco => {
  const palette: WorldLoco["palette"] = { grey: GREY };
  const side: Array<[number, number, string]> = [[1.0, body.y0 + 0.3, "grey"]];
  let y = body.y0 + 0.3;
  list.forEach(([top, colour], i) => { palette[`p${i}`] = c(colour); side.push([y, top, `p${i}`]); y = top; });
  return { ...body, palette, side, number };
};

const R277: Body = { length: 20.68, W: 1.5, y0: 1.35, roof: 3.95, nose: "raked", bogies: pair(5.5, 1.75, 0.6, 3), pantograph: "diamond", pantographX: 5.3, room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
const R333: Body = { length: 20.7, W: 1.5, y0: 1.35, roof: 3.95, nose: "raked", bogies: pair(5.5, 1.6, 0.5, 3), exhausts: [0.5], room: { kind: "grilles", n: 5, y: [2.6, 3.3] } };

const L: Record<string, Liveries> = {
  r277: { green: { title: "Renfe green", loco: bands(R277, "7701", [4.3, "#2f5e3a"]) }, blue: { title: "Renfe blue", loco: bands(R277, "277 015", [2.2, "#1d3f80"], [2.3, "#f2c31a"], [4.3, "#1d3f80"]) } },
  r333: { mercancias: { title: "Renfe Mercancias", loco: bands(R333, "333 301", [2.3, "#6c2a7a"], [4.3, "#c3c7ca"]) }, talgo: { title: "Talgo", loco: bands(R333, "333 407", [2.3, "#c8102e"], [2.4, "#c3c7ca"], [4.3, "#c3c7ca"]) } },
};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
const b = (k: string, v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string, v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

export { renfe354, renfe354Lod };
export { renfe252, renfe252Lod };
export { renfe269, renfe269Lod };
export function renfe277(v?: ParamValues): MeshBuilder { return b("r277", v); }
export function renfe277Lod(v?: ParamValues): MeshBuilder { return lod("r277", v); }
export { renfe319, renfe319Lod };
export function renfe333(v?: ParamValues): MeshBuilder { return b("r333", v); }
export function renfe333Lod(v?: ParamValues): MeshBuilder { return lod("r333", v); }

const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, diesel = false): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog: diesel ? DIESEL_LOCO_CATALOG : ELECTRIC_LOCO_CATALOG, references: id });

export const ES_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-renfe-354", title: "Renfe 354 Virgen", build: renfe354, buildLod: renfe354Lod, game: locoGame(80, 3070, 200), catalog: DIESEL_LOCO_CATALOG, references: "renfe-354" },
  { id: "proc-vehicle-renfe-252", title: "Renfe 252", build: renfe252, buildLod: renfe252Lod, params: ES252_PARAMS, game: locoGame(90, 5600, 220), catalog: ELECTRIC_LOCO_CATALOG, references: "renfe-252" },
  { id: "proc-vehicle-renfe-269", title: "Renfe 269", build: renfe269, buildLod: renfe269Lod, params: ES269_PARAMS, game: locoGame(88, 3100, 140), catalog: ELECTRIC_LOCO_CATALOG, references: "renfe-269" },
  d("renfe-277", "Renfe 277", "r277", renfe277, renfe277Lod, 120, 2700, 110),
  { id: "proc-vehicle-renfe-319", title: "Renfe 319", build: renfe319, buildLod: renfe319Lod, params: ES319_PARAMS, game: locoGame(116, 1500, 120), catalog: DIESEL_LOCO_CATALOG, references: "renfe-319" },
  d("renfe-333", "Renfe 333", "r333", renfe333, renfe333Lod, 120, 2300, 160, true),
];
