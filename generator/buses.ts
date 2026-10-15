// Every procedural bus, transferred from vlakosimdb's db/motocar: the Karosa
// families (karosa.ts) and the single models. See docs/models/buses.md.

import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { KAROSA_LONG_PARAMS, KAROSA_SHORT_PARAMS, karosaLong, karosaShort } from "./karosa.ts";
import { bus1, karosaRenault12, karosaRenault18, mbCitaro, mbCitaroBlue, mbO345g, solarisUrbino15 } from "./cityBuses.ts";

/** The game-catalog fields of every bus. */
export const BUS_CATALOG: CatalogFields = {
  category: "Road vehicles",
  group: "bus",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** The Karosa families (karosa.ts, the module their JS bundles start from). The ids are stored in saved maps. */
export const KAROSA_DESIGNS: ProceduralDesign[] = [
  { id: "veh-karosa-short", title: "Karosa Short", build: karosaShort, params: KAROSA_SHORT_PARAMS, catalog: BUS_CATALOG, references: "karosa-short" },
  { id: "veh-karosa-long", title: "Karosa Long", build: karosaLong, params: KAROSA_LONG_PARAMS, catalog: BUS_CATALOG, references: "karosa-long" },
];

/** The single buses (cityBuses.ts, the module their JS bundles start from). */
export const CITY_BUS_DESIGNS: ProceduralDesign[] = [
  { id: "veh-karosa-renault-citybus-12m", title: "Karosa Renault City Bus 12M", build: karosaRenault12, catalog: BUS_CATALOG, references: "karosa-renault-citybus-12m" },
  { id: "veh-karosa-renault-citybus-18m", title: "Karosa Renault City Bus 18M", build: karosaRenault18, catalog: BUS_CATALOG, references: "karosa-renault-citybus-18m" },
  { id: "veh-mb-citaro", title: "Mercedes-Benz Citaro", build: mbCitaro, catalog: BUS_CATALOG, references: "mb-citaro" },
  { id: "veh-mb-citaro-blue", title: "Mercedes-Benz Citaro (blue)", build: mbCitaroBlue, catalog: BUS_CATALOG, references: "mb-citaro" },
  { id: "veh-mb-o345-g", title: "Mercedes-Benz O 345 G", build: mbO345g, catalog: BUS_CATALOG, references: "mb-o345-g" },
  { id: "veh-solaris-urbino-15", title: "Solaris Urbino 15", build: solarisUrbino15, catalog: BUS_CATALOG, references: "solaris-urbino-15" },
  { id: "veh-bus-1", title: "Bus 1", build: bus1, catalog: BUS_CATALOG, references: "bus-1" },
];

/** Every bus, by catalog id. */
export const BUS_DESIGNS: readonly ProceduralDesign[] = [...KAROSA_DESIGNS, ...CITY_BUS_DESIGNS];
