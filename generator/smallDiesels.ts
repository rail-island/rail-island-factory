// The small and shunting diesel locomotives transferred from vlakosimdb in one
// package (docs/models/small-diesels.md): the CD 704 / CSD T 238.0, the CD 710
// "rosnicka", the CD 714, the 740 / 742 / 743 family, the DB V 100 / 212 and the
// MUV 69 track motor car. Registered as one family in generate.ts; a design's JS
// bundle imports its build function from this module.

import type { ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG } from "./cd163.ts";
import { CD704_PARAMS, cd704 } from "./cd704.ts";
import { cd710 } from "./cd710.ts";
import { cd714 } from "./cd714.ts";
import { CD742_PARAMS, cd742 } from "./cd742.ts";
import { DB212_PARAMS, db212 } from "./db212.ts";
import { muv69 } from "./muv69.ts";

export { cd704, cd710, cd714, cd742, db212, muv69 };

export const SMALL_DIESELS: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-704", title: "CD 704 / CSD T 234.0", build: cd704, params: CD704_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-704" },
  { id: "proc-vehicle-cd-710", title: "CD 710 Rosnicka", build: cd710, catalog: DIESEL_LOCO_CATALOG, references: "cd-710" },
  { id: "proc-vehicle-cd-714", title: "CD 714", build: cd714, catalog: DIESEL_LOCO_CATALOG, references: "cd-714" },
  { id: "proc-vehicle-cd-742", title: "CD 740 / 742 / 743", build: cd742, params: CD742_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "cd-742" },
  { id: "proc-vehicle-db-212", title: "DB V 100 / 212", build: db212, params: DB212_PARAMS, catalog: DIESEL_LOCO_CATALOG, references: "db-212" },
  { id: "proc-vehicle-muv-69", title: "MUV 69", build: muv69, catalog: DIESEL_LOCO_CATALOG, references: "muv-69" },
];
