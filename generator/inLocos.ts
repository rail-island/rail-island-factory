// Indian locomotives. The road diesels on the hood unit kit (usHoodKit.ts),
// each drawn on its own from photographs: the ALCO WDM-2 (inWdm2.ts), the EMD
// WDP-4D (inWdp4d.ts) and the GE WDG-4G (inWdg4g.ts). The electrics on the box locomotive kit
// (worldLocoKit.ts): the WAM-4, WAP-4, WAP-7 / WAG-9 and WAP-5; the twin
// WAG-12B drawn on its own (inWag12b.ts). Broad-gauge bodies on the 3.3 m gauge ("us").
// See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { paint } from "./dieselParts.ts";
import type { UsHoodSpec, UsLivery } from "./usHoodKit.ts";
import { WDM2_BODY, WDM2_LIVERIES, buildWdm2, wdm2Lod } from "./inWdm2.ts";
import { buildWdg4g, buildWdg4gLod, type Wdg4gLivery } from "./inWdg4g.ts";
import { buildWdp4d, buildWdp4dLod } from "./inWdp4d.ts";
import { locoGame, paramsOf } from "./frLocos.ts";
import { WAP5_PARAMS, irWap5, irWap5Lod } from "./inWap5.ts";
import { WAP7_PARAMS, irWap7, irWap7Lod } from "./inWap7.ts";
import { WAP4_PARAMS, irWap4, irWap4Lod } from "./inWap4.ts";
// the bundle of a design imports its build functions from the module that lists it (jsModel.ts)
export { irWap5, irWap5Lod, irWap7, irWap7Lod };
import { WAG12B_PARAMS, irWag12b, irWag12bLod } from "./inWag12b.ts";
import { WAM4_PARAMS, irWam4, irWam4Lod } from "./inWam4.ts";

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

/** The WDM-2 (ALCO DL560C): drawn on its own from photographs by inWdm2.ts. */
export const WDM2_SPEC: UsHoodSpec = WDM2_BODY;

type HoodLiveries = Record<string, UsLivery>;
const WDM2: HoodLiveries = WDM2_LIVERIES;
const WDP4D: HoodLiveries = { blueYellow: irLivery("Blue, yellow", "40002", "#1d3f80", "#f2c31a", 2.6) };
// The WDG-4G is drawn by its own module from photographs (inWdg4g.ts); the key and title stay.
const WDG4G: Record<string, Wdg4gLivery> = { redGrey: { title: "Red, orange", number: "49095", red: "#cf2a1e", orange: "#ee9c16" } };

const hoodParams = (l: HoodLiveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
const H = { wdm2: hoodParams(WDM2), wdp4d: hoodParams(WDP4D), wdg4g: [enumParam("livery", "Livery", Object.fromEntries(Object.entries(WDG4G).map(([k, v]) => [k, v.title])))] };
const hood = <T>(l: Record<string, T>, p: ParamSpec[], v?: ParamValues): T => l[resolveParams(p, v).livery!]!;

export function irWdm2(v?: ParamValues): MeshBuilder { return buildWdm2(WDM2_LIVERIES[resolveParams(H.wdm2, v).livery!]!); }
export function irWdm2Lod(v?: ParamValues): MeshBuilder { return wdm2Lod(WDM2_LIVERIES[resolveParams(H.wdm2, v).livery!]!); }
export function irWdp4d(v?: ParamValues): MeshBuilder { hood(WDP4D, H.wdp4d, v); return buildWdp4d(); }
export function irWdp4dLod(v?: ParamValues): MeshBuilder { hood(WDP4D, H.wdp4d, v); return buildWdp4dLod(); }
export function irWdg4g(v?: ParamValues): MeshBuilder { return buildWdg4g(hood(WDG4G, H.wdg4g, v)); }
export function irWdg4gLod(v?: ParamValues): MeshBuilder { return buildWdg4gLod(hood(WDG4G, H.wdg4g, v)); }

// ---------------------------------------------------------------------------
// The electrics

// each drawn by its own module from photographs (inWam4.ts, inWap4.ts, inWap7.ts, inWap5.ts, inWag12b.ts)
export { irWam4, irWam4Lod };
export { irWap4, irWap4Lod };
export { irWag12b, irWag12bLod };

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
const d = (id: string, title: string, params: ParamSpec[], build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number, catalog = E): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(params), game: locoGame(weight, power, maxspeed), catalog, loadingGauge: "us", references: id });

export const IN_LOCOS: ProceduralDesign[] = [
  d("ir-wdm2", "IR WDM-2", H.wdm2, irWdm2, irWdm2Lod, 112, 1940, 120, D),
  d("ir-wdp4d", "IR WDP-4D", H.wdp4d, irWdp4d, irWdp4dLod, 123, 3300, 135, D),
  d("ir-wdg4g", "IR WDG-4G", H.wdg4g, irWdg4g, irWdg4gLod, 135, 3400, 100, D),
  d("ir-wam4", "IR WAM-4", WAM4_PARAMS, irWam4, irWam4Lod, 113, 2700, 120),
  d("ir-wap4", "IR WAP-4", WAP4_PARAMS, irWap4, irWap4Lod, 112, 3800, 140),
  d("ir-wap7", "IR WAP-7 / WAG-9", WAP7_PARAMS, irWap7, irWap7Lod, 123, 4500, 140),
  d("ir-wap5", "IR WAP-5", WAP5_PARAMS, irWap5, irWap5Lod, 78, 4000, 160),
  d("ir-wag12b", "IR WAG-12B", WAG12B_PARAMS, irWag12b, irWag12bLod, 180, 9000, 120),
];
