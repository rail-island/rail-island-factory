// The Czech mainline diesel locomotives transferred from vlakosimdb: the T 478
// "Brejlovec" (CD 750 / 753 / 754) and "Bardotka" (CD 749), the CD 781 "Sergej" (M62), the CSD T 679.0
// "Pomeranc", the T 499.0 / CD 759 "Kyklop" and the CD 770 / 771 "Cmelak" hood
// unit. Registered in generate.ts as one family: a design's standalone JS model
// imports its builder by name from this module (docs/models/diesel-locos.md).

import type { GameProperties, ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG } from "./cd163.ts";
import { CD750_PARAMS, cd750, cd750Lod } from "./cd750.ts";
import { CD749_PARAMS, cd749, cd749Lod } from "./cd749.ts";
import { CD781_PARAMS, cd781, cd781Lod } from "./cd781.ts";
import { csdT6790, csdT6790Lod } from "./csdT679.ts";
import { csdT499, csdT499Lod } from "./csdT499.ts";
import { CD771_PARAMS, cd771, cd771Lod } from "./cd771.ts";

// re-exported: a design's JS bundle imports its build function from this module
export { cd750, cd750Lod, cd749, cd749Lod, cd781, cd781Lod, csdT6790, csdT6790Lod, csdT499, csdT499Lod, cd771, cd771Lod };

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_750_GAME: GameProperties = {
  weight: 74,
  power: 1325,
  maxspeed: 100,
  accel: null,
  variants: [
    { params: { livery: "cd754No013" }, power: 1470 },
    { params: { livery: "cd754" }, power: 1470 },
  ],
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_771_GAME: GameProperties = {
  weight: 123,
  power: 740,
  maxspeed: 95,
  accel: null,
  variants: [
    { params: { livery: "cd771No421" }, weight: 114, power: 1350, maxspeed: 90 },
  ],
};

export const DIESEL_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-750", game: CD_750_GAME, title: "CD 750 / 753 / 754 Brejlovec", build: cd750, buildLod: cd750Lod, params: CD750_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-750" },
  { id: "proc-vehicle-cd-749", game: { weight: 72, power: 1102, maxspeed: 100, accel: null }, title: "CD 749 Bardotka", build: cd749, buildLod: cd749Lod, params: CD749_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-750" },
  { id: "proc-vehicle-cd-781", game: { weight: 116, power: 1470, maxspeed: 100, accel: null }, title: "CD 781 Sergej", build: cd781, buildLod: cd781Lod, params: CD781_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-781" },
  { id: "proc-vehicle-csd-t679-0", game: { weight: 114, power: 1470, maxspeed: 100, accel: null }, title: "CSD T 679.0 Pomeranc", build: csdT6790, buildLod: csdT6790Lod, catalog: DIESEL_LOCO_CATALOG, references: "csd-t679" },
  { id: "proc-vehicle-csd-t499", game: { weight: 76, power: 3000, maxspeed: 140, accel: null }, title: "CSD T 499.0 / CD 759 Kyklop", build: csdT499, buildLod: csdT499Lod, catalog: DIESEL_LOCO_CATALOG, references: "csd-t499" },
  { id: "proc-vehicle-cd-771", game: CD_771_GAME, title: "CD 770 / 771 Cmelak", build: cd771, buildLod: cd771Lod, params: CD771_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-771" },
];
