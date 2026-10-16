// The small and shunting diesel locomotives transferred from vlakosimdb in one
// package (docs/models/small-diesels.md): the CD 704 / CSD T 238.0, the CD 710
// "rosnicka", the CD 714, the 740 / 742 / 743 family, the DB V 100 / 212 and the
// MUV 69 track motor car. Registered as one family in generate.ts; a design's JS
// bundle imports its build function from this module.

import type { ProceduralDesign } from "./design.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { CD704_PARAMS, cd704 } from "./cd704.ts";
import { cd710 } from "./cd710.ts";
import { cd714 } from "./cd714.ts";

export { cd704, cd710, cd714 };

export const SMALL_DIESELS: readonly ProceduralDesign[] = [
  { id: "veh-cd-704", title: "CD 704 / CSD T 212.1", build: cd704, params: CD704_PARAMS, catalog: RAIL_CATALOG, references: "cd-704" },
  { id: "veh-cd-710", title: "CD 710 Rosnicka", build: cd710, catalog: RAIL_CATALOG, references: "cd-710" },
  { id: "veh-cd-714", title: "CD 714", build: cd714, catalog: RAIL_CATALOG, references: "cd-714" },
];
