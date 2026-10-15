// The Czech mainline diesel locomotives transferred from vlakosimdb: the T 478
// family (CD 749 / 750 / 753 / 754), the CD 781 "Sergej" (M62), the CSD T 679.0
// "Pomeranc", the T 499.0 / CD 759 "Kyklop" and the CD 770 / 771 "Cmelak" hood
// unit. Registered in generate.ts as one family: a design's standalone JS model
// imports its builder by name from this module (docs/models/diesel-locos.md).

import type { ProceduralDesign } from "./design.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { CD750_PARAMS, cd750 } from "./cd750.ts";
import { CD781_PARAMS, cd781 } from "./cd781.ts";
import { csdT6790 } from "./csdT679.ts";
import { csdT499 } from "./csdT499.ts";
import { CD771_PARAMS, cd771 } from "./cd771.ts";

// re-exported: a design's JS bundle imports its build function from this module
export { cd750, cd781, csdT6790, csdT499, cd771 };

export const DIESEL_LOCOS: ProceduralDesign[] = [
  { id: "veh-cd-750", title: "CD 749 / 750 / 753 / 754", build: cd750, params: CD750_PARAMS, catalog: RAIL_CATALOG, references: "cd-750" },
  { id: "veh-cd-781", title: "CD 781 Sergej", build: cd781, params: CD781_PARAMS, catalog: RAIL_CATALOG, references: "cd-781" },
  { id: "veh-csd-t679-0", title: "CSD T 679.0 Pomeranc", build: csdT6790, catalog: RAIL_CATALOG, references: "csd-t679" },
  { id: "veh-csd-t499", title: "CSD T 499.0 / CD 759 Kyklop", build: csdT499, catalog: RAIL_CATALOG, references: "csd-t499" },
  { id: "veh-cd-771", title: "CD 770 / 771 Cmelak", build: cd771, params: CD771_PARAMS, catalog: RAIL_CATALOG, references: "cd-771" },
];
