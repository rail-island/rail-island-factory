// Every procedural bus, transferred from vlakosimdb's db/motocar: the Karosa
// families (karosa.ts) and the single models. See docs/models/buses.md.

import type { CatalogFields, GameProperties, ProceduralDesign } from "./design.ts";
import { KAROSA_LONG_PARAMS, KAROSA_SHORT_PARAMS, karosaLong, karosaLongLod, karosaShort, karosaShortLod } from "./karosa.ts";
import { bus1, bus1Lod, karosaRenault12, karosaRenault12Lod, karosaRenault18, karosaRenault18Lod, mbCitaro, mbCitaroBlue, mbCitaroBlueLod, mbCitaroLod, mbO345g, mbO345gLod, solarisUrbino15, solarisUrbino15Lod } from "./cityBuses.ts";

/** The game-catalog fields of every bus. */
export const BUS_CATALOG: CatalogFields = {
  category: "Road vehicles",
  group: "bus",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const KAROSA_SHORT_GAME: GameProperties = {
  weight: 10,
  power: 100,
  maxspeed: 50,
  accel: null,
  variants: [
    { params: { variant: "b951e" }, weight: 8, power: 150 },
    { params: { variant: "c734" }, maxspeed: 80 },
    { params: { variant: "lc735" }, maxspeed: 100 },
  ],
};

/** The Karosa families (karosa.ts, the module their JS bundles start from). The ids are stored in saved maps. */
export const KAROSA_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-karosa-short", game: KAROSA_SHORT_GAME, title: "Karosa Short", build: karosaShort, buildLod: karosaShortLod, params: KAROSA_SHORT_PARAMS, catalog: BUS_CATALOG, references: "karosa-short" },
  { id: "proc-vehicle-karosa-long", game: { weight: 15, power: 120, maxspeed: 50, accel: null }, title: "Karosa Long", build: karosaLong, buildLod: karosaLongLod, params: KAROSA_LONG_PARAMS, catalog: BUS_CATALOG, references: "karosa-long" },
];

/** The single buses (cityBuses.ts, the module their JS bundles start from). */
export const CITY_BUS_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-karosa-renault-citybus-12m", game: { weight: 10, power: 100, maxspeed: 50, accel: null }, title: "Karosa Renault City Bus 12M", build: karosaRenault12, buildLod: karosaRenault12Lod, catalog: BUS_CATALOG, references: "karosa-renault-citybus-12m" },
  { id: "proc-vehicle-karosa-renault-citybus-18m", game: { weight: 15, power: 120, maxspeed: 50, accel: null }, title: "Karosa Renault City Bus 18M", build: karosaRenault18, buildLod: karosaRenault18Lod, catalog: BUS_CATALOG, references: "karosa-renault-citybus-18m" },
  { id: "proc-vehicle-mb-citaro", game: { weight: 10, power: 100, maxspeed: 50, accel: null }, title: "Mercedes-Benz Citaro", build: mbCitaro, buildLod: mbCitaroLod, catalog: BUS_CATALOG, references: "mb-citaro" },
  { id: "proc-vehicle-mb-citaro-blue", game: { weight: 10, power: 100, maxspeed: 50, accel: null }, title: "Mercedes-Benz Citaro (blue)", build: mbCitaroBlue, buildLod: mbCitaroBlueLod, catalog: BUS_CATALOG, references: "mb-citaro" },
  { id: "proc-vehicle-mb-o345-g", game: { weight: 15, power: 120, maxspeed: 70, accel: null }, title: "Mercedes-Benz O 345 G", build: mbO345g, buildLod: mbO345gLod, catalog: BUS_CATALOG, references: "mb-o345-g" },
  { id: "proc-vehicle-solaris-urbino-15", game: { weight: 13.5, power: 191, maxspeed: 80, accel: null }, title: "Solaris Urbino 15", build: solarisUrbino15, buildLod: solarisUrbino15Lod, catalog: BUS_CATALOG, references: "solaris-urbino-15" },
  { id: "proc-vehicle-bus-1", game: { weight: 12, power: 150, maxspeed: 100, accel: null }, title: "Bus 1", build: bus1, buildLod: bus1Lod, catalog: BUS_CATALOG, references: "bus-1" },
];

/** Every bus, by catalog id. */
export const BUS_DESIGNS: readonly ProceduralDesign[] = [...KAROSA_DESIGNS, ...CITY_BUS_DESIGNS];
