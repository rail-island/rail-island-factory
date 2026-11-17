// The train parade: a hand-picked list of whole trains whose side views
// railisland.com drives across its landing page (docs/site/train-parade.md).
//
// A train is its cars, nose first; a car is a confirmed road or rail model with
// parameter values, turned round or not. A train either lists its cars or names
// one of its model's OpenTTD formations (generator/openttdTable.ts), which stands
// for that formation's cars. writeParade.ts renders every distinct car at build
// time into export/parade/img/ and writes export/parade.json; nothing here is
// committed output.
//
// This module is pure: no rendering, no file system. Everything a train needs
// from the rest of the factory is passed in (`TrainContext`), so the tests can
// check it with small fixtures.

import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "./collector.ts";
import type { OpenttdProperties, ParamSpec, ParamValues, Ropeway } from "./design.ts";
import { TYPE_META as CABLE_STATION_TYPES } from "./sets/cableCarStation.ts";

/** One car as the list writes it. */
export interface TrainCarSpec {
  model: string;
  /** Parameter values; a value equal to the default may be left out. */
  params?: ParamValues;
  /** True for a car running backwards (the rear power car of a TGV). */
  turned?: boolean;
  /**
   * An aircraft drawn this many times its size (> 1): the light plane and the
   * helicopters, which at the air view's scale would be a few pixels tall.
   */
  zoom?: number;
}

/** A model's named OpenTTD formation (generator/openttdTable.ts), standing for its cars. */
export interface FormationRef {
  model: string;
  name: string;
}

/**
 * One train as the list writes it: its cars, or a model's named OpenTTD
 * formation. A car list may also hold a formation, which stands for its cars
 * there (a steam locomotive "with tender", then the coaches).
 */
export type TrainSpec =
  | { id: string; category?: TrainCategory; cars: (TrainCarSpec | { formation: FormationRef })[]; rope?: RopeSpec }
  | { id: string; category?: TrainCategory; formation: FormationRef; rope?: RopeSpec };

/**
 * A cable car line's chain: the station type standing at both ends of the strip
 * (generator/sets/cableCarStation.ts) and, for circulating cabins, how many run
 * and how far apart. A jig-back cabin (an aerial tramway's) runs alone. The chain
 * lists its one cabin as its only car.
 */
export interface RopeSpec {
  station: string;
  /** Cabins of a circulating line (default ROPE_CABINS); a jig-back line runs one. */
  cabins?: number;
}

/** Cabins a circulating line runs by default, and metres from one cabin's nose to the next's. */
export const ROPE_CABINS = 4;
export const ROPE_SPACING_M = 30;

/**
 * What kind of chain a train is, for the website's play order (it spreads the
 * kinds evenly, never two of one kind in a row) and the overview page's sorting.
 * Derived from the lead vehicle (`trainCategory`) unless the list states one.
 */
export const TRAIN_CATEGORIES = {
  electricUnit: "Electric unit",
  dieselUnit: "Diesel unit",
  electricLoco: "Electric locomotive + train",
  dieselLoco: "Diesel locomotive + train",
  steamLoco: "Steam locomotive + train",
  metro: "Metro",
  tram: "Tram",
  bus: "Bus",
  truck: "Truck",
  horse: "Horse-drawn",
  cableCar: "Cable car",
  ship: "Ship",
  aircraft: "Aircraft",
} as const;
export type TrainCategory = keyof typeof TRAIN_CATEGORIES;

/** A train's category from its lead vehicle's catalog fields. */
export function trainCategory(lead: { category: string; group?: string; traction?: string }): TrainCategory {
  if (lead.category === "Ships") return "ship";
  if (lead.category === "Aircraft") return "aircraft";
  if (lead.category === "Cable car") return "cableCar";
  if (lead.traction === "animal") return "horse";
  if (lead.category === "Road vehicles") return lead.group === "truck" ? "truck" : "bus";
  switch (lead.group) {
    case "tram":
      return "tram";
    case "metro":
      return "metro";
    case "unit":
      return lead.traction === "diesel" ? "dieselUnit" : "electricUnit";
    default:
      return lead.traction === "steam" ? "steamLoco" : lead.traction === "diesel" ? "dieselLoco" : "electricLoco";
  }
}

/**
 * How fast a chain of each category runs across railisland.com, in metres of the
 * model per second (the site multiplies by its pixels per metre). A fixed table,
 * not the vehicles' own top speeds: the strip is a few hundred pixels wide, and
 * every chain must stay on screen long enough to be seen. A kind drawn at a smaller
 * scale (PARADE_VIEWS: ships, aircraft, cable cars) runs proportionally more metres
 * a second, so its speed on screen is like a train's: a ship at 70 m/s crosses the
 * strip about as fast as a train at 10.
 */
export const PARADE_SPEED_MPS: Record<TrainCategory, number> = {
  electricUnit: 22,
  dieselUnit: 20,
  electricLoco: 20,
  dieselLoco: 17,
  steamLoco: 16,
  metro: 18,
  tram: 12,
  bus: 13,
  truck: 14,
  horse: 6,
  cableCar: 16,
  ship: 70,
  aircraft: 150,
};

/**
 * The height of the wire a chain runs under, metres over the railhead, or
 * undefined for none: the game's contact wire over an electric railway vehicle,
 * its trolley wire over an electric tram. Read from the first powered car (the
 * first that states a traction); a horse or cable tram, a metro (third rail), a
 * diesel, a steam engine and every road vehicle run without one.
 */
export function trainWire(cars: readonly Pick<TrainModelInfo, "category" | "group" | "traction">[]): number | undefined {
  const powered = cars.find((c) => c.traction !== undefined && c.traction !== "none");
  if (!powered || powered.category !== "Rail vehicles" || powered.traction !== "electric") return undefined;
  if (powered.group === "metro") return undefined;
  return powered.group === "tram" ? TRAM_COLLECTOR_TOP : RAIL_COLLECTOR_TOP;
}

const HORSES_2: ParamValues = { animal: "horse", team: "2" };

/**
 * The parade's trains. Ids are the trains' names in parade.json (and the value of railisland.com's `?parade=`) (stable, but
 * nothing stores them). Formations come from openttdTable.ts; the hand-composed
 * trains are locomotives with the factory's own coaches and wagons.
 */
export const TRAIN_PARADE: readonly TrainSpec[] = [
  // the whole train, not its OpenTTD formation: the trailers share Jacobs bogies,
  // which only the full-train model draws once per joint (drawn in sections)
  { id: "tgv-duplex", cars: [{ model: "proc-vehicle-tgv-duplex", params: { unit: "train", cars: "8" } }] },
  { id: "ice-1", formation: { model: "proc-vehicle-ice-1", name: "power cars, 6 coaches" } },
  { id: "shinkansen-0", formation: { model: "proc-vehicle-shinkansen-0", name: "8 cars" } },
  { id: "cd-680", formation: { model: "proc-vehicle-cd-680", name: "7 cars" } },
  { id: "amtrak-acela", formation: { model: "proc-vehicle-amtrak-acela", name: "8 cars" } },
  { id: "jr-e235", formation: { model: "proc-vehicle-jr-e235", name: "6 cars" } },
  {
    id: "cd-150-express",
    cars: [
      { model: "proc-vehicle-cd-150", params: { livery: "cdBlue" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bcc" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "wrrm" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bcc" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bnb" } },
    ],
  },
  {
    id: "csd-498-1-express",
    cars: [
      { model: "proc-vehicle-csd-498-1" },
      { model: "proc-vehicle-csd-498-1", params: { unit: "tender" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classA" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classB" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classB" } },
    ],
  },
  {
    id: "us-freight",
    cars: [
      { model: "proc-vehicle-emd-sd40-2", params: { livery: "burlingtonNorthern" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "boxcarRed" } },
      { model: "proc-vehicle-us-well-car", params: { cargo: "double" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "railbox" } },
      { model: "proc-vehicle-us-well-car", params: { cargo: "single" } },
      { model: "proc-vehicle-us-caboose", params: { livery: "santaFe" } },
    ],
  },
  {
    id: "vectron-double-deck",
    cars: [
      { model: "proc-vehicle-vectron", params: { livery: "cdEurocity" } },
      { model: "proc-vehicle-bmo-double-deck-coach", params: { livery: "cdBlue" } },
      { model: "proc-vehicle-bmo-double-deck-coach", params: { livery: "cdBlue" } },
      { model: "proc-vehicle-bmo-double-deck-coach", params: { livery: "cdBlue" } },
    ],
  },
  // steam: every locomotive and tender runs with its rods and valve gear moving
  {
    id: "lner-a4-express",
    cars: [
      { formation: { model: "proc-vehicle-lner-a4", name: "with tender" } },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
    ],
  },
  {
    id: "big-boy-freight",
    cars: [
      { formation: { model: "proc-vehicle-up-big-boy", name: "with tender" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "boxcarRed" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "boxcarRed" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "railbox" } },
      { model: "proc-vehicle-us-caboose", params: { livery: "unionPacific" } },
    ],
  },
  {
    id: "american-440",
    cars: [
      { formation: { model: "proc-vehicle-american-440", name: "with tender" } },
      { model: "proc-vehicle-us-boxcar", params: { livery: "boxcarRed" } },
      { model: "proc-vehicle-us-caboose", params: { livery: "santaFe" } },
    ],
  },
  {
    id: "jnr-c62-blue-train",
    cars: [
      { formation: { model: "proc-vehicle-jnr-c62", name: "with tender" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "sleeper" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "dining" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "sleeper" } },
    ],
  },
  {
    id: "cr-qj-coal",
    cars: [
      { formation: { model: "proc-vehicle-cr-qj", name: "with tender" } },
      { model: "proc-vehicle-cr-c70-wagon" },
      { model: "proc-vehicle-cr-c70-wagon" },
      { model: "proc-vehicle-cr-c70-wagon" },
      { model: "proc-vehicle-cr-c70-wagon" },
    ],
  },
  { id: "shinkansen-e5", formation: { model: "proc-vehicle-shinkansen-e5", name: "8 cars" } },
  { id: "db-ice3", formation: { model: "proc-vehicle-db-ice3", name: "8 cars" } },
  { id: "pioneer-zephyr", formation: { model: "proc-vehicle-pioneer-zephyr", name: "3 cars" } },
  { id: "metro-81-71", formation: { model: "proc-vehicle-metro-81-71", name: "5 cars" } },
  { id: "lu-1938-stock", formation: { model: "proc-vehicle-lu-1938-stock", name: "7 cars" } },
  // trams
  { id: "tatra-t3-pair", cars: [{ model: "proc-vehicle-tatra-t3" }, { model: "proc-vehicle-tatra-t3" }] },
  { id: "siemens-combino", cars: [{ model: "proc-vehicle-siemens-combino", params: { length: "7", livery: "amsterdam" } }] },
  { id: "pcc-streamliner", cars: [{ model: "proc-vehicle-pcc-streamliner", params: { livery: "toronto" } }] },
  { id: "hong-kong-tram", cars: [{ model: "proc-vehicle-hong-kong-tram" }] },
  // buses, on the road
  { id: "ikarus-280", cars: [{ model: "proc-vehicle-ikarus-280", params: { livery: "bkv" } }] },
  { id: "new-routemaster", cars: [{ model: "proc-vehicle-new-routemaster" }] },
  { id: "curitiba-biarticulado", cars: [{ model: "proc-vehicle-curitiba-biarticulado" }] },
  // horse-drawn: the team walks with the vehicle
  { id: "horse-tram", cars: [{ model: "proc-vehicle-animal-tram-double-deck", params: HORSES_2 }] },
  {
    id: "budweis-horse-railway",
    cars: [
      { model: "proc-vehicle-animal-rail-budweis-coach", params: HORSES_2 },
      { model: "proc-vehicle-animal-rail-budweis-wagon", params: { team: "none" } },
    ],
  },
  { id: "stagecoach", cars: [{ model: "proc-vehicle-animal-bus-stagecoach", params: HORSES_2 }] },
  // ---- grown from thirty to a hundred (docs/specs/2026-11-16-parade-scenery-catenary.md):
  // electric units
  { id: "br-class-390", formation: { model: "proc-vehicle-br-class-390", name: "8 cars" } },
  { id: "eurostar-373", formation: { model: "proc-vehicle-eurostar-373", name: "8 cars" } },
  { id: "sbb-giruno", formation: { model: "proc-vehicle-sbb-giruno", name: "8 cars" } },
  { id: "ns-virm", formation: { model: "proc-vehicle-ns-virm", name: "6 cars" } },
  { id: "cd-471", formation: { model: "proc-vehicle-cd-471", name: "3 cars" } },
  { id: "shinkansen-n700s", formation: { model: "proc-vehicle-shinkansen-n700s", name: "8 cars" } },
  { id: "cr-cr400af", formation: { model: "proc-vehicle-cr-cr400af", name: "8 cars" } },
  { id: "db-ice4", formation: { model: "proc-vehicle-db-ice4", name: "8 cars" } },
  { id: "jnr-485", formation: { model: "proc-vehicle-jnr-485", name: "6 cars" } },
  { id: "odakyu-gse", formation: { model: "proc-vehicle-odakyu-gse", name: "6 cars" } },
  { id: "ns-mat54", formation: { model: "proc-vehicle-ns-mat54", name: "4 cars" } },
  { id: "sbb-rae-tee", formation: { model: "proc-vehicle-sbb-rae-tee", name: "6 cars" } },
  { id: "ir-vande-bharat", formation: { model: "proc-vehicle-ir-vande-bharat", name: "8 cars" } },
  { id: "tgv-pse", formation: { model: "proc-vehicle-tgv", name: "power cars, 6 trailers" } },
  // electric locomotives: passenger
  {
    id: "sbb-re460-ic2000",
    cars: [
      { model: "proc-vehicle-sbb-re460" },
      { model: "proc-vehicle-sbb-ic2000", params: { unit: "a" } },
      { model: "proc-vehicle-sbb-ic2000", params: { unit: "b" } },
      { model: "proc-vehicle-sbb-ic2000", params: { unit: "b" } },
    ],
  },
  {
    id: "db-103-tee",
    cars: [
      { model: "proc-vehicle-db-103", params: { livery: "tee" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "avmz", livery: "tee" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "avmz", livery: "tee" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "bpmz", livery: "tee" } },
    ],
  },
  {
    id: "ir-wap7-rajdhani",
    cars: [
      { model: "proc-vehicle-ir-wap7" },
      { model: "proc-vehicle-ir-lhb-coach", params: { unit: "ac3", livery: "rajdhani" } },
      { model: "proc-vehicle-ir-lhb-coach", params: { unit: "ac3", livery: "rajdhani" } },
      { model: "proc-vehicle-ir-lhb-coach", params: { unit: "chairCar", livery: "rajdhani" } },
    ],
  },
  {
    id: "rhb-glacier-express",
    cars: [
      { model: "proc-vehicle-rhb-ge443" },
      { model: "proc-vehicle-glacier-express", params: { unit: "first" } },
      { model: "proc-vehicle-glacier-express", params: { unit: "second" } },
      { model: "proc-vehicle-glacier-express", params: { unit: "second" } },
    ],
  },
  {
    id: "cd-163-regiojet",
    cars: [
      { model: "proc-vehicle-cd-163", params: { livery: "regiojet" } },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "firstClass", operator: "regiojet" } },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "secondClass", operator: "regiojet" } },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "secondClass", operator: "regiojet" } },
    ],
  },
  {
    id: "ns-1700-icr",
    cars: [
      { model: "proc-vehicle-ns-1700" },
      { model: "proc-vehicle-ns-icr-coach", params: { unit: "a" } },
      { model: "proc-vehicle-ns-icr-coach", params: { unit: "b" } },
      { model: "proc-vehicle-ns-icr-coach", params: { unit: "b" } },
    ],
  },
  {
    id: "obb-1012-uic-z",
    cars: [
      { model: "proc-vehicle-obb-1012" },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "firstClass", operator: "obb" } },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "restaurant", operator: "obb" } },
      { model: "proc-vehicle-uic-z-coach", params: { variant: "secondClass", operator: "obb" } },
    ],
  },
  {
    id: "db-111-double-deck",
    cars: [{ model: "proc-vehicle-db-111" }, { formation: { model: "proc-vehicle-db-dosto", name: "3 coaches, driving trailer" } }],
  },
  {
    id: "db-143-s-bahn",
    cars: [
      { model: "proc-vehicle-dr-243", params: { livery: "db143" } },
      { formation: { model: "proc-vehicle-dr-sbahn-berlin", name: "4 coaches, driving trailer" } },
    ],
  },
  // electric locomotives: freight
  {
    id: "sbb-krokodil-freight",
    cars: [
      { model: "proc-vehicle-sbb-ce68" },
      { model: "proc-vehicle-habis-sliding-wall-wagon" },
      { model: "proc-vehicle-eas-open-wagon", params: { cargo: "wood" } },
      { model: "proc-vehicle-rah-tank-wagon" },
      { model: "proc-vehicle-habis-sliding-wall-wagon", params: { livery: "tw2" } },
    ],
  },
  {
    id: "prr-gg1-freight",
    cars: [
      { model: "proc-vehicle-prr-gg1", params: { livery: "tuscan" } },
      { model: "proc-vehicle-us-boxcar" },
      { model: "proc-vehicle-us-boxcar", params: { livery: "railbox" } },
      { model: "proc-vehicle-us-caboose", params: { livery: "unionPacific" } },
    ],
  },
  {
    id: "cd-230-hoppers",
    cars: [
      { model: "proc-vehicle-cd-230" },
      { model: "proc-vehicle-falls-hopper-wagon" },
      { model: "proc-vehicle-falls-hopper-wagon" },
      { model: "proc-vehicle-falls-hopper-wagon", params: { livery: "viamont" } },
      { model: "proc-vehicle-faccs-hopper-wagon" },
    ],
  },
  {
    id: "jnr-ef66-containers",
    cars: [
      { model: "proc-vehicle-jnr-ef66", params: { livery: "jrFreight" } },
      { model: "proc-vehicle-sqns-container-wagon", params: { cargo: "maersk" } },
      { model: "proc-vehicle-sqns-container-wagon", params: { cargo: "maersk" } },
      { model: "proc-vehicle-sqns-container-wagon", params: { cargo: "maersk" } },
    ],
  },
  {
    id: "cr-hxd1-coal",
    cars: [
      { model: "proc-vehicle-cr-hxd1" },
      { model: "proc-vehicle-cr-c70-wagon" },
      { model: "proc-vehicle-cr-c70-wagon", params: { unit: "covered" } },
      { model: "proc-vehicle-cr-c70-wagon" },
      { model: "proc-vehicle-cr-c70-wagon" },
    ],
  },
  // diesel locomotives: passenger
  {
    id: "deltic-express",
    cars: [
      { model: "proc-vehicle-br-class-55" },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach", params: { unit: "bsk" } },
    ],
  },
  {
    id: "db-218-intercity",
    cars: [
      { model: "proc-vehicle-db-218", params: { livery: "orientRed" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "avmz", livery: "intercity" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "bpmz", livery: "intercity" } },
      { model: "proc-vehicle-db-ic-coach", params: { unit: "bpmz", livery: "intercity" } },
    ],
  },
  {
    id: "genesis-superliner",
    cars: [
      { model: "proc-vehicle-ge-p42dc" },
      { model: "proc-vehicle-amtrak-superliner", params: { unit: "sleeper" } },
      { model: "proc-vehicle-amtrak-superliner" },
      { model: "proc-vehicle-amtrak-superliner" },
    ],
  },
  {
    id: "cd-754-brejlovec",
    cars: [
      { model: "proc-vehicle-cd-750", params: { livery: "cd754" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bcc" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bcc" } },
      { model: "proc-vehicle-cd-y-coach", params: { variant: "bnb" } },
    ],
  },
  {
    id: "cr-df4-express",
    cars: [
      { model: "proc-vehicle-cr-df4" },
      { model: "proc-vehicle-cr-25t-coach", params: { unit: "hardSeat", livery: "green25b" } },
      { model: "proc-vehicle-cr-25t-coach", params: { unit: "hardSeat", livery: "green25b" } },
      { model: "proc-vehicle-cr-25t-coach", params: { livery: "green25b" } },
    ],
  },
  {
    id: "ir-wdm2-mail",
    cars: [
      { model: "proc-vehicle-ir-wdm2" },
      { model: "proc-vehicle-ir-icf-coach", params: { unit: "general" } },
      { model: "proc-vehicle-ir-icf-coach" },
      { model: "proc-vehicle-ir-icf-coach" },
    ],
  },
  {
    id: "dd51-hokutosei",
    cars: [
      { model: "proc-vehicle-jnr-dd51", params: { livery: "hokutosei" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "sleeper" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "dining" } },
      { model: "proc-vehicle-blue-train-24", params: { unit: "sleeper" } },
    ],
  },
  // diesel locomotives: freight
  {
    id: "class-66-coal",
    cars: [
      { model: "proc-vehicle-br-class-66" },
      { model: "proc-vehicle-ua-open-wagon", params: { cargo: "coal" } },
      { model: "proc-vehicle-ua-open-wagon", params: { cargo: "coal" } },
      { model: "proc-vehicle-raj-hopper-wagon" },
      { model: "proc-vehicle-raj-hopper-wagon" },
    ],
  },
  {
    id: "emd-f7-freight",
    cars: [
      { formation: { model: "proc-vehicle-emd-f7", name: "A-B" } },
      { model: "proc-vehicle-us-boxcar" },
      { model: "proc-vehicle-us-boxcar" },
      { model: "proc-vehicle-us-caboose" },
    ],
  },
  {
    id: "es44ac-double-stack",
    cars: [
      { model: "proc-vehicle-ge-es44ac" },
      { model: "proc-vehicle-us-well-car", params: { cargo: "double" } },
      { model: "proc-vehicle-us-well-car", params: { cargo: "double" } },
      { model: "proc-vehicle-us-well-car", params: { cargo: "double" } },
    ],
  },
  {
    id: "cd-742-hoppers",
    cars: [
      { model: "proc-vehicle-cd-742" },
      { model: "proc-vehicle-wap-hopper-wagon" },
      { model: "proc-vehicle-wap-hopper-wagon" },
      { model: "proc-vehicle-hadgs-hopper-wagon" },
    ],
  },
  // diesel units
  { id: "br-hst", formation: { model: "proc-vehicle-br-hst", name: "8 cars" } },
  { id: "db-628", formation: { model: "proc-vehicle-db-628", name: "with n-coaches" } },
  { id: "class-142-pacer", formation: { model: "proc-vehicle-br-class-142", name: "2 cars" } },
  { id: "fliegender-hamburger", formation: { model: "proc-vehicle-drg-svt877", name: "2 cars" } },
  { id: "mav-mdmot", formation: { model: "proc-vehicle-mav-mdmot", name: "4 cars" } },
  { id: "csd-m131-hurvinek", formation: { model: "proc-vehicle-csd-m131", name: "with trailer" } },
  { id: "jr-kiha40", cars: [{ model: "proc-vehicle-jr-kiha40" }] },
  // steam
  {
    id: "drg-01-express",
    cars: [
      { formation: { model: "proc-vehicle-drg-01", name: "with tender" } },
      { model: "proc-vehicle-csd-be31" },
      { model: "proc-vehicle-csd-be31" },
      { model: "proc-vehicle-csd-bi20" },
    ],
  },
  {
    id: "gwr-castle",
    cars: [
      { formation: { model: "proc-vehicle-gwr-castle", name: "with tender" } },
      { model: "proc-vehicle-br-mk1-coach", params: { livery: "maroon" } },
      { model: "proc-vehicle-br-mk1-coach", params: { livery: "maroon" } },
      { model: "proc-vehicle-br-mk1-coach", params: { unit: "bsk", livery: "maroon" } },
    ],
  },
  {
    id: "lner-a3",
    cars: [
      { formation: { model: "proc-vehicle-lner-a3", name: "with tender" } },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
      { model: "proc-vehicle-br-mk1-coach" },
    ],
  },
  {
    id: "csd-475-1",
    cars: [
      { formation: { model: "proc-vehicle-csd-475-1", name: "with tender" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classB" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classB" } },
      { model: "proc-vehicle-csd-classic-green-coach", params: { variant: "classB" } },
    ],
  },
  {
    id: "ir-wp-express",
    cars: [
      { formation: { model: "proc-vehicle-ir-wp", name: "with tender" } },
      { model: "proc-vehicle-ir-icf-coach", params: { livery: "maroon" } },
      { model: "proc-vehicle-ir-icf-coach", params: { unit: "general", livery: "maroon" } },
      { model: "proc-vehicle-ir-icf-coach", params: { unit: "general", livery: "maroon" } },
    ],
  },
  { id: "rocket", formation: { model: "proc-vehicle-rocket", name: "with tender" } },
  {
    id: "nyc-hudson-freight",
    cars: [
      { formation: { model: "proc-vehicle-nyc-hudson", name: "with tender" } },
      { model: "proc-vehicle-us-boxcar" },
      { model: "proc-vehicle-us-boxcar" },
      { model: "proc-vehicle-us-caboose" },
    ],
  },
  {
    id: "dr-52-freight",
    cars: [
      { formation: { model: "proc-vehicle-dr-52", name: "with tender" } },
      { model: "proc-vehicle-eas-open-wagon", params: { cargo: "wood" } },
      { model: "proc-vehicle-ua-open-wagon", params: { cargo: "coal" } },
      { model: "proc-vehicle-ua-open-wagon", params: { cargo: "sand" } },
      { model: "proc-vehicle-legacy-covered-wagon" },
    ],
  },
  // metro
  {
    id: "nyc-r160",
    cars: [
      { model: "proc-vehicle-nyc-r160" },
      { model: "proc-vehicle-nyc-r160", params: { unit: "trailer" } },
      { model: "proc-vehicle-nyc-r160", params: { unit: "trailer" } },
      { model: "proc-vehicle-nyc-r160", turned: true },
    ],
  },
  // trams
  { id: "skoda-15t", cars: [{ model: "proc-vehicle-skoda-15t" }] },
  { id: "tatra-kt8", cars: [{ model: "proc-vehicle-tatra-kt8" }] },
  { id: "alstom-citadis", cars: [{ model: "proc-vehicle-alstom-citadis", params: { livery: "dublin" } }] },
  { id: "blackpool-balloon", cars: [{ model: "proc-vehicle-blackpool-balloon" }] },
  // buses
  { id: "skoda-706-rto", cars: [{ model: "proc-vehicle-skoda-706-rto" }] },
  { id: "karosa-sm11", cars: [{ model: "proc-vehicle-karosa-sm11" }] },
  { id: "bristol-lodekka", cars: [{ model: "proc-vehicle-bristol-lodekka" }] },
  { id: "mb-o345-g", cars: [{ model: "proc-vehicle-mb-o345-g" }] },
  { id: "neoplan-skyliner", cars: [{ model: "proc-vehicle-neoplan-skyliner" }] },
  { id: "gm-scenicruiser", cars: [{ model: "proc-vehicle-gm-scenicruiser" }] },
  // horse-drawn
  { id: "paris-omnibus", cars: [{ model: "proc-vehicle-animal-bus-paris-omnibus", params: HORSES_2 }] },
  // trucks
  { id: "tatra-815-tipper", cars: [{ model: "proc-vehicle-tatra-815-tipper" }] },
  { id: "praga-rv", cars: [{ model: "proc-vehicle-praga-rv" }] },
  { id: "cistern-semi-truck", cars: [{ model: "proc-vehicle-cistern-semi-truck" }] },
  { id: "mercedes-atego", cars: [{ model: "proc-vehicle-mercedes-atego-1224" }] },
  // cable car lines, one per station type: the stations stand at both ends of the strip
  { id: "omega-gondola", cars: [{ model: "proc-vehicle-doppelmayr-omega" }], rope: { station: "open_gantry" } },
  { id: "classic-cabin", cars: [{ model: "proc-vehicle-cabin-classic" }], rope: { station: "alpine_chalet" } },
  { id: "peak-2-peak", cars: [{ model: "proc-vehicle-peak-2-peak" }], rope: { station: "glass_modern", cabins: 3 } },
  { id: "sugarloaf-bondinho", cars: [{ model: "proc-vehicle-sugarloaf-bondinho" }], rope: { station: "concrete_drive" } },
  // ships, on the water (drawn above their waterline)
  { id: "harbour-tug", cars: [{ model: "proc-vehicle-ship-harbour-tug" }] },
  { id: "swiss-paddle", cars: [{ model: "proc-vehicle-ship-swiss-paddle" }] },
  { id: "elbe-paddle", cars: [{ model: "proc-vehicle-ship-elbe-paddle" }] },
  { id: "cutty-sark", cars: [{ model: "proc-vehicle-ship-cutty-sark" }] },
  { id: "ss-great-britain", cars: [{ model: "proc-vehicle-ship-ss-great-britain" }] },
  { id: "feeder-container", cars: [{ model: "proc-vehicle-ship-feeder-container" }] },
  { id: "product-tanker", cars: [{ model: "proc-vehicle-ship-product-tanker" }] },
  { id: "ocean-liner", cars: [{ model: "proc-vehicle-ocean-liner" }] },
  // aircraft, in level flight with the gear up
  // the light plane and the helicopter drawn larger, or they would be a few pixels tall
  { id: "aero-a10", cars: [{ model: "proc-vehicle-aero-a10", zoom: 2.5 }] },
  { id: "airbus-h145", cars: [{ model: "proc-vehicle-airbus-h145", zoom: 2.5 }] },
  { id: "boeing-737", cars: [{ model: "proc-vehicle-boeing-737", params: { livery: "ryanair" } }] },
  { id: "airbus-beluga", cars: [{ model: "proc-vehicle-airbus-beluga" }] },
  { id: "boeing-747", cars: [{ model: "proc-vehicle-boeing-747", params: { livery: "klm" } }] },
  { id: "airbus-a380", cars: [{ model: "proc-vehicle-airbus-a380", params: { livery: "emirates" } }] },
];

/** What a train needs to know about one model. */
export interface TrainModelInfo {
  /** The catalog category ("Rail vehicles", "Road vehicles"): only side-view categories may run. */
  category: string;
  /** The catalog group ("unit", "loco", "tram", ...) and traction, for the train's category. */
  group?: string;
  traction?: string;
  params?: readonly ParamSpec[];
  openttd?: OpenttdProperties;
}

/** The factory as the parade sees it. */
export interface TrainContext {
  model(id: string): TrainModelInfo | undefined;
  /** True when the model is confirmed (generator/catalogModels.json), not a workshop draft. */
  confirmed(id: string): boolean;
  isSideView(category: string): boolean;
  /** A cable car cabin's ropeway (circulating or jig-back); undefined for any other model. */
  ropeway?(id: string): Ropeway | undefined;
}

/** The catalog categories the parade draws besides the side-view ones, each on its own ground. */
export const CRAFT_GROUNDS: Readonly<Record<string, Ground>> = { Ships: "water", Aircraft: "air", "Cable car": "rope" };

/** One car resolved: its model, its non-default values (sorted by name), and turned. */
export interface TrainCar {
  model: string;
  params: ParamValues;
  turned: boolean;
  /** A cable car cabin: the station type of its line, whose rope it hangs from (the rope's height). */
  station?: string;
  /** An aircraft drawn larger than its kind's scale (TrainCarSpec.zoom). */
  zoom?: number;
}

/** A car's identity: `<model>[--<name>-<value>...][--turned]`, values sorted by name; two cars with the same key share their images. */
export function carKey(car: TrainCar): string {
  const values = Object.keys(car.params).sort().map((k) => `--${k}-${car.params[k]}`).join("");
  return `${car.model}${values}${car.turned ? "--turned" : ""}${car.station ? `--rope-${car.station}` : ""}${car.zoom ? `--zoom-${car.zoom}` : ""}`;
}

/** The base of a car's image file name, or of its section `section` (0 from the nose) when it is drawn in several; the writer adds a content hash and the extension. */
export function carImageBase(car: TrainCar, section?: number): string {
  return `${carKey(car)}${section === undefined ? "" : `--section-${section}`}`;
}

/**
 * A car longer than this many metres (a whole articulated train, drawn as one
 * model) is drawn in sections, so every image keeps the parade's scale (the side
 * view shrinks anything over 128 m) and stays a reasonable size.
 */
export const SECTION_MAX_M = 40;

/**
 * Where a car is cut into sections, metres from its nose: [start, end] pairs of
 * equal length covering it, one pair for a car up to `maxM` (SECTION_MAX_M at the
 * side view's scale; a view drawn at fewer pixels per metre takes longer sections).
 */
export function carSections(lengthM: number, maxM = SECTION_MAX_M): [number, number][] {
  const n = Math.max(1, Math.ceil(lengthM / maxM - 1e-9));
  return Array.from({ length: n }, (_, i) => [round((lengthM * i) / n), round((lengthM * (i + 1)) / n)]);
}

function nonDefault(specs: readonly ParamSpec[], params: ParamValues, where: string): ParamValues {
  const out: ParamValues = {};
  for (const name of Object.keys(params).sort()) {
    const spec = specs.find((s) => s.name === name);
    if (!spec) throw new Error(`${where}: no parameter "${name}"`);
    const value = params[name]!;
    if (!spec.values.some((v) => v.value === value)) {
      throw new Error(`${where}: parameter "${name}" has no value "${value}" (expected ${spec.values.map((v) => v.value).join(", ")})`);
    }
    if (value !== spec.default) out[name] = value;
  }
  return out;
}

/**
 * Every train with its cars resolved and checked: a formation expanded, every
 * model present, confirmed, a road or rail vehicle, every value one the model
 * offers. Throws on the first fault, naming the train and car, so a bad list
 * fails the build.
 */
/** A train resolved: its ground, category, speed, the wire it runs under (if any) and its cars. */
export interface ResolvedTrain {
  id: string;
  ground: Ground;
  category: TrainCategory;
  speedMps: number;
  wireM?: number;
  cars: TrainCar[];
  /** A cable car line: its station type, and the metres from one cabin's nose to the next's (absent: one cabin). */
  rope?: { station: string; spacingM?: number };
}

export function resolveTrains(list: readonly TrainSpec[], ctx: TrainContext): ResolvedTrain[] {
  const ids = new Set<string>();
  return list.map((train) => {
    if (!/^[a-z0-9-]+$/.test(train.id)) throw new Error(`train "${train.id}": id must be lower-case letters, digits and dashes`);
    if (ids.has(train.id)) throw new Error(`train "${train.id}" listed twice`);
    ids.add(train.id);
    const expand = (ref: FormationRef): TrainCarSpec[] => {
      const f = ctx.model(ref.model)?.openttd?.formations?.find((x) => x.name === ref.name);
      if (!f) throw new Error(`train "${train.id}": ${ref.model} has no formation "${ref.name}"`);
      return f.cars.map((c) => ({ model: ref.model, params: c.params, turned: c.turned }));
    };
    const specs: TrainCarSpec[] =
      "formation" in train ? expand(train.formation) : train.cars.flatMap((c) => ("formation" in c ? expand(c.formation) : [c]));
    if (specs.length === 0) throw new Error(`train "${train.id}": no cars`);
    const categories: string[] = [];
    const infos: TrainModelInfo[] = [];
    let lead: TrainModelInfo | undefined;
    const cars = specs.map((c, i) => {
      const where = `train "${train.id}", car ${i + 1} (${c.model})`;
      const info = ctx.model(c.model);
      if (!info) throw new Error(`${where}: no such model`);
      if (!ctx.confirmed(c.model)) throw new Error(`${where}: a workshop draft, not a confirmed model`);
      if (!ctx.isSideView(info.category) && !(info.category in CRAFT_GROUNDS)) throw new Error(`${where}: a ${info.category} model has no side view`);
      categories.push(info.category);
      infos.push(info);
      lead ??= info;
      if (c.zoom !== undefined && (info.category !== "Aircraft" || !(c.zoom > 1 && c.zoom <= 4))) throw new Error(`${where}: only an aircraft is zoomed, by more than 1 and at most 4`);
      return { model: c.model, params: nonDefault(info.params ?? [], c.params ?? {}, where), turned: c.turned === true, ...(c.zoom ? { zoom: c.zoom } : {}) };
    });
    if (train.category && !(train.category in TRAIN_CATEGORIES)) throw new Error(`train "${train.id}": no category "${train.category}"`);
    const category = train.category ?? trainCategory(lead!);
    const wireM = trainWire(infos);
    const ground = trainGround(categories);
    if (categories.some((c) => c in CRAFT_GROUNDS) && new Set(categories).size > 1) throw new Error(`train "${train.id}": a ship, aircraft or cabin runs with nothing else`);
    if ((ground === "water" || ground === "air") && cars.length !== 1) throw new Error(`train "${train.id}": a ship or aircraft runs alone`);
    let rope: ResolvedTrain["rope"];
    if (ground === "rope") {
      if (cars.length !== 1) throw new Error(`train "${train.id}": a cable car line lists its one cabin`);
      if (!train.rope) throw new Error(`train "${train.id}": a cable car line needs its rope (station type)`);
      if (!(train.rope.station in CABLE_STATION_TYPES)) throw new Error(`train "${train.id}": no cable car station type "${train.rope.station}"`);
      const jigback = ctx.ropeway?.(cars[0]!.model) === "jigback";
      const count = jigback ? 1 : (train.rope.cabins ?? ROPE_CABINS);
      if (!Number.isInteger(count) || count < 1) throw new Error(`train "${train.id}": bad cabin count`);
      const cabin = { ...cars[0]!, station: train.rope.station };
      cars.splice(0, 1, ...Array.from({ length: count }, () => ({ ...cabin })));
      rope = { station: train.rope.station, ...(count > 1 ? { spacingM: ROPE_SPACING_M } : {}) };
    } else if (train.rope) throw new Error(`train "${train.id}": only a cable car line has a rope`);
    return {
      id: train.id, ground, category, speedMps: PARADE_SPEED_MPS[category], ...(wireM !== undefined ? { wireM } : {}), cars, ...(rope ? { rope } : {}),
    };
  });
}

/**
 * The moving part of an animated car's image: a sprite of `frames` frames stacked
 * top to bottom, each the rectangle (`x`, `y`, `w`, `h` pixels of the image) that
 * changes over one cycle - the wheels and rods, a team's legs. The still image has
 * that rectangle cleared, so the sprite drawn over it is the whole picture.
 */
export interface SpriteRect {
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pixels from one frame's top to the next's: `h` and the transparent gap between frames. */
  pitch: number;
}

/** What a car's images are: its length, one still image per section, and its animation. */
export interface CarImages {
  /** The car's built length along X, metres (buffers and couplers included). */
  lengthM: number;
  /** One image name per section (carSections(lengthM)), relative to the trains folder. */
  images: string[];
  /** Per section, its sprite when something in it moves, else null; absent for a car without animation. */
  sprites?: (SpriteRect | null)[];
  /** Frames in each sprite, one cycle of the car's moving parts. */
  frames?: number;
  /** Metres the car travels in that cycle (one wheel turn, one stride). */
  cycleM?: number;
  /** Or, for parts that turn with time rather than distance (an aircraft's propellers or rotor), the cycle's seconds. */
  cycleS?: number;
  /** Per section, the exhaust mouths its image shows (absent for a car with none). */
  emitters?: CarEmitter[][];
}

/**
 * An exhaust mouth on a car's image: a steam locomotive's chimney (`steam`) or a
 * diesel's exhaust (`diesel`), `xM`, `yM` metres from the image's top-left corner.
 */
export interface CarEmitter {
  /** `wake`: a ship's bow wave (the nose's) or wake (the stern's), at the waterline. */
  kind: "steam" | "diesel" | "wake";
  xM: number;
  yM: number;
}

/** One image of a train, as parade.json carries it: a car, or one section of a car drawn in several. */
export interface PlacedCar extends TrainCar {
  /** The section of the car, 0 from its nose; absent for a car drawn whole. */
  section?: number;
  /** The image, relative to parade.json. */
  image: string;
  /** Metres from the train's nose to the image's left edge (negative: the first car's margin). */
  offsetM: number;
  /** The image's width in metres: the car's length and both margins. */
  widthM: number;
  /**
   * An animated car's moving part, drawn over `image`: a sprite of `frames` frames
   * stacked top to bottom `pitchM` apart (each `heightM` tall, then a transparent
   * gap), each `widthM` wide, placed `xM`, `yM` metres from the image's top-left
   * corner - one cycle of its moving parts (wheels and rods, a team's legs) over
   * `cycleM` metres travelled. A client shows frame floor(frac(distance / cycleM) *
   * frames) as the car moves, so nothing slides; a sprite with `cycleS` instead
   * (an aircraft's propellers or rotor) loops over that many seconds.
   */
  sprite?: {
    image: string; xM: number; yM: number; widthM: number; heightM: number; pitchM: number; frames: number;
    /** Exactly one: the metres travelled per loop, or (parts turning with time: propellers, a rotor) its seconds. */
    cycleM?: number;
    cycleS?: number;
  };
  /** The exhaust mouths on this image, where a client starts its smoke (steam puffs, diesel haze). */
  emitters?: CarEmitter[];
}

/**
 * Lay a train's cars end to end, nose first, couplers touching: each car's length
 * is its built length along X (buffers and couplers included), and its image spans
 * that plus `marginM` at each end, so neighbouring images overlap by twice the
 * margin (transparent pixels between cars; the same pixels twice between the
 * sections of one car, so no seam shows). A car longer than `sectionMaxM` is
 * placed as its sections (`carSections`). With `spacingM`, the cars keep that
 * distance from one nose to the next (cabins on a rope) instead of coupling.
 */
export function layOutTrain(
  cars: readonly TrainCar[], info: (car: TrainCar) => CarImages, marginM: number, pxPerM: number, spacingM = 0, sectionMaxM = SECTION_MAX_M,
): PlacedCar[] {
  let at = 0;
  return cars.flatMap((car) => {
    const c = info(car);
    if (!(c.lengthM > 0)) throw new Error(`${carKey(car)}: no length`);
    const sections = carSections(c.lengthM, sectionMaxM);
    if (sections.length !== c.images.length) throw new Error(`${carKey(car)}: ${c.images.length} images for ${sections.length} sections`);
    const placed = sections.map(([s0, s1], i): PlacedCar => {
      const sp = c.sprites?.[i];
      const em = c.emitters?.[i];
      return {
        ...car,
        ...(sections.length > 1 ? { section: i } : {}),
        image: `${PARADE_IMAGE_DIR}/${c.images[i]}`,
        offsetM: round(at + s0 - marginM),
        widthM: round(s1 - s0 + 2 * marginM),
        ...(sp && c.frames && (c.cycleM || c.cycleS)
          ? {
              sprite: {
                image: `${PARADE_IMAGE_DIR}/${sp.image}`,
                xM: round(sp.x / pxPerM),
                yM: round(sp.y / pxPerM),
                widthM: round(sp.w / pxPerM),
                heightM: round(sp.h / pxPerM),
                pitchM: round(sp.pitch / pxPerM),
                frames: c.frames,
                ...(c.cycleM ? { cycleM: c.cycleM } : { cycleS: c.cycleS! }),
              },
            }
          : {}),
        ...(em && em.length ? { emitters: em } : {}),
      };
    });
    // cabins on a rope keep their spacing, nose to nose; cars couple
    at += Math.max(c.lengthM, spacingM);
    return placed;
  });
}

/**
 * Where a chain runs: on rails, on the road (every car a road vehicle), on the
 * water (a ship), in the air (an aircraft) or on a rope (cable car cabins).
 */
export type Ground = "rail" | "road" | "water" | "air" | "rope";
export const GROUNDS: readonly Ground[] = ["rail", "road", "water", "air", "rope"];

/** A chain's ground from its cars' catalog categories. */
export function trainGround(categories: readonly string[]): Ground {
  if (categories.length > 0 && categories.every((c) => c === categories[0]) && CRAFT_GROUNDS[categories[0]!]) return CRAFT_GROUNDS[categories[0]!]!;
  return categories.length > 0 && categories.every((c) => c === "Road vehicles") ? "road" : "rail";
}

/**
 * How the images of a chain on one ground are drawn: `pxPerM` pixels per metre,
 * and the height window every image (and every sprite frame) covers - `heightM`
 * metres from `bottomM` metres relative to the ground's datum: the rail or the
 * road surface, a ship's waterline, a cable car station's level. An aircraft has
 * no ground: its window starts `-bottomM` metres under its wheels (gear up), which
 * sets how high it flies in the strip. A client draws every chain of one ground
 * at one scale, so lengths compare within a kind, and fits the window to its
 * strip's height.
 */
export interface ParadeView {
  pxPerM: number;
  heightM: number;
  bottomM: number;
}

export const PARADE_VIEWS: Readonly<Record<Ground, ParadeView>> = {
  // the side thumbnails' window (renderGlbThumb.ts SIDE_PX_PER_M, SIDE_BOTTOM_M, SIDE_TOP_M)
  rail: { pxPerM: 32, heightM: 6.3, bottomM: -0.3 },
  road: { pxPerM: 32, heightM: 6.3, bottomM: -0.3 },
  // up to a sailing ship's mastheads; the hull below the waterline is not drawn
  water: { pxPerM: 5, heightM: 44, bottomM: -1.5 },
  // the A380's fin in the top of the window, every aircraft's belly 40 % up it
  air: { pxPerM: 6, heightM: 40, bottomM: -16 },
  // the stations up to their roofs (the concrete drive's, 24.5 m), the cabins hanging from the rope head
  rope: { pxPerM: 8, heightM: 26, bottomM: -0.5 },
};

/**
 * The kinds of vehicle the parade's caption counts, in the order it shows them.
 * Every confirmed vehicle falls in exactly one (`vehicleType`): a horse-drawn tram,
 * railway car or coach is horse-drawn, not a tram, train or bus.
 */
export const VEHICLE_TYPES = ["trains", "trams", "buses", "trucks", "horseDrawn", "ships", "aircraft", "cableCars"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** A model's kind of vehicle from its catalog fields; undefined for anything that is not a vehicle. */
export function vehicleType(category: string, group: string, traction?: string): VehicleType | undefined {
  if (traction === "animal") return "horseDrawn";
  switch (category) {
    case "Rail vehicles":
      return group === "tram" ? "trams" : "trains";
    case "Road vehicles":
      return group === "bus" ? "buses" : "trucks";
    case "Ships":
      return "ships";
    case "Aircraft":
      return "aircraft";
    case "Cable car":
      return "cableCars";
    default:
      return undefined;
  }
}

/** What the parade's caption counts: confirmed models per kind of vehicle, and all their variants. */
export interface FleetCounts {
  /** Confirmed models of each kind, every kind present (0 when none). */
  types: Record<VehicleType, number>;
  /** Their variants together, counted as modelVariants does. */
  variants: number;
}

/** The variants a model counts for: every distinct value of every parameter added up (not combinations), without `cars` and preview fixtures; 1 with none. */
export function modelVariants(params: readonly ParamSpec[] = []): number {
  const counted = params.filter((p) => p.name !== "cars" && !p.preview);
  return counted.length ? counted.reduce((n, p) => n + p.values.length, 0) : 1;
}

/** A model as the counts read it. */
export interface CountedModel {
  id: string;
  category: string;
  group: string;
  traction?: string;
  params?: readonly ParamSpec[];
}

/** FleetCounts over the confirmed vehicles of `models`. */
export function fleetCounts(models: Iterable<CountedModel>, confirmed: (id: string) => boolean): FleetCounts {
  const types = Object.fromEntries(VEHICLE_TYPES.map((t) => [t, 0])) as Record<VehicleType, number>;
  let variants = 0;
  for (const m of models) {
    const type = vehicleType(m.category, m.group, m.traction);
    if (!type || !confirmed(m.id)) continue;
    types[type]++;
    variants += modelVariants(m.params);
  }
  return { types, variants };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** railisland.com, where the parade runs; its `?parade=<id>` plays one chain only. */
export const RAILISLAND_URL = "https://railisland.com";

/** Where the parade's images are, relative to parade.json (and to the export folder). */
export const PARADE_IMAGE_DIR = "parade/img";

/** export/parade.json, served at factory.railisland.com/parade.json (docs/site/train-parade.md). */
export interface ParadeFile {
  version: 2;
  /** How every chain on each ground is drawn (PARADE_VIEWS): pixels per metre and the height window of its images. */
  views: Record<Ground, ParadeView>;
  /** The caption's counts: every kind of vehicle the factory makes, and all their variants. */
  fleet: FleetCounts;
  /** How the first round opens (PARADE_OPENING): a client passes it to playOrder for its first round only. */
  opening: ParadeOpening;
  /**
   * Every chain: `speedMps` is how fast it runs (metres of the model per second),
   * `wireM` the height of the overhead wire it runs under over the rail, absent
   * for none.
   */
  trains: ParadeChain[];
}

/** A chain as parade.json carries it. */
export interface ParadeChain {
  id: string;
  ground: Ground;
  category: TrainCategory;
  speedMps: number;
  wireM?: number;
  lengthM: number;
  cars: PlacedCar[];
  /** A cable car line's scenery: the ropes, a station at each end, a pylon (ParadeRope). */
  rope?: ParadeRope;
}

/** An image of the scenery a chain brings, in its ground's view: as high as the view, `widthM` wide. */
export interface SceneryImage {
  image: string;
  widthM: number;
}

/**
 * The rope a cable car line's cabins hang from and what carries it: `ropes`, the
 * heights of the ropes to draw over the station level (metres; the haul rope the
 * cabins hang from, and a track rope where the cabin runs on one), `right` the
 * station at the strip's right end (the cabins come out of it), `left` the one at
 * its left end (they go into it), each drawn facing the line, and `pylon` the
 * support a client stands every `spacingM` metres between them, its rope saddle
 * at the rope's height.
 */
export interface ParadeRope {
  station: string;
  ropes: { kind: "haul" | "track"; yM: number }[];
  right: SceneryImage;
  left: SceneryImage;
  pylon: SceneryImage & { spacingM: number };
}

/**
 * How the parade opens - the first round a visitor sees after the page loads:
 * `categories` are the first chains' categories, in order (an electric locomotive
 * and its train, then a steam train, ..., then a cable car line, a ship and an
 * aircraft), and `notBefore` keeps a category out of the round's first places
 * (horse-drawn: not before the tenth chain, index 9).
 * Later rounds follow the plain spread order.
 */
export interface ParadeOpening {
  categories: string[];
  notBefore: Record<string, number>;
}

export const PARADE_OPENING: ParadeOpening = {
  categories: ["electricLoco", "steamLoco", "electricUnit", "dieselLoco", "dieselUnit", "cableCar", "ship", "aircraft"],
  notBefore: { horse: 9 },
};

/**
 * One round of the parade: every train once, in an order that spreads each
 * category evenly over the round and never puts two of one category next to each
 * other (nor first a train of `after`'s category, the last one played), as far as
 * the list allows.
 *
 * Each category's trains are shuffled and given evenly spaced keys over the round
 * ((k + offset) / n, one random offset per category); sorting by key interleaves
 * the categories regularly. A train whose category repeats its predecessor's is
 * then swapped with the next one of another category.
 *
 * With `opening` (the first round only): a random train of each of its
 * `categories` opens the round in that order (a category the list lacks is
 * skipped), and a category in `notBefore` is spread over the places from its
 * index on only, and never swapped to an earlier one.
 *
 * Self-contained on purpose: the overview page (paradePage.ts) embeds its source,
 * and railisland.com's TrainParade.astro carries a copy - keep the three in step.
 */
export function playOrder<T extends { id: string; category: string }>(
  trains: readonly T[],
  after: { category: string } | null = null,
  random: () => number = Math.random,
  opening: { categories: readonly string[]; notBefore: Readonly<Record<string, number>> } | null = null,
): T[] {
  const pool = [...trains];
  const head: T[] = [];
  for (const cat of opening ? opening.categories : []) {
    const options = pool.filter((t) => t.category === cat);
    if (!options.length) continue;
    const pick = options[Math.floor(random() * options.length)]!;
    pool.splice(pool.indexOf(pick), 1);
    head.push(pick);
  }
  const start = head.length;
  const last = start ? head[start - 1]! : after;
  // the first place (in the rest of the round) a train may take
  const earliest = (t: T) => Math.max(0, (opening ? opening.notBefore[t.category] ?? 0 : 0) - start);
  const groups = new Map<string, T[]>();
  for (const t of pool) {
    const g = groups.get(t.category);
    if (g) g.push(t);
    else groups.set(t.category, [t]);
  }
  const keyed: { t: T; key: number }[] = [];
  for (const g of groups.values()) {
    for (let i = g.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const x = g[i]!;
      g[i] = g[j]!;
      g[j] = x;
    }
    const offset = random();
    // a category held back is spread over the places it may take (and moved there below)
    const lo = pool.length ? Math.min(1, earliest(g[0]!) / pool.length) : 0;
    g.forEach((t, k) => keyed.push({ t, key: lo + ((k + offset) / g.length) * (1 - lo) + random() * 1e-6 }));
  }
  keyed.sort((a, b) => a.key - b.key);
  const out = keyed.map((k) => k.t);
  // a train held back that the keys still put too early moves to its first allowed place
  for (let i = 0; i < out.length; ) {
    const e = Math.min(earliest(out[i]!), out.length - 1);
    if (e <= i) {
      i++;
      continue;
    }
    out.splice(e, 0, out.splice(i, 1)[0]!);
  }
  for (let i = 0; i < out.length; i++) {
    const prev = i === 0 ? (last ? last.category : null) : out[i - 1]!.category;
    if (out[i]!.category !== prev) continue;
    // the nearest later train of another category that may stand here, preferably
    // one that does not then sit next to its own kind where it came from
    let pick = -1;
    for (let k = i + 1; k < out.length; k++) {
      if (out[k]!.category === prev || earliest(out[k]!) > i) continue;
      if (pick < 0) pick = k;
      const left = out[k - 1]!.category;
      const right = k + 1 < out.length ? out[k + 1]!.category : null;
      if (left !== out[i]!.category && right !== out[i]!.category) {
        pick = k;
        break;
      }
    }
    if (pick < 0) {
      // none left ahead (the end of the round): an earlier train that fits here,
      // whose place this one fits in turn
      const cat = (k: number) => (k < 0 ? (last ? last.category : null) : k < out.length ? out[k]!.category : null);
      for (let k = i - 2; k >= 0; k--) {
        const here = out[i]!.category;
        const there = out[k]!.category;
        if (there === prev || there === cat(i + 1)) continue;
        if (here === cat(k - 1) || here === cat(k + 1)) continue;
        if (earliest(out[i]!) > k) continue;
        pick = k;
        break;
      }
    }
    if (pick >= 0) {
      const x = out[i]!;
      out[i] = out[pick]!;
      out[pick] = x;
    }
  }
  return head.concat(out);
}
