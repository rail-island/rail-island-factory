// Spanish electric and diesel locomotives, each measured from photographs in
// its own module: the 354 "Virgen" that hauled the Talgo, the 252, the 269
// "Japonesa", the 277 "Inglesa", the 319 and the 333. This file registers them.
// See docs/models/spain-trains.md.

import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import type { ProceduralDesign } from "./design.ts";
import { locoGame } from "./frLocos.ts";
import { ES252_PARAMS, renfe252, renfe252Lod } from "./es252.ts";
import { renfe354, renfe354Lod } from "./es354.ts";
import { ES269_PARAMS, renfe269, renfe269Lod } from "./es269.ts";
import { ES277_PARAMS, renfe277, renfe277Lod } from "./es277.ts";
import { ES319_PARAMS, renfe319, renfe319Lod } from "./es319.ts";
import { ES333_PARAMS, renfe333, renfe333Lod } from "./es333.ts";

export { renfe354, renfe354Lod };
export { renfe252, renfe252Lod };
export { renfe269, renfe269Lod };
export { renfe277, renfe277Lod };
export { renfe319, renfe319Lod };
export { renfe333, renfe333Lod };

export const ES_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-renfe-354", title: "Renfe 354 Virgen", build: renfe354, buildLod: renfe354Lod, game: locoGame(80, 3070, 200), catalog: DIESEL_LOCO_CATALOG, references: "renfe-354" },
  { id: "proc-vehicle-renfe-252", title: "Renfe 252", build: renfe252, buildLod: renfe252Lod, params: ES252_PARAMS, game: locoGame(90, 5600, 220), catalog: ELECTRIC_LOCO_CATALOG, references: "renfe-252" },
  { id: "proc-vehicle-renfe-269", title: "Renfe 269", build: renfe269, buildLod: renfe269Lod, params: ES269_PARAMS, game: locoGame(88, 3100, 140), catalog: ELECTRIC_LOCO_CATALOG, references: "renfe-269" },
  { id: "proc-vehicle-renfe-277", title: "Renfe 277", build: renfe277, buildLod: renfe277Lod, params: ES277_PARAMS, game: locoGame(120, 2208, 110), catalog: ELECTRIC_LOCO_CATALOG, references: "renfe-277" },
  { id: "proc-vehicle-renfe-319", title: "Renfe 319", build: renfe319, buildLod: renfe319Lod, params: ES319_PARAMS, game: locoGame(116, 1500, 120), catalog: DIESEL_LOCO_CATALOG, references: "renfe-319" },
  { id: "proc-vehicle-renfe-333", title: "Renfe 333", build: renfe333, buildLod: renfe333Lod, params: ES333_PARAMS, game: { ...locoGame(120, 2460, 120), variants: [{ params: { livery: "talgo" }, maxspeed: 160 }] }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "renfe-333" },
];
