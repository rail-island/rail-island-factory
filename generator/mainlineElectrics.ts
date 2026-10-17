// The six-axle Czech and the German and Austrian electric locomotives
// transferred from vlakosimdb in one package (docs/models/mainline-electrics.md):
// the CD 180 / 181 / 182, the DNT 184.5, the DB 111, the DR 243 / DB 143 / 112
// and the OBB 1012 and 1040, all built by boxLocoKit.ts. Registered as one
// family in generate.ts; a design's JS bundle imports its build function from
// this module. (The DB 180 is a livery of veh-cd-263, cd163Family.ts.)

import type { GameProperties, ProceduralDesign } from "./design.ts";
import { ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { CD181_PARAMS, cd181, cd181Lod } from "./cd181.ts";
import { DNT184_PARAMS, dnt184, dnt184Lod } from "./dnt184.ts";
import { DB111_PARAMS, db111, db111Lod } from "./db111.ts";
import { DR243_PARAMS, dr243, dr243Lod } from "./dr243.ts";
import { obb1012, obb1012Lod } from "./obb1012.ts";
import { obb1040, obb1040Lod } from "./obb1040.ts";

export { cd181, cd181Lod, dnt184, dnt184Lod, db111, db111Lod, dr243, dr243Lod, obb1012, obb1012Lod, obb1040, obb1040Lod };

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_180_GAME: GameProperties = {
  weight: 120,
  power: 2790,
  maxspeed: 90,
  accel: null,
  variants: [
    { params: { livery: "cd181Okd" }, weight: 124, power: 2470 },
  ],
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const DNT_184_5_GAME: GameProperties = {
  weight: 120,
  power: 5220,
  maxspeed: 95,
  accel: null,
  variants: [
    { params: { livery: "dnt1845No2" }, maxspeed: 160 },
  ],
};

export const MAINLINE_ELECTRICS: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-180", game: CD_180_GAME, title: "CD 180 / 181 / 182", build: cd181, buildLod: cd181Lod, params: CD181_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "cd-181" },
  { id: "proc-vehicle-dnt-184-5", game: DNT_184_5_GAME, title: "DNT 184.5", build: dnt184, buildLod: dnt184Lod, params: DNT184_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "dnt-184" },
  { id: "proc-vehicle-db-111", game: { weight: 86, power: 3060, maxspeed: 120, accel: null }, title: "DB 111", build: db111, buildLod: db111Lod, params: DB111_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "db-111" },
  { id: "proc-vehicle-dr-243", game: { weight: 82, power: 3700, maxspeed: 120, accel: null }, title: "DR 243 / DB 143 / 112", build: dr243, buildLod: dr243Lod, params: DR243_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "dr-243" },
  { id: "proc-vehicle-obb-1012", game: { weight: 85, power: 4000, maxspeed: 160, accel: null }, title: "OBB 1012", build: obb1012, buildLod: obb1012Lod, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1012" },
  { id: "proc-vehicle-obb-1040", game: { weight: 85, power: 3080, maxspeed: 110, accel: null }, title: "OBB 1040", build: obb1040, buildLod: obb1040Lod, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1040" },
];
