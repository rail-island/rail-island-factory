// Every procedural bus, transferred from vlakosimdb's db/motocar: the Karosa
// families (karosa.ts) and the single models. See docs/models/buses.md.

import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { KAROSA_LONG_PARAMS, KAROSA_SHORT_PARAMS, karosaLong, karosaShort } from "./karosa.ts";

/** The game-catalog fields of every bus. */
export const BUS_CATALOG: CatalogFields = {
  category: "Road vehicles",
  group: "bus",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** The buses, by catalog id. The ids are stored in saved maps. */
export const BUS_DESIGNS: ProceduralDesign[] = [
  { id: "veh-karosa-short", title: "Karosa Short", build: karosaShort, params: KAROSA_SHORT_PARAMS, catalog: BUS_CATALOG, references: "karosa-short" },
  { id: "veh-karosa-long", title: "Karosa Long", build: karosaLong, params: KAROSA_LONG_PARAMS, catalog: BUS_CATALOG, references: "karosa-long" },
];
