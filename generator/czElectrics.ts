// The Czech electric locomotives transferred from vlakosimdb in one package
// (docs/models/cz-electrics.md): the CD 110 / 111 / 210 centre-cab shunter, the
// CD 123 / 130, the CD 140 "bobina" and the CD 169 prototype. Registered as one
// family in generate.ts; a design's JS bundle imports its build function from
// this module. (The CD 242 is a livery of veh-cd-230, cd230.ts.)

import type { ProceduralDesign } from "./design.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { CD110_PARAMS, cd110 } from "./cd110.ts";
import { CD130_PARAMS, cd130 } from "./cd130.ts";
import { cd140 } from "./cd140.ts";
import { cd169 } from "./cd169.ts";

export { cd110, cd130, cd140, cd169 };

export const CZ_ELECTRICS: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-110", title: "CD 110 / 111 / 210", build: cd110, params: CD110_PARAMS, catalog: RAIL_CATALOG, references: "cd-110" },
  { id: "proc-vehicle-cd-130", title: "CD 123 / 130", build: cd130, params: CD130_PARAMS, catalog: RAIL_CATALOG, references: "cd-130" },
  { id: "proc-vehicle-cd-140", title: "CD 140 bobina", build: cd140, catalog: RAIL_CATALOG, references: "cd-140" },
  { id: "proc-vehicle-cd-169", title: "CD 169", build: cd169, catalog: RAIL_CATALOG, references: "cd-169" },
];
