// The six-axle Czech and the German and Austrian electric locomotives
// transferred from vlakosimdb in one package (docs/models/mainline-electrics.md):
// the CD 180 / 181 / 182, the DNT 184.5, the DB 111, the DR 243 / DB 143 / 112
// and the OBB 1012 and 1040, all built by boxLocoKit.ts. Registered as one
// family in generate.ts; a design's JS bundle imports its build function from
// this module. (The DB 180 is a livery of veh-cd-263, cd163Family.ts.)

import type { ProceduralDesign } from "./design.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { CD181_PARAMS, cd181 } from "./cd181.ts";
import { DNT184_PARAMS, dnt184 } from "./dnt184.ts";
import { DB111_PARAMS, db111 } from "./db111.ts";
import { DR243_PARAMS, dr243 } from "./dr243.ts";
import { obb1012 } from "./obb1012.ts";
import { obb1040 } from "./obb1040.ts";

export { cd181, dnt184, db111, dr243, obb1012, obb1040 };

export const MAINLINE_ELECTRICS: readonly ProceduralDesign[] = [
  { id: "veh-cd-180", title: "CD 180 / 181 / 182", build: cd181, params: CD181_PARAMS, catalog: RAIL_CATALOG, references: "cd-181" },
  { id: "veh-dnt-184-5", title: "DNT 184.5", build: dnt184, params: DNT184_PARAMS, catalog: RAIL_CATALOG, references: "dnt-184" },
  { id: "veh-db-111", title: "DB 111", build: db111, params: DB111_PARAMS, catalog: RAIL_CATALOG, references: "db-111" },
  { id: "veh-dr-243", title: "DR 243 / DB 143 / 112", build: dr243, params: DR243_PARAMS, catalog: RAIL_CATALOG, references: "dr-243" },
  { id: "veh-obb-1012", title: "OBB 1012", build: obb1012, catalog: RAIL_CATALOG, references: "obb-1012" },
  { id: "veh-obb-1040", title: "OBB 1040", build: obb1040, catalog: RAIL_CATALOG, references: "obb-1040" },
];
