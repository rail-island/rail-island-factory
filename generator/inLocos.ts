// Indian locomotives. The road diesels on the hood unit kit (usHoodKit.ts),
// on the frames of their American relatives (usDiesels.ts): the ALCO WDM-2 on
// the GP9's body with six-wheel trucks, the EMD WDP-4D on the SD70ACe's and
// the GE WDG-4G on the ES44AC's. The electrics on the box locomotive kit
// (worldLocoKit.ts): the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and the twin
// WAG-12B on the Prima body. Broad-gauge bodies on the 3.3 m gauge ("us").
// See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { paint } from "./dieselParts.ts";
import { buildUsHood, usHoodLod, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";
import { ES44_SPEC, GP9_SPEC, SD40_SPEC, SD70_SPEC } from "./usDiesels.ts";
import { PRIMA_BODY, liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

// ---------------------------------------------------------------------------
// The road diesels

/** IR's schemes on a hood unit: the body, a band, the roof, by height. */
function irLivery(title: string, number: string, body: string, band: string, bandY: number): UsLivery {
  return {
    title, railroad: "", letterH: 0.3, letterY: 1.0, number,
    palette: { irBody: paint(body), irBand: paint(band), irRoof: paint("#8f9396", 0.6) },
    body: [[0, bandY, "irBody"], [bandY, bandY + 0.25, "irBand"], [bandY + 0.25, 9, "irBody"]], roof: "irRoof", frame: "irBody", sillStripe: [0.04, 0.12, "irBand"],
    trucks: "underframe", pilot: "irBody", letter: "irBand", numberMat: "irBand", rails: "irBand",
  };
}

/** The WDM-2: the ALCO's high short hood on the GP9 body, on the SD40's six-wheel trucks. */
export const WDM2_SPEC: UsHoodSpec = { ...GP9_SPEC, trucks: { ...SD40_SPEC.trucks, centre: 4.75 } };

type HoodLiveries = Record<string, UsLivery>;
const WDM2: HoodLiveries = { maroon: irLivery("Maroon, cream", "18040", "#6b1d24", "#e8dcc0", 2.4), blue: irLivery("Blue, cream", "16887", "#1d3f80", "#e8dcc0", 2.4) };
const WDP4D: HoodLiveries = { blueYellow: irLivery("Blue, yellow", "40002", "#1d3f80", "#f2c31a", 2.6) };
const WDG4G: HoodLiveries = { redGrey: irLivery("Red, grey", "49001", "#b5232b", "#c9cccd", 2.6) };

const hoodParams = (l: HoodLiveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
const H = { wdm2: hoodParams(WDM2), wdp4d: hoodParams(WDP4D), wdg4g: hoodParams(WDG4G) };
const hood = (l: HoodLiveries, p: ParamSpec[], v?: ParamValues) => l[resolveParams(p, v).livery!]!;

export function irWdm2(v?: ParamValues): MeshBuilder { return buildUsHood(WDM2_SPEC, hood(WDM2, H.wdm2, v)); }
export function irWdm2Lod(v?: ParamValues): MeshBuilder { return usHoodLod(WDM2_SPEC, hood(WDM2, H.wdm2, v)); }
export function irWdp4d(v?: ParamValues): MeshBuilder { return buildUsHood(SD70_SPEC, hood(WDP4D, H.wdp4d, v)); }
export function irWdp4dLod(v?: ParamValues): MeshBuilder { return usHoodLod(SD70_SPEC, hood(WDP4D, H.wdp4d, v)); }
export function irWdg4g(v?: ParamValues): MeshBuilder { return buildUsHood(ES44_SPEC, hood(WDG4G, H.wdg4g, v)); }
export function irWdg4gLod(v?: ParamValues): MeshBuilder { return usHoodLod(ES44_SPEC, hood(WDG4G, H.wdg4g, v)); }

// ---------------------------------------------------------------------------
// The electrics

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

const WAM4: Body = { length: 18.79, W: 1.6, y0: 1.35, roof: 4.1, nose: "flat", bogies: coCo(5.3, 1.7, 0.56), pantograph: "diamond", pantographX: 5.4, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
const WAP4: Body = { length: 18.79, W: 1.6, y0: 1.35, roof: 4.1, nose: "raked", bogies: coCo(5.3, 1.7, 0.56), pantograph: "singleArm", pantographX: 5.4, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
const WAP7: Body = { length: 20.56, W: 1.6, y0: 1.35, roof: 4.15, nose: "raked", bogies: coCo(5.6, 1.85, 0.545), pantograph: "singleArm", pantographX: 6.0, room: { kind: "grilles", n: 6, y: [2.6, 3.4] } };
const WAP5: Body = { length: 18.16, W: 1.6, y0: 1.35, roof: 4.15, nose: "streamlined", bogies: [[-4.9, [-1.35, 1.35], 0.54], [4.9, [-1.35, 1.35], 0.54]], pantograph: "singleArm", pantographX: 5.0, room: { kind: "grilles", n: 4, y: [2.6, 3.4] } };
const WAG12: Body = { ...PRIMA_BODY, length: 35.0, W: 1.6, roof: 4.15, bogies: [[-12.5, [-1.35, 1.35], 0.55], [-5.0, [-1.35, 1.35], 0.55], [5.0, [-1.35, 1.35], 0.55], [12.5, [-1.35, 1.35], 0.55]], pantographX: 13.5, room: { kind: "windows", n: 6, y: [2.7, 3.3] } };

const L: Record<string, Liveries> = {
  wam4: { blue: { title: "IR blue", loco: bands(WAM4, "21322", [2.3, "#1d3f80"], [2.5, "#e8dcc0"], [4.5, "#1d3f80"]) }, maroon: { title: "Maroon, cream", loco: bands(WAM4, "20502", [2.3, "#6b1d24"], [2.5, "#e8dcc0"], [4.5, "#6b1d24"]) } },
  wap4: { rajdhani: { title: "Rajdhani red", loco: bands(WAP4, "22301", [2.3, "#b5232b"], [2.5, "#e8dcc0"], [4.5, "#b5232b"]) }, shatabdi: { title: "Shatabdi blue", loco: bands(WAP4, "22518", [2.3, "#1d3f80"], [2.5, "#e8dcc0"], [4.5, "#1d3f80"]) } },
  wap7: { redWhite: { title: "Red and white", loco: bands(WAP7, "30201", [2.3, "#b5232b"], [2.6, "#f1f1ee"], [4.5, "#b5232b"]) }, blue: { title: "IR blue", loco: bands(WAP7, "30351", [2.3, "#1d3f80"], [2.6, "#f1f1ee"], [4.5, "#1d3f80"]) }, wag9: { title: "WAG-9 brown", loco: bands(WAP7, "31001", [2.3, "#6b3a22"], [2.6, "#f2c31a"], [4.5, "#6b3a22"]) } },
  wap5: { whiteRed: { title: "White and red", loco: bands(WAP5, "30001", [2.2, "#b5232b"], [4.5, "#f1f1ee"]) }, gatimaan: { title: "Gatimaan", loco: bands(WAP5, "30086", [2.2, "#1d3f80"], [2.4, "#f2c31a"], [4.5, "#f1f1ee"]) } },
  wag12: { greyRed: { title: "Grey and red", loco: bands(WAG12, "60001", [2.2, "#b5232b"], [4.5, "#9aa0a5"]) } },
};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
const b = (k: string, v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string, v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

export function irWam4(v?: ParamValues): MeshBuilder { return b("wam4", v); }
export function irWam4Lod(v?: ParamValues): MeshBuilder { return lod("wam4", v); }
export function irWap4(v?: ParamValues): MeshBuilder { return b("wap4", v); }
export function irWap4Lod(v?: ParamValues): MeshBuilder { return lod("wap4", v); }
export function irWap7(v?: ParamValues): MeshBuilder { return b("wap7", v); }
export function irWap7Lod(v?: ParamValues): MeshBuilder { return lod("wap7", v); }
export function irWap5(v?: ParamValues): MeshBuilder { return b("wap5", v); }
export function irWap5Lod(v?: ParamValues): MeshBuilder { return lod("wap5", v); }
export function irWag12b(v?: ParamValues): MeshBuilder { return b("wag12", v); }
export function irWag12bLod(v?: ParamValues): MeshBuilder { return lod("wag12", v); }

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
const d = (id: string, title: string, params: ParamSpec[], build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, catalog = E): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(params), game: locoGame(weight, power, maxspeed), catalog, loadingGauge: "us", references: id });

export const IN_LOCOS: ProceduralDesign[] = [
  d("ir-wdm2", "IR WDM-2", H.wdm2, irWdm2, irWdm2Lod, 112, 1940, 120, D),
  d("ir-wdp4d", "IR WDP-4D", H.wdp4d, irWdp4d, irWdp4dLod, 121, 3300, 160, D),
  d("ir-wdg4g", "IR WDG-4G", H.wdg4g, irWdg4g, irWdg4gLod, 135, 3400, 100, D),
  d("ir-wam4", "IR WAM-4", P.wam4!, irWam4, irWam4Lod, 113, 2700, 120),
  d("ir-wap4", "IR WAP-4", P.wap4!, irWap4, irWap4Lod, 112, 3800, 140),
  d("ir-wap7", "IR WAP-7 / WAG-9", P.wap7!, irWap7, irWap7Lod, 123, 4500, 140),
  d("ir-wap5", "IR WAP-5", P.wap5!, irWap5, irWap5Lod, 78, 4000, 160),
  d("ir-wag12b", "IR WAG-12B", P.wag12!, irWag12b, irWag12bLod, 180, 9000, 120),
];
