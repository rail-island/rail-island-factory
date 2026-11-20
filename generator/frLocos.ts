// French electric and diesel locomotives on the box locomotive kit (stated
// with worldLocoKit.ts): Paul Arzens's "nez casse" family - the CC 6500, the
// quadri-current CC 40100, the BB 22200 and the CC 72000 diesel - the CC 7100
// of the 1955 speed record and the BB 9200 of Alsthom's 1950s body, the
// BB 27000 Prima and the BB 67400 diesel. The bodies are exported: the Dutch
// 1100, 1300 and 1600 / 1700 are their sisters (nlLocos.ts).
// See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { enumParam } from "./emuParts.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { worldLocoSpec, type WorldLoco } from "./worldLocoKit.ts";
import { CC6500_PARAMS, sncfCc6500, sncfCc6500Lod } from "./frCc6500.ts";
import { CC40100_PARAMS, sncfCc40100, sncfCc40100Lod } from "./frCc40100.ts";
import { CC7100_PARAMS, sncfCc7100, sncfCc7100Lod } from "./frCc7100.ts";
import { BB22200_PARAMS, sncfBb22200, sncfBb22200Lod } from "./frBb22200.ts";
import { BB9200_GAME, BB9200_PARAMS, sncfBb9200, sncfBb9200Lod } from "./frBb9200.ts";
import { BB27000_PARAMS, sncfBb27000, sncfBb27000Lod } from "./frBb27000.ts";

export { sncfCc6500, sncfCc6500Lod };

export type Liveries = Record<string, { title: string; loco: WorldLoco }>;
type Body = Omit<WorldLoco, "palette" | "side" | "number">;

const GREY = c("#5a5d60", 0.6);
const WHITE = c("#efefea");
const mono = (pivot: number, base: number, r: number, axles: 2 | 3) =>
  [[-pivot, axles === 3 ? [-base, 0, base] : [-base, base], r], [pivot, axles === 3 ? [-base, 0, base] : [-base, base], r]] as const;

// ---------------------------------------------------------------------------
// The bodies

export const CC72000_BODY: Body = { length: 20.19, W: 1.5, y0: 1.3, roof: 4.0, nose: "nezCasse", bogies: mono(5.6, 1.6, 0.57, 3), exhausts: [-1.5], room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
/** Alsthom's rounded 1950s body: the BB 9200, a shorter Bo-Bo of the CC 7100's family (frCc7100.ts). */
const BB67400_BODY: Body = { length: 17.09, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: mono(4.5, 1.4, 0.55, 2), exhausts: [0.4], room: { kind: "grilles", n: 4, y: [2.6, 3.3] } };

// ---------------------------------------------------------------------------
// The liveries

const CC72000: Liveries = {
  blueWhite: { title: "Blue and white", loco: { ...CC72000_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.9, "white"], [2.9, 4.3, "blue"]], number: "CC 72001" } },
  multiservice: { title: "Multiservice", loco: { ...CC72000_BODY, palette: { grey2: c("#8c9196", 0.5), red: c("#c8102e"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.2, "red"], [2.2, 4.3, "grey2"]], number: "72075" } },
};
const BB67400: Liveries = {
  blueWhite: { title: "Blue and white", loco: { ...BB67400_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.85, "white"], [2.85, 4.3, "blue"]], number: "BB 67401" } },
  fret: { title: "Fret", loco: { ...BB67400_BODY, palette: { grey2: c("#9aa0a5", 0.5), green: c("#3c9b38"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.1, "green"], [2.1, 4.3, "grey2"]], number: "BB 67567" } },
};

// ---------------------------------------------------------------------------

export const liveryParams = (l: Liveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
export const liverySpec = (l: Liveries, p: readonly ParamSpec[], v?: ParamValues) => worldLocoSpec(l[resolveParams(p, v).livery!]!.loco);
/** A design's parameters: none for a single livery. */
export const paramsOf = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});
export const locoGame = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });

const P = { cc72000: liveryParams(CC72000), bb67400: liveryParams(BB67400) };

export { sncfCc40100, sncfCc40100Lod };
export { sncfBb22200, sncfBb22200Lod };
export function sncfCc72000(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(CC72000, P.cc72000, v)); }
export function sncfCc72000Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(CC72000, P.cc72000, v)); }
export { sncfCc7100, sncfCc7100Lod };
export { sncfBb9200, sncfBb9200Lod };
export { sncfBb27000, sncfBb27000Lod };
export function sncfBb67400(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(BB67400, P.bb67400, v)); }
export function sncfBb67400Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(BB67400, P.bb67400, v)); }

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
export const FR_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-sncf-cc6500", title: "SNCF CC 6500", build: sncfCc6500, buildLod: sncfCc6500Lod, params: CC6500_PARAMS, game: locoGame(115, 5900, 200), catalog: E, references: "sncf-cc6500" },
  { id: "proc-vehicle-sncf-cc40100", title: "SNCF CC 40100", build: sncfCc40100, buildLod: sncfCc40100Lod, ...paramsOf(CC40100_PARAMS), game: locoGame(107, 4480, 160), catalog: E, references: "sncf-cc40100" },
  { id: "proc-vehicle-sncf-bb22200", title: "SNCF BB 22200", build: sncfBb22200, buildLod: sncfBb22200Lod, params: BB22200_PARAMS, game: locoGame(90, 4360, 160), catalog: E, references: "sncf-bb22200" },
  { id: "proc-vehicle-sncf-cc7100", title: "SNCF CC 7100", build: sncfCc7100, buildLod: sncfCc7100Lod, params: CC7100_PARAMS, game: locoGame(107, 3490, 150), catalog: E, references: "sncf-cc7100" },
  { id: "proc-vehicle-sncf-bb9200", title: "SNCF BB 9200", build: sncfBb9200, buildLod: sncfBb9200Lod, params: BB9200_PARAMS, game: BB9200_GAME, catalog: E, references: "sncf-bb9200" },
  { id: "proc-vehicle-sncf-bb27000", title: "SNCF BB 27000 Prima", build: sncfBb27000, buildLod: sncfBb27000Lod, ...paramsOf(BB27000_PARAMS), game: locoGame(90, 4200, 140), catalog: E, references: "sncf-bb27000" },
  { id: "proc-vehicle-sncf-bb67400", title: "SNCF BB 67400", build: sncfBb67400, buildLod: sncfBb67400Lod, ...paramsOf(P.bb67400), game: locoGame(83, 1765, 140), catalog: D, references: "sncf-bb67400" },
  { id: "proc-vehicle-sncf-cc72000", title: "SNCF CC 72000", build: sncfCc72000, buildLod: sncfCc72000Lod, ...paramsOf(P.cc72000), game: locoGame(114, 2650, 160), catalog: D, references: "sncf-cc72000" },
];
