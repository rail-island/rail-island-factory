// The train parade: a hand-picked list of whole trains whose side views
// railisland.com drives across its landing page (docs/site/train-parade.md).
//
// A train is its cars, nose first; a car is a confirmed road or rail model with
// parameter values, turned round or not. A train either lists its cars or names
// one of its model's OpenTTD formations (generator/openttdTable.ts), which stands
// for that formation's cars. writeTrains.ts renders every distinct car at build
// time into export/trains/ and writes export/trains.json; nothing here is
// committed output.
//
// This module is pure: no rendering, no file system. Everything a train needs
// from the rest of the factory is passed in (`TrainContext`), so the tests can
// check it with small fixtures.

import type { OpenttdProperties, ParamSpec, ParamValues } from "./design.ts";

/** One car as the list writes it. */
export interface TrainCarSpec {
  model: string;
  /** Parameter values; a value equal to the default may be left out. */
  params?: ParamValues;
  /** True for a car running backwards (the rear power car of a TGV). */
  turned?: boolean;
}

/** One train as the list writes it: its cars, or a model's named OpenTTD formation. */
export type TrainSpec =
  | { id: string; cars: TrainCarSpec[] }
  | { id: string; formation: { model: string; name: string } };

/**
 * The parade's trains. Ids are the trains' names in trains.json (stable, but
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
];

/** What a train needs to know about one model. */
export interface TrainModelInfo {
  /** The catalog category ("Rail vehicles", "Road vehicles"): only side-view categories may run. */
  category: string;
  params?: readonly ParamSpec[];
  openttd?: OpenttdProperties;
}

/** The factory as the parade sees it. */
export interface TrainContext {
  model(id: string): TrainModelInfo | undefined;
  /** True when the model is confirmed (generator/catalogModels.json), not a workshop draft. */
  confirmed(id: string): boolean;
  isSideView(category: string): boolean;
}

/** One car resolved: its model, its non-default values (sorted by name), and turned. */
export interface TrainCar {
  model: string;
  params: ParamValues;
  turned: boolean;
}

/** A car's identity: `<model>[--<name>-<value>...][--turned]`, values sorted by name; two cars with the same key share their images. */
export function carKey(car: TrainCar): string {
  const values = Object.keys(car.params).sort().map((k) => `--${k}-${car.params[k]}`).join("");
  return `${car.model}${values}${car.turned ? "--turned" : ""}`;
}

/** The image file of a car, or of its section `section` (0 from the nose) when it is drawn in several. */
export function carImageName(car: TrainCar, section?: number): string {
  return `${carKey(car)}${section === undefined ? "" : `--section-${section}`}.png`;
}

/**
 * A car longer than this many metres (a whole articulated train, drawn as one
 * model) is drawn in sections, so every image keeps the parade's scale (the side
 * view shrinks anything over 128 m) and stays a reasonable size.
 */
export const SECTION_MAX_M = 40;

/**
 * Where a car is cut into sections, metres from its nose: [start, end] pairs of
 * equal length covering it, one pair for a car up to SECTION_MAX_M.
 */
export function carSections(lengthM: number): [number, number][] {
  const n = Math.max(1, Math.ceil(lengthM / SECTION_MAX_M - 1e-9));
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
export function resolveTrains(list: readonly TrainSpec[], ctx: TrainContext): { id: string; cars: TrainCar[] }[] {
  const ids = new Set<string>();
  return list.map((train) => {
    if (!/^[a-z0-9-]+$/.test(train.id)) throw new Error(`train "${train.id}": id must be lower-case letters, digits and dashes`);
    if (ids.has(train.id)) throw new Error(`train "${train.id}" listed twice`);
    ids.add(train.id);
    let specs: TrainCarSpec[];
    if ("formation" in train) {
      const info = ctx.model(train.formation.model);
      const f = info?.openttd?.formations?.find((x) => x.name === train.formation.name);
      if (!f) throw new Error(`train "${train.id}": ${train.formation.model} has no formation "${train.formation.name}"`);
      specs = f.cars.map((c) => ({ model: train.formation.model, params: c.params, turned: c.turned }));
    } else {
      specs = train.cars;
    }
    if (specs.length === 0) throw new Error(`train "${train.id}": no cars`);
    const cars = specs.map((c, i) => {
      const where = `train "${train.id}", car ${i + 1} (${c.model})`;
      const info = ctx.model(c.model);
      if (!info) throw new Error(`${where}: no such model`);
      if (!ctx.confirmed(c.model)) throw new Error(`${where}: a workshop draft, not a confirmed model`);
      if (!ctx.isSideView(info.category)) throw new Error(`${where}: a ${info.category} model has no side view`);
      return { model: c.model, params: nonDefault(info.params ?? [], c.params ?? {}, where), turned: c.turned === true };
    });
    return { id: train.id, cars };
  });
}

/** One image of a train, as trains.json carries it: a car, or one section of a car drawn in several. */
export interface PlacedCar extends TrainCar {
  /** The section of the car, 0 from its nose; absent for a car drawn whole. */
  section?: number;
  /** The image, relative to trains.json. */
  image: string;
  /** Metres from the train's nose to the image's left edge (negative: the first car's margin). */
  offsetM: number;
  /** The image's width in metres: the car's length and both margins. */
  widthM: number;
}

/**
 * Lay a train's cars end to end, nose first, couplers touching: each car's length
 * is its built length along X (`lengthM`, buffers and couplers included), and its
 * image spans that plus `marginM` at each end, so neighbouring images overlap by
 * twice the margin (transparent pixels between cars; the same pixels twice between
 * the sections of one car, so no seam shows). A car longer than SECTION_MAX_M is
 * placed as its sections (`carSections`).
 */
export function layOutTrain(cars: readonly TrainCar[], lengthM: (car: TrainCar) => number, marginM: number): PlacedCar[] {
  let at = 0;
  return cars.flatMap((car) => {
    const length = lengthM(car);
    if (!(length > 0)) throw new Error(`${carKey(car)}: no length`);
    const sections = carSections(length);
    const placed = sections.map(([s0, s1], i): PlacedCar => ({
      ...car,
      ...(sections.length > 1 ? { section: i } : {}),
      image: `trains/${carImageName(car, sections.length > 1 ? i : undefined)}`,
      offsetM: round(at + s0 - marginM),
      widthM: round(s1 - s0 + 2 * marginM),
    }));
    at += length;
    return placed;
  });
}

/** What the parade's caption counts: the confirmed rail vehicles and their variants. */
export interface FleetStats {
  /** Confirmed models in the Rail vehicles category. */
  models: number;
  /**
   * Their variants: per model, every distinct value of every parameter added up
   * (not their combinations), leaving out `cars` (how many cars a whole train has)
   * and the site's preview fixtures; a model with no other parameter is 1.
   */
  variants: number;
}

/** The variants a model counts for in FleetStats. */
export function modelVariants(params: readonly ParamSpec[] = []): number {
  const counted = params.filter((p) => p.name !== "cars" && !p.preview);
  return counted.length ? counted.reduce((n, p) => n + p.values.length, 0) : 1;
}

/** FleetStats over the confirmed models (`models`: id, category, parameters). */
export function fleetStats(models: Iterable<{ id: string; category: string; params?: readonly ParamSpec[] }>, confirmed: (id: string) => boolean): FleetStats {
  let count = 0;
  let variants = 0;
  for (const m of models) {
    if (m.category !== "Rail vehicles" || !confirmed(m.id)) continue;
    count++;
    variants += modelVariants(m.params);
  }
  return { models: count, variants };
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** export/trains.json (docs/site/train-parade.md). */
export interface TrainsFile {
  version: 1;
  /** Pixels per metre of every image. */
  pxPerM: number;
  /** Every image's height in metres, and where the rail sits: `-bottomM` metres above the bottom edge. */
  heightM: number;
  bottomM: number;
  /** The fleet the caption under the parade names (FleetStats). */
  stats: FleetStats;
  trains: { id: string; lengthM: number; cars: PlacedCar[] }[];
}
