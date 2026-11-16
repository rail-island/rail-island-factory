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
  | { id: string; cars: (TrainCarSpec | { formation: FormationRef })[] }
  | { id: string; formation: FormationRef };

const HORSES_2: ParamValues = { animal: "horse", team: "2" };

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
export function resolveTrains(list: readonly TrainSpec[], ctx: TrainContext): { id: string; ground: Ground; cars: TrainCar[] }[] {
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
    const cars = specs.map((c, i) => {
      const where = `train "${train.id}", car ${i + 1} (${c.model})`;
      const info = ctx.model(c.model);
      if (!info) throw new Error(`${where}: no such model`);
      if (!ctx.confirmed(c.model)) throw new Error(`${where}: a workshop draft, not a confirmed model`);
      if (!ctx.isSideView(info.category)) throw new Error(`${where}: a ${info.category} model has no side view`);
      categories.push(info.category);
      return { model: c.model, params: nonDefault(info.params ?? [], c.params ?? {}, where), turned: c.turned === true };
    });
    return { id: train.id, ground: trainGround(categories), cars };
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
  /**
   * An animated car's moving part, drawn over `image`: a sprite of `frames` frames
   * stacked top to bottom `pitchM` apart (each `heightM` tall, then a transparent
   * gap), each `widthM` wide, placed `xM`, `yM` metres from the image's top-left
   * corner - one cycle of its moving parts (wheels and rods, a team's legs) over
   * `cycleM` metres travelled. A client shows frame floor(frac(distance / cycleM) *
   * frames) as the car moves, so nothing slides.
   */
  sprite?: { image: string; xM: number; yM: number; widthM: number; heightM: number; pitchM: number; frames: number; cycleM: number };
}

/**
 * Lay a train's cars end to end, nose first, couplers touching: each car's length
 * is its built length along X (buffers and couplers included), and its image spans
 * that plus `marginM` at each end, so neighbouring images overlap by twice the
 * margin (transparent pixels between cars; the same pixels twice between the
 * sections of one car, so no seam shows). A car longer than SECTION_MAX_M is
 * placed as its sections (`carSections`).
 */
export function layOutTrain(cars: readonly TrainCar[], info: (car: TrainCar) => CarImages, marginM: number, pxPerM: number): PlacedCar[] {
  let at = 0;
  return cars.flatMap((car) => {
    const c = info(car);
    if (!(c.lengthM > 0)) throw new Error(`${carKey(car)}: no length`);
    const sections = carSections(c.lengthM);
    if (sections.length !== c.images.length) throw new Error(`${carKey(car)}: ${c.images.length} images for ${sections.length} sections`);
    const placed = sections.map(([s0, s1], i): PlacedCar => {
      const sp = c.sprites?.[i];
      return {
        ...car,
        ...(sections.length > 1 ? { section: i } : {}),
        image: `trains/${c.images[i]}`,
        offsetM: round(at + s0 - marginM),
        widthM: round(s1 - s0 + 2 * marginM),
        ...(sp && c.frames && c.cycleM
          ? {
              sprite: {
                image: `trains/${sp.image}`,
                xM: round(sp.x / pxPerM),
                yM: round(sp.y / pxPerM),
                widthM: round(sp.w / pxPerM),
                heightM: round(sp.h / pxPerM),
                pitchM: round(sp.pitch / pxPerM),
                frames: c.frames,
                cycleM: c.cycleM,
              },
            }
          : {}),
      };
    });
    at += c.lengthM;
    return placed;
  });
}

/** Where a train runs: on rails, or on the road (every car a road vehicle). */
export type Ground = "rail" | "road";

/** A train's ground from its cars' catalog categories. */
export function trainGround(categories: readonly string[]): Ground {
  return categories.length > 0 && categories.every((c) => c === "Road vehicles") ? "road" : "rail";
}

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

/** The earlier caption's counts: confirmed Rail vehicles and their variants (kept in trains.json for clients that still read it). */
export interface FleetStats {
  models: number;
  variants: number;
}

/** FleetStats over the confirmed models. */
export function fleetStats(models: Iterable<CountedModel>, confirmed: (id: string) => boolean): FleetStats {
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
  /** Every image's (and every sprite frame's) height in metres, and where the rail sits: `-bottomM` metres above the bottom edge. */
  heightM: number;
  bottomM: number;
  /** The caption's counts: every kind of vehicle the factory makes, and all their variants. */
  fleet: FleetCounts;
  /** Deprecated: the first caption's rail-only counts, until no client reads them. */
  stats: FleetStats;
  trains: { id: string; ground: Ground; lengthM: number; cars: PlacedCar[] }[];
}
