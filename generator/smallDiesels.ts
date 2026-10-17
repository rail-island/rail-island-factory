// The small and shunting diesel locomotives transferred from vlakosimdb in one
// package (docs/models/small-diesels.md): the CD 704 / CSD T 238.0, the CD 710
// "rosnicka", the CD 714, the 740 / 742 / 743 family, the DB V 100 / 212 and the
// MUV 69 track motor car. Registered as one family in generate.ts; a design's JS
// bundle imports its build function from this module.

import type { GameProperties, ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG } from "./cd163.ts";
import { CD704_PARAMS, cd704, cd704Lod } from "./cd704.ts";
import { cd710, cd710Lod } from "./cd710.ts";
import { cd714, cd714Lod } from "./cd714.ts";
import { CD742_PARAMS, cd742, cd742Lod } from "./cd742.ts";
import { DB212_PARAMS, db212, db212Lod } from "./db212.ts";
import { muv69, muv69Lod } from "./muv69.ts";

export { cd704, cd704Lod, cd710, cd710Lod, cd714, cd714Lod, cd742, cd742Lod, db212, db212Lod, muv69, muv69Lod };

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_742_GAME: GameProperties = {
  weight: 63,
  power: 2500,
  maxspeed: 90,
  accel: null,
  variants: [
    { params: { variant: "cd743" }, weight: 65, power: 800 },
  ],
};

export const SMALL_DIESELS: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-704", game: { weight: 28, power: 250, maxspeed: 60, accel: null }, title: "CD 704 / CSD T 234.0", build: cd704, buildLod: cd704Lod, params: CD704_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-704" },
  { id: "proc-vehicle-cd-710", game: { weight: 28, power: 300, maxspeed: 60, accel: null }, title: "CD 710 Rosnicka", build: cd710, buildLod: cd710Lod, catalog: DIESEL_LOCO_CATALOG, references: "cd-710" },
  { id: "proc-vehicle-cd-714", game: { weight: 64, power: 1020, maxspeed: 90, accel: null }, title: "CD 714", build: cd714, buildLod: cd714Lod, catalog: DIESEL_LOCO_CATALOG, references: "cd-714" },
  { id: "proc-vehicle-cd-742", game: CD_742_GAME, title: "CD 740 / 742 / 743", build: cd742, buildLod: cd742Lod, params: CD742_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-742" },
  { id: "proc-vehicle-db-212", game: { weight: 64, power: 1020, maxspeed: 90, accel: null }, title: "DB V 100 / 212", build: db212, buildLod: db212Lod, params: DB212_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "db-212" },
  { id: "proc-vehicle-muv-69", game: { weight: 5, power: 5, maxspeed: 15, accel: null }, title: "MUV 69", build: muv69, buildLod: muv69Lod, catalog: DIESEL_LOCO_CATALOG, references: "muv-69" },
];
