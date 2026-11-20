// French electric and diesel locomotives, each measured from photographs in its
// own module: Paul Arzens's "nez casse" family - the CC 6500, the quadri-current
// CC 40100, the BB 22200 and the CC 72000 diesel - the CC 7100 of the 1955 speed
// record and the BB 9200 of Alsthom's 1950s body, the BB 27000 Prima and the
// BB 67400 diesel. This file registers them and keeps the livery helpers the
// other countries' box locomotives share (worldLocoKit.ts).
// See docs/models/france-trains.md.

import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { enumParam } from "./emuParts.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { worldLocoSpec, type WorldLoco } from "./worldLocoKit.ts";
import { CC6500_PARAMS, sncfCc6500, sncfCc6500Lod } from "./frCc6500.ts";
import { CC40100_PARAMS, sncfCc40100, sncfCc40100Lod } from "./frCc40100.ts";
import { CC7100_PARAMS, sncfCc7100, sncfCc7100Lod } from "./frCc7100.ts";
import { BB22200_PARAMS, sncfBb22200, sncfBb22200Lod } from "./frBb22200.ts";
import { BB9200_GAME, BB9200_PARAMS, sncfBb9200, sncfBb9200Lod } from "./frBb9200.ts";
import { BB27000_PARAMS, sncfBb27000, sncfBb27000Lod } from "./frBb27000.ts";
import { BB67400_PARAMS, sncfBb67400, sncfBb67400Lod } from "./frBb67400.ts";
import { CC72000_PARAMS, sncfCc72000, sncfCc72000Lod } from "./frCc72000.ts";

export { sncfCc6500, sncfCc6500Lod };

export type Liveries = Record<string, { title: string; loco: WorldLoco }>;

export const liveryParams = (l: Liveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
export const liverySpec = (l: Liveries, p: readonly ParamSpec[], v?: ParamValues) => worldLocoSpec(l[resolveParams(p, v).livery!]!.loco);
/** A design's parameters: none for a single livery. */
export const paramsOf = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});
export const locoGame = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });

export { sncfCc40100, sncfCc40100Lod };
export { sncfBb22200, sncfBb22200Lod };
export { sncfCc72000, sncfCc72000Lod };
export { sncfCc7100, sncfCc7100Lod };
export { sncfBb9200, sncfBb9200Lod };
export { sncfBb27000, sncfBb27000Lod };
export { sncfBb67400, sncfBb67400Lod };

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
export const FR_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-sncf-cc6500", title: "SNCF CC 6500", build: sncfCc6500, buildLod: sncfCc6500Lod, params: CC6500_PARAMS, game: locoGame(115, 5900, 200), catalog: E, references: "sncf-cc6500" },
  { id: "proc-vehicle-sncf-cc40100", title: "SNCF CC 40100", build: sncfCc40100, buildLod: sncfCc40100Lod, ...paramsOf(CC40100_PARAMS), game: locoGame(107, 4480, 160), catalog: E, references: "sncf-cc40100" },
  { id: "proc-vehicle-sncf-bb22200", title: "SNCF BB 22200", build: sncfBb22200, buildLod: sncfBb22200Lod, params: BB22200_PARAMS, game: locoGame(90, 4360, 160), catalog: E, references: "sncf-bb22200" },
  { id: "proc-vehicle-sncf-cc7100", title: "SNCF CC 7100", build: sncfCc7100, buildLod: sncfCc7100Lod, params: CC7100_PARAMS, game: locoGame(107, 3490, 150), catalog: E, references: "sncf-cc7100" },
  { id: "proc-vehicle-sncf-bb9200", title: "SNCF BB 9200", build: sncfBb9200, buildLod: sncfBb9200Lod, params: BB9200_PARAMS, game: BB9200_GAME, catalog: E, references: "sncf-bb9200" },
  { id: "proc-vehicle-sncf-bb27000", title: "SNCF BB 27000 Prima", build: sncfBb27000, buildLod: sncfBb27000Lod, ...paramsOf(BB27000_PARAMS), game: locoGame(90, 4200, 140), catalog: E, references: "sncf-bb27000" },
  { id: "proc-vehicle-sncf-bb67400", title: "SNCF BB 67400", build: sncfBb67400, buildLod: sncfBb67400Lod, params: BB67400_PARAMS, game: locoGame(83, 1765, 140), catalog: D, references: "sncf-bb67400" },
  { id: "proc-vehicle-sncf-cc72000", title: "SNCF CC 72000", build: sncfCc72000, buildLod: sncfCc72000Lod, params: CC72000_PARAMS, game: locoGame(114, 2650, 160), catalog: D, references: "sncf-cc72000" },
];
