// Chinese locomotives: the registry of the HXN5, the HXD1, HXD3D, SS1 and SS8
// electrics and the DF4 and DF11 diesels. Each is measured from photographs in
// its own module (cnHxn5.ts, cnHxd1.ts, cnHxd3d.ts, cnSs1.ts, cnSs8.ts, cnDf4.ts,
// cnDf11.ts), with knuckle couplers. The HXD3D keeps its `livery` parameter
// from the box locomotive kit's livery table here. See docs/models/china-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { buildHxn5, buildHxn5Lod, HXN5_LIVERIES } from "./cnHxn5.ts";
import { buildSs8, buildSs8Lod } from "./cnSs8.ts";
import { buildDf4, buildDf4Lod, DF4_LIVERIES } from "./cnDf4.ts";
import { liveryParams, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";
import { crHxd1, crHxd1Lod } from "./cnHxd1.ts";
import { crHxd3dBody, crHxd3dBodyLod } from "./cnHxd3d.ts";
import { crSs1, crSs1Lod } from "./cnSs1.ts";
import { buildDf11, buildDf11Lod } from "./cnDf11.ts";
import { crHxd2, crHxd2Lod } from "./cnHxd2.ts";

const HXN5_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { orange: "CR green" })];
export function crHxn5(v?: ParamValues): MeshBuilder { return buildHxn5(HXN5_LIVERIES[resolveParams(HXN5_PARAMS, v).livery!]!); }
export function crHxn5Lod(v?: ParamValues): MeshBuilder { return buildHxn5Lod(HXN5_LIVERIES[resolveParams(HXN5_PARAMS, v).livery!]!); }

type Body = Omit<WorldLoco, "palette" | "side" | "number">;
const GREY = c("#5a5d60", 0.6);
const coCo = (pivot: number, base: number, r: number) => [[-pivot, [-base, 0, base], r], [pivot, [-base, 0, base], r]] as const;
const bands = (body: Body, number: string, ...list: Array<[number, string]>): WorldLoco => {
  const palette: WorldLoco["palette"] = { grey: GREY };
  const side: Array<[number, number, string]> = [[1.0, body.y0 + 0.3, "grey"]];
  let y = body.y0 + 0.3;
  list.forEach(([top, colour], i) => { palette[`p${i}`] = c(colour); side.push([y, top, `p${i}`]); y = top; });
  return { ...body, palette, side, number };
};

const HXD3D: Body = { length: 20.85, W: 1.5, y0: 1.35, roof: 4.0, nose: "raked", bogies: coCo(5.6, 1.9, 0.625), pantograph: "singleArm", pantographX: 6.0, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };

const DF4_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(DF4_LIVERIES).map(([k, l]) => [k, l.title])))];

const L: Record<string, Liveries> = {
  hxd3d: { redGrey: { title: "Red and grey", loco: bands(HXD3D, "HXD3D 0001", [2.3, "#b5232b"], [2.5, "#f1f1ee"], [4.4, "#9aa0a5"]) } },

};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));

export { crHxd1, crHxd1Lod };
export function crHxd3d(_v?: ParamValues): MeshBuilder { return crHxd3dBody(); }
export function crHxd3dLod(_v?: ParamValues): MeshBuilder { return crHxd3dBodyLod(); }
export { crSs1, crSs1Lod };
// its own profile tables and livery (cnSs8.ts), no livery parameter
export function crSs8(): MeshBuilder { return buildSs8(); }
export function crSs8Lod(): MeshBuilder { return buildSs8Lod(); }
export function crDf4(v?: ParamValues): MeshBuilder { return buildDf4(DF4_LIVERIES[resolveParams(DF4_PARAMS, v).livery!]!); }
export function crDf4Lod(v?: ParamValues): MeshBuilder { return buildDf4Lod(DF4_LIVERIES[resolveParams(DF4_PARAMS, v).livery!]!); }
// the DF11's own measured body (cnDf11.ts), in its one livery, blue and cream (no parameter)
export function crDf11(): MeshBuilder { return buildDf11(); }
export function crDf11Lod(): MeshBuilder { return buildDf11Lod(); }
// the HXD2's own twin-section body (cnHxd2.ts), in its original blue and silver livery (no parameter)
export { crHxd2, crHxd2Lod };

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, catalog = E): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog, references: id });

export const CN_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-cr-hxn5", title: "CR HXN5", build: crHxn5, buildLod: crHxn5Lod, game: locoGame(150, 4660, 120), catalog: D, loadingGauge: "us", references: "cr-hxn5" },
  { id: "proc-vehicle-cr-hxd1", title: "CR HXD1", build: crHxd1, buildLod: crHxd1Lod, game: locoGame(200, 9600, 120), catalog: E, references: "cr-hxd1" },
  d("cr-hxd3d", "CR HXD3D", "hxd3d", crHxd3d, crHxd3dLod, 126, 7200, 160),
  { id: "proc-vehicle-cr-ss1", title: "CR SS1 Shaoshan", build: crSs1, buildLod: crSs1Lod, game: locoGame(138, 3780, 90), catalog: E, references: "cr-ss1" },
  { id: "proc-vehicle-cr-ss8", title: "CR SS8 Shaoshan", build: crSs8, buildLod: crSs8Lod, game: locoGame(88, 3600, 170), catalog: E, references: "cr-ss8" },
  { id: "proc-vehicle-cr-df4", title: "CR DF4 Dongfeng", build: crDf4, buildLod: crDf4Lod, params: DF4_PARAMS, game: locoGame(138, 2430, 100), catalog: D, loadingGauge: "us", references: "cr-df4" },
  { id: "proc-vehicle-cr-df11", title: "CR DF11 Dongfeng", build: crDf11, buildLod: crDf11Lod, game: locoGame(138, 3040, 170), catalog: D, references: "cr-df11" },
  { id: "proc-vehicle-cr-hxd2", title: "CR HXD2", build: crHxd2, buildLod: crHxd2Lod, game: locoGame(200, 10000, 120), catalog: E, references: "cr-hxd2" },
];
