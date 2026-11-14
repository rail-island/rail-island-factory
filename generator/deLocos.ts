// German electric and diesel locomotives, each in its own module on the box
// locomotive kit (boxLocoKit.ts) with its own profile measured on photographs and
// drawings: the BR 103 express engine, the BR 101 and BR 120, the E 18, the E 94
// "German crocodile", the V 200 and the BR 218. This file is their registry.
// See docs/models/germany-trains.md.

import type { GameProperties, ParamSpec, ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { V200_PARAMS, dbV200, dbV200Lod } from "./deV200.ts";
import { BR218_PARAMS, dbBr218, dbBr218Lod } from "./deBr218.ts";
import { BR103_PARAMS, db103, db103Lod } from "./deBr103.ts";
import { BR101_PARAMS, db101, db101Lod } from "./deBr101.ts";
import { BR120_PARAMS, db120, db120Lod } from "./deBr120.ts";
import { E94_PARAMS, drgE94, drgE94Lod } from "./deE94.ts";
import { E18_PARAMS, drgE18, drgE18Lod } from "./deE18.ts";

export { dbV200, dbV200Lod, dbBr218, dbBr218Lod };
export { db103, db103Lod };
export { db101, db101Lod };
export { db120, db120Lod };
export { drgE18, drgE18Lod };
export { drgE94, drgE94Lod };

const game = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });
/** A design's parameters: none for a single livery. */
const params = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});

export const DE_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-db-103", title: "DB 103", build: db103, buildLod: db103Lod, params: BR103_PARAMS, game: game(114, 7440, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-103" },
  { id: "proc-vehicle-db-101", title: "DB 101", build: db101, buildLod: db101Lod, params: BR101_PARAMS, game: game(87, 6400, 220), catalog: ELECTRIC_LOCO_CATALOG, references: "db-101" },
  { id: "proc-vehicle-db-120", title: "DB 120", build: db120, buildLod: db120Lod, params: BR120_PARAMS, game: game(84, 5600, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-120" },
  { id: "proc-vehicle-drg-e18", title: "DRG E 18", build: drgE18, buildLod: drgE18Lod, ...params(E18_PARAMS), game: game(108, 3040, 150), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e18" },
  { id: "proc-vehicle-drg-e94", title: "DRG E 94", build: drgE94, buildLod: drgE94Lod, ...params(E94_PARAMS), game: game(118, 3300, 90), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e94" },
  { id: "proc-vehicle-db-v200", title: "DB V 200", build: dbV200, buildLod: dbV200Lod, params: V200_PARAMS, game: game(80, 1620, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-v200" },
  { id: "proc-vehicle-db-218", title: "DB 218", build: dbBr218, buildLod: dbBr218Lod, params: BR218_PARAMS, game: game(79, 1840, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-218" },
];
