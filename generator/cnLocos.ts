// Chinese locomotives: the HXN5 on the hood unit kit (the GE Evolution, on the
// ES44AC's body, usDiesels.ts); the HXD1, HXD3D, SS1 and SS8 electrics and the
// DF4 and DF11 diesels on the box locomotive kit (worldLocoKit.ts), whose
// buffers stand in for their automatic couplers (a deviation).
// See docs/models/china-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { paint } from "./dieselParts.ts";
import { buildUsHood, usHoodLod, type UsLivery } from "./usHoodKit.ts";
import { ES44_SPEC } from "./usDiesels.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

const HXN5_LIVERY: Record<string, UsLivery> = {
  orange: {
    title: "CR orange", railroad: "", letterH: 0.3, letterY: 1.0, number: "HXN5 0001",
    palette: { cnOrange: paint("#e8701e"), cnWhite: paint("#efefea"), cnGrey: paint("#8f9396", 0.6) },
    body: [[0, 2.6, "cnOrange"], [2.6, 2.85, "cnWhite"], [2.85, 9, "cnOrange"]], roof: "cnGrey", frame: "cnOrange", sillStripe: [0.04, 0.12, "cnWhite"],
    trucks: "underframe", pilot: "cnOrange", letter: "cnWhite", numberMat: "cnWhite", rails: "cnWhite",
  },
};
const HXN5_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { orange: "CR orange" })];
export function crHxn5(v?: ParamValues): MeshBuilder { return buildUsHood(ES44_SPEC, HXN5_LIVERY[resolveParams(HXN5_PARAMS, v).livery!]!); }
export function crHxn5Lod(v?: ParamValues): MeshBuilder { return usHoodLod(ES44_SPEC, HXN5_LIVERY[resolveParams(HXN5_PARAMS, v).livery!]!); }

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

const HXD1: Body = { length: 35.2, W: 1.5, y0: 1.35, roof: 4.0, nose: "raked", bogies: [[-12.6, [-1.35, 1.35], 0.625], [-5.0, [-1.35, 1.35], 0.625], [5.0, [-1.35, 1.35], 0.625], [12.6, [-1.35, 1.35], 0.625]], pantograph: "singleArm", pantographX: 13.6, room: { kind: "windows", n: 6, y: [2.7, 3.3] } };
const HXD3D: Body = { length: 20.85, W: 1.5, y0: 1.35, roof: 4.0, nose: "raked", bogies: coCo(5.6, 1.9, 0.625), pantograph: "singleArm", pantographX: 6.0, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
const SS1: Body = { length: 20.4, W: 1.5, y0: 1.35, roof: 4.0, nose: "flat", bogies: coCo(5.4, 1.75, 0.625), pantograph: "diamond", pantographX: 5.6, room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
const SS8: Body = { length: 17.5, W: 1.5, y0: 1.35, roof: 4.0, nose: "streamlined", bogies: [[-4.5, [-1.45, 1.45], 0.625], [4.5, [-1.45, 1.45], 0.625]], pantograph: "singleArm", pantographX: 4.6, room: { kind: "grilles", n: 4, y: [2.6, 3.4] } };
const DF4: Body = { length: 20.5, W: 1.5, y0: 1.35, roof: 4.0, nose: "raked", bogies: coCo(5.5, 1.8, 0.525), exhausts: [0], room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
const DF11: Body = { length: 21.25, W: 1.5, y0: 1.35, roof: 4.0, nose: "streamlined", bogies: coCo(5.7, 1.8, 0.525), exhausts: [0.6], room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };

const L: Record<string, Liveries> = {
  hxd1: { red: { title: "CR red", loco: bands(HXD1, "HXD1 0001", [2.3, "#b5232b"], [2.45, "#e8dcc0"], [4.4, "#b5232b"]) } },
  hxd3d: { redGrey: { title: "Red and grey", loco: bands(HXD3D, "HXD3D 0001", [2.3, "#b5232b"], [2.5, "#f1f1ee"], [4.4, "#9aa0a5"]) } },
  ss1: { greenYellow: { title: "Green, yellow", loco: bands(SS1, "SS1 0001", [2.3, "#2f6b3a"], [2.45, "#f2c31a"], [4.4, "#2f6b3a"]) } },
  ss8: { redWhite: { title: "Red and white", loco: bands(SS8, "SS8 0001", [2.3, "#b5232b"], [4.4, "#f1f1ee"]) } },
  df4: { orangeWhite: { title: "Orange, white", loco: bands(DF4, "DF4 1001", [2.3, "#e8701e"], [2.5, "#f1f1ee"], [4.4, "#e8701e"]) }, green: { title: "Green", loco: bands(DF4, "DF4 0001", [2.3, "#2f6b3a"], [2.45, "#f2c31a"], [4.4, "#2f6b3a"]) } },
  df11: { redWhite: { title: "Red and white", loco: bands(DF11, "DF11 0001", [2.3, "#b5232b"], [4.4, "#f1f1ee"]) } },
};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
const b = (k: string, v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string, v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

export function crHxd1(v?: ParamValues): MeshBuilder { return b("hxd1", v); }
export function crHxd1Lod(v?: ParamValues): MeshBuilder { return lod("hxd1", v); }
export function crHxd3d(v?: ParamValues): MeshBuilder { return b("hxd3d", v); }
export function crHxd3dLod(v?: ParamValues): MeshBuilder { return lod("hxd3d", v); }
export function crSs1(v?: ParamValues): MeshBuilder { return b("ss1", v); }
export function crSs1Lod(v?: ParamValues): MeshBuilder { return lod("ss1", v); }
export function crSs8(v?: ParamValues): MeshBuilder { return b("ss8", v); }
export function crSs8Lod(v?: ParamValues): MeshBuilder { return lod("ss8", v); }
export function crDf4(v?: ParamValues): MeshBuilder { return b("df4", v); }
export function crDf4Lod(v?: ParamValues): MeshBuilder { return lod("df4", v); }
export function crDf11(v?: ParamValues): MeshBuilder { return b("df11", v); }
export function crDf11Lod(v?: ParamValues): MeshBuilder { return lod("df11", v); }

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, catalog = E): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog, references: id });

export const CN_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-cr-hxn5", title: "CR HXN5", build: crHxn5, buildLod: crHxn5Lod, game: locoGame(150, 4660, 120), catalog: D, loadingGauge: "us", references: "cr-hxn5" },
  d("cr-hxd1", "CR HXD1", "hxd1", crHxd1, crHxd1Lod, 200, 9600, 120),
  d("cr-hxd3d", "CR HXD3D", "hxd3d", crHxd3d, crHxd3dLod, 126, 7200, 160),
  d("cr-ss1", "CR SS1 Shaoshan", "ss1", crSs1, crSs1Lod, 138, 3780, 95),
  d("cr-ss8", "CR SS8 Shaoshan", "ss8", crSs8, crSs8Lod, 88, 3600, 170),
  d("cr-df4", "CR DF4 Dongfeng", "df4", crDf4, crDf4Lod, 138, 1985, 100, D),
  d("cr-df11", "CR DF11 Dongfeng", "df11", crDf11, crDf11Lod, 138, 3040, 170, D),
];
