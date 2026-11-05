// Dutch electric and diesel locomotives on the box locomotive kit (stated with
// worldLocoKit.ts): the 1100 and 1300, sisters of Alsthom's French BB 8100 and
// CC 7100, the 1600 / 1700 of the BB 7200 / 22200 "nez casse" family (frLocos.ts
// bodies), the Werkspoor 1200 and the 2200 centre-cab diesel.
// See docs/models/netherlands-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { BB22200_BODY, BB9200_BODY, CC7100_BODY, liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

const GREY = c("#5a5d60", 0.6);
const YELLOW = c("#ffc917");
const NS_GREY = c("#6f757a", 0.5);
const TURQUOISE = c("#2b6f8a");
/** NS's 1950s turquoise blue with its yellow lining, and the 1970s yellow and grey. */
const blue = (body: Omit<WorldLoco, "palette" | "side" | "number">, number: string): WorldLoco => ({ ...body, palette: { blue: TURQUOISE, yellow: YELLOW, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.36, "yellow"], [2.36, 4.3, "blue"]], number });
const yellowGrey = (body: Omit<WorldLoco, "palette" | "side" | "number">, number: string): WorldLoco => ({ ...body, palette: { yellow: YELLOW, nsGrey: NS_GREY, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.2, "nsGrey"], [2.2, 4.3, "yellow"]], number });

const NS1100_BODY = { ...BB9200_BODY, length: 12.93, bogies: [[-3.2, [-1.35, 1.35], 0.625], [3.2, [-1.35, 1.35], 0.625]], pantographX: 3.0, room: { kind: "grilles", n: 2, y: [2.6, 3.3] } } as const;
const NS1300_BODY = { ...CC7100_BODY, length: 18.95 };
const NS1200_BODY = { length: 18.08, W: 1.48, y0: 1.35, roof: 3.95, nose: "streamlined", bogies: [[-5.2, [-1.65, 0, 1.65], 0.55], [5.2, [-1.65, 0, 1.65], 0.55]], pantograph: "diamond", pantographX: 5.3, room: { kind: "windows", n: 5, y: [2.6, 3.2] } } as const;
const NS2200_BODY = { length: 14.1, W: 1.45, y0: 1.35, roof: 4.15, nose: "hoods", cabHalf: 1.3, hoodTop: 3.35, bogies: [[-3.6, [-1.25, 1.25], 0.5], [3.6, [-1.25, 1.25], 0.5]], exhausts: [-3.8] } as const;

const NS1700: Liveries = {
  yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(BB22200_BODY, "1701") },
  railion: { title: "Railion red", loco: { ...BB22200_BODY, palette: { red: c("#c8102e"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 4.3, "red"]], number: "1616" } },
};
const NS1100: Liveries = { blue: { title: "NS blue", loco: blue(NS1100_BODY, "1101") }, yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(NS1100_BODY, "1130") } };
const NS1300: Liveries = { blue: { title: "NS blue", loco: blue(NS1300_BODY, "1301") }, yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(NS1300_BODY, "1312") } };
const NS1200: Liveries = { blue: { title: "NS blue", loco: blue(NS1200_BODY, "1201") }, yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(NS1200_BODY, "1251") } };
const NS2200: Liveries = {
  brown: { title: "Red brown", loco: { ...NS2200_BODY, palette: { brown: c("#7a2e22"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 4.3, "brown"]], number: "2201" } },
  yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(NS2200_BODY, "2275") },
};

const P = { ns1700: liveryParams(NS1700), ns1100: liveryParams(NS1100), ns1300: liveryParams(NS1300), ns1200: liveryParams(NS1200), ns2200: liveryParams(NS2200) };

export function ns1700(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS1700, P.ns1700, v)); }
export function ns1700Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS1700, P.ns1700, v)); }
export function ns1100(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS1100, P.ns1100, v)); }
export function ns1100Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS1100, P.ns1100, v)); }
export function ns1300(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS1300, P.ns1300, v)); }
export function ns1300Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS1300, P.ns1300, v)); }
export function ns1200(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS1200, P.ns1200, v)); }
export function ns1200Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS1200, P.ns1200, v)); }
export function ns2200(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS2200, P.ns2200, v)); }
export function ns2200Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS2200, P.ns2200, v)); }

const E = ELECTRIC_LOCO_CATALOG;
export const NL_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-ns-1700", title: "NS 1600 / 1700", build: ns1700, buildLod: ns1700Lod, ...paramsOf(P.ns1700), game: locoGame(84, 4540, 160), catalog: E, references: "ns-1700" },
  { id: "proc-vehicle-ns-1100", title: "NS 1100", build: ns1100, buildLod: ns1100Lod, ...paramsOf(P.ns1100), game: locoGame(83, 2350, 135), catalog: E, references: "ns-1100" },
  { id: "proc-vehicle-ns-1300", title: "NS 1300", build: ns1300, buildLod: ns1300Lod, ...paramsOf(P.ns1300), game: locoGame(111, 2340, 135), catalog: E, references: "ns-1300" },
  { id: "proc-vehicle-ns-1200", title: "NS 1200", build: ns1200, buildLod: ns1200Lod, ...paramsOf(P.ns1200), game: locoGame(108, 2360, 150), catalog: E, references: "ns-1200" },
  { id: "proc-vehicle-ns-2200", title: "NS 2200", build: ns2200, buildLod: ns2200Lod, ...paramsOf(P.ns2200), game: locoGame(72, 670, 100), catalog: DIESEL_LOCO_CATALOG, references: "ns-2200" },
];
