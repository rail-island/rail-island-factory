// Dutch electric and diesel locomotives on the box locomotive kit (stated with
// worldLocoKit.ts): the 1100 and 1300 (their own modules, nl1100.ts and nl1300.ts), sisters of Alsthom's French BB 8100 and
// CC 7100, the 1600 / 1700 of the BB 7200 "nez casse" family (its own module,
// nl1700.ts), the Werkspoor 1200; the 2200 end-cab diesel in its own module (nl2200.ts).
// See docs/models/netherlands-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";
import { NS1100_PARAMS, ns1100, ns1100Lod } from "./nl1100.ts";
import { NS1700_PARAMS, ns1700, ns1700Lod } from "./nl1700.ts";
import { NS1300_PARAMS, ns1300, ns1300Lod } from "./nl1300.ts";
import { NS2200_PARAMS, ns2200, ns2200Lod } from "./nl2200.ts";

const GREY = c("#5a5d60", 0.6);
const YELLOW = c("#ffc917");
const NS_GREY = c("#6f757a", 0.5);
const TURQUOISE = c("#2b6f8a");
/** NS's 1950s turquoise blue with its yellow lining, and the 1970s yellow and grey. */
const blue = (body: Omit<WorldLoco, "palette" | "side" | "number">, number: string): WorldLoco => ({ ...body, palette: { blue: TURQUOISE, yellow: YELLOW, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.36, "yellow"], [2.36, 4.3, "blue"]], number });
const yellowGrey = (body: Omit<WorldLoco, "palette" | "side" | "number">, number: string): WorldLoco => ({ ...body, palette: { yellow: YELLOW, nsGrey: NS_GREY, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.2, "nsGrey"], [2.2, 4.3, "yellow"]], number });

const NS1200_BODY = { length: 18.08, W: 1.48, y0: 1.35, roof: 3.95, nose: "streamlined", bogies: [[-5.2, [-1.65, 0, 1.65], 0.55], [5.2, [-1.65, 0, 1.65], 0.55]], pantograph: "diamond", pantographX: 5.3, room: { kind: "windows", n: 5, y: [2.6, 3.2] } } as const;

const NS1200: Liveries = { blue: { title: "NS blue", loco: blue(NS1200_BODY, "1201") }, yellowGrey: { title: "NS yellow, grey", loco: yellowGrey(NS1200_BODY, "1251") } };

const P = { ns1200: liveryParams(NS1200) };

export function ns1200(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(NS1200, P.ns1200, v)); }
export function ns1200Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(NS1200, P.ns1200, v)); }

export { ns1300, ns1300Lod };

const E = ELECTRIC_LOCO_CATALOG;
export const NL_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-ns-1700", title: "NS 1600 / 1700", build: ns1700, buildLod: ns1700Lod, params: NS1700_PARAMS, game: locoGame(84, 4540, 160), catalog: E, references: "ns-1700" },
  { id: "proc-vehicle-ns-1100", title: "NS 1100", build: ns1100, buildLod: ns1100Lod, params: NS1100_PARAMS, game: locoGame(83, 2030, 135), catalog: E, references: "ns-1100" },
  { id: "proc-vehicle-ns-1300", title: "NS 1300", build: ns1300, buildLod: ns1300Lod, ...paramsOf(NS1300_PARAMS), game: locoGame(111, 3159, 130), catalog: E, references: "ns-1300" },
  { id: "proc-vehicle-ns-1200", title: "NS 1200", build: ns1200, buildLod: ns1200Lod, ...paramsOf(P.ns1200), game: locoGame(108, 2360, 150), catalog: E, references: "ns-1200" },
  { id: "proc-vehicle-ns-2200", title: "NS 2200", build: ns2200, buildLod: ns2200Lod, params: NS2200_PARAMS, game: locoGame(72, 662, 100), catalog: DIESEL_LOCO_CATALOG, references: "ns-2200" },
];
