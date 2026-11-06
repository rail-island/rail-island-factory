// What every procedural model is: an id, a title and the function that builds
// it. The skyscrapers (skyscrapers.ts) and the vehicles (vehicles.ts) are lists
// of these; generate.ts runs them. No `node:` imports.
//
// A design may be PARAMETRIC: it declares enum parameters (`params`), each with
// its values and a default, and `build` takes the chosen values. The export holds
// one GLB, thumbnail and source tree per design, built with the defaults; the
// meta and catalog entries list the parameters, and the standalone JS model's
// `build(THREE, params)` builds any combination (docs/models/parameters.md).

import type { LoadingGauge } from "./loadingGauge.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import type { CityUse } from "./cityVariants.ts";

/** What drives a powered rail vehicle. */
export type Traction = "electric" | "diesel" | "steam";

/** One value of an enum parameter. */
export interface ParamValue {
  /** The stable token, e.g. "classA": what a caller passes and a saved map would store. */
  value: string;
  /** What a picker shows, e.g. "Class A (1st class)". */
  title: string;
  /**
   * Set when the value is offered only under some values of an earlier parameter
   * (the MTR M-Train's Disneyland livery, only on the cars the line ran: `when: {
   * name: "unit", values: ["aCar", "cCar", "train"] }`). Elsewhere it is not
   * offered: resolving refuses it, no combination holds it, no picker shows it. A
   * parameter's default is never conditional, so it is always offered.
   */
  when?: ParamCondition;
}

/** An enum parameter of a parametric design. */
export interface ParamSpec {
  /** The stable key, e.g. "variant". */
  name: string;
  title: string;
  values: ParamValue[];
  /** One of `values`: what the exported GLB is built with. */
  default: string;
  /**
   * A fixture of the site's preview, not of the model: the span a bridge preview
   * crosses, the size of a sample city block. The game sets its own (from the path
   * it builds over, the block it fills), so the site lists these apart, under
   * "Preview parameters" (docs/models/sets.md). A parameter the game passes as it
   * stands (a station's track count) is an ordinary one.
   */
  preview?: true;
  /**
   * Set when the parameter applies only to some values of an earlier one (a
   * TGV's car count to its trailer set, not its power car): elsewhere it is
   * absent -- not resolved, not combined, not shown, not part of a key.
   */
  when?: ParamCondition;
  /**
   * Values a design no longer offers, each with the values that replace it (the
   * TGV's single coaches, `unit: coach`, now a one-car set: `{ unit: "set", cars:
   * "1" }`). A saved map may still name one; resolving reads it as its
   * replacement, and nothing lists or combines it.
   */
  retired?: Record<string, ParamValues>;
}

/** The values of an earlier parameter under which a parameter applies. */
export interface ParamCondition {
  name: string;
  values: string[];
}

/** Whether a parameter applies to the values chosen so far (see ParamSpec.when). */
export function paramApplies(spec: ParamSpec, chosen: ParamValues): boolean {
  return !spec.when || spec.when.values.includes(chosen[spec.when.name] ?? "");
}

/** Chosen parameter values by name. */
export type ParamValues = Record<string, string>;

export interface ProceduralDesign {
  id: string;
  title: string;
  /** Builds the model; a parametric design reads `params`, missing names take their defaults. */
  build: (params?: ParamValues) => MeshBuilder;
  /**
   * The one value a shared build function is drawn for: a site preview of one set
   * type (`proc-preview-bridge-stone-arch` draws the bridge set's `stone_arch`).
   * `build` and `buildLod` are then the shared functions bound to it -- named as the
   * module exports them -- and the JS model passes it as their second argument
   * (`boundDesign`, jsModel.ts).
   */
  bound?: string;
  /** The design's enum parameters; absent for a fixed design. */
  params?: readonly ParamSpec[];
  /** The dedicated distant model (docs/models/lod.md), exported from the same source module. */
  buildLod: (params?: ParamValues) => MeshBuilder;
  /**
   * A third, coarsest level below `buildLod`: the trees' (trees.ts), which a whole
   * forest draws in the distance. The JS model exports it as `buildCoarse(THREE)`.
   */
  buildCoarse?: (params?: ParamValues) => MeshBuilder;
  /** Optional close-up geometry, capped at 10,000 triangles; currently every tree. */
  buildMax?: (params?: ParamValues) => MeshBuilder;
  /**
   * False for a design whose source tree is too big to be useful: a city block's
   * dozens of buildings run to 15-40 MiB of tree, over Cloudflare's 25 MiB
   * per-asset limit. The build then writes no tree file and the site shows no
   * Source tab (docs/models/source-tree.md).
   */
  sourceTree?: false;
  /** Total distant-mesh budget; defaults to the family policy in lod.ts. */
  lodTriangles?: 100 | 200 | 300 | 500 | 3000 | 12000;
  /**
   * The names of the parameters that only recolour the model (a roof or wall
   * colour): they change no geometry, so the tests vary them one value at a
   * time instead of multiplying every combination by them (coverageCombinations),
   * and a city colours a building by them (cityVariants.ts).
   */
  finishParams?: readonly string[];
  /**
   * The folder under assets/ holding the design's source images (photos, drawings,
   * native textures), or several folders when the design merges models with their
   * own material. The build copies them to export/refs/<id>/ (a second or later
   * folder's files under its own name) and the site shows them on the model page.
   */
  references?: string | readonly string[];
  /** Catalog fields that replace the family's (a rail vehicle among the road vehicles). */
  catalog?: CatalogFields;
  /**
   * What the game needs of the model beyond its geometry (GameProperties).
   * Required for a vehicle; a building sets it only for plaza or block rules.
   */
  game?: GameProperties;
  /**
   * The loading gauge a rail vehicle is drawn to (loadingGauge.ts,
   * docs/models/loading-gauge.md): "uic" (3.1 m by 4.7 m, the default), "us"
   * (North American Plate F/H bodies, 3.3 m by 4.95 m), "usDoubleStack" (a well car's
   * two stacked containers, 3.3 m by 6.2 m) or "shinkansen" (3.3 m by 4.7 m). Every one stays inside the game's platform edge.
   */
  loadingGauge?: LoadingGauge;
  /**
   * What an OpenTTD GRF export needs of a vehicle beyond `game`: dates, costs,
   * capacity, climates (OpenttdProperties). Optional: the site fills every missing
   * field from the vehicle's category (docs/site/openttd-export.md).
   */
  openttd?: OpenttdProperties;
  /**
   * What the game needs of a character (characters.ts, docs/models/characters.md)
   * beyond its geometry and clips; set on every character and nothing else.
   */
  character?: CharacterProperties;
}

/** A character's game properties, exported in its characters.meta.json entry. */
export interface CharacterProperties {
  /** The hips' (the leg joints') height in the seated pose, the end of its `sit` clip, metres. */
  seat: number;
  /** Where its face looks: "+x", as a vehicle's nose. */
  facing: "+x";
  /** The named looks the game offers as types, for a parametric character (docs/models/characters.md). */
  presets?: readonly CharacterPreset[];
}

/** One named look of a parametric character: its parameter values (the rest at their defaults). */
export interface CharacterPreset {
  /** Stable, stored in the game's saved maps. */
  id: string;
  /** English title, exported game text (`model.<id>.preset.<preset>`). */
  title: string;
  /** The grammatical gender of the first name the game gives a new avatar of this look. */
  nameGender: "female" | "male";
  params: ParamValues;
}

/** An OpenTTD climate a vehicle is offered in. */
export type OpenttdClimate = "temperate" | "arctic" | "tropical" | "toyland";

/** OpenTTD's cargo classes, for a vehicle's refits. */
export const OPENTTD_CARGO_CLASSES = [
  "passengers", "mail", "express", "armoured", "bulk", "piece", "liquid", "refrigerated", "hazardous", "covered",
] as const;
export type OpenttdCargoClass = (typeof OPENTTD_CARGO_CLASSES)[number];

/** The OpenTTD figures one design or variant may state; each is optional. */
export interface OpenttdFields {
  /** Year the vehicle is introduced. */
  introYear?: number;
  /** Years a single vehicle lasts before it is old (1..255). */
  vehicleLife?: number;
  /** Years the model is offered for (1..255). */
  modelLife?: number;
  /** How fast reliability drops (0..255; OpenTTD's default is about 20). */
  reliabilityDecay?: number;
  /** Purchase cost factor (0..255). */
  costFactor?: number;
  /** Running cost factor (0..255). */
  runningCostFactor?: number;
  /** Cargo capacity in units of `cargo` (0..255; ships and aircraft up to 65535). */
  capacity?: number;
  /** The default cargo, as OpenTTD's four-letter label: PASS, MAIL, GOOD, COAL, ... */
  cargo?: string;
  climates?: OpenttdClimate[];
  /** A train's rail type label: RAIL, ELRL, MONO or MGLV. */
  railType?: string;
  /** The cargo classes the vehicle can be refitted to. */
  refitClasses?: OpenttdCargoClass[];
}

/** A variant's OpenTTD figures: the fields that differ from the design's. */
export type OpenttdVariant = { params: ParamValues } & OpenttdFields;

/** One car of a formation: a non-default selection of the design, `turned` drawn facing backwards. */
export interface OpenttdFormationCar {
  params: ParamValues;
  turned?: boolean;
}

/**
 * A fixed formation the GRF offers as one articulated engine: an English name
 * (shown in OpenTTD's purchase list after the title) and its cars, front first.
 */
export interface OpenttdFormation {
  name: string;
  cars: OpenttdFormationCar[];
}

/** What an OpenTTD GRF export needs of a vehicle (ProceduralDesign.openttd). */
export interface OpenttdProperties extends OpenttdFields {
  /** Parameter variants whose figures differ, matched like GameProperties.variants. */
  variants?: OpenttdVariant[];
  /**
   * The selections the one-click download exports, the default (`{}`) first:
   * non-default parameter values, each offered and listed once; never a whole
   * articulated train (`unit: "train"`; formations stand in for it).
   */
  presets?: ParamValues[];
  /** Fixed formations of the design's own cars (docs/site/openttd-export.md). */
  formations?: OpenttdFormation[];
  /**
   * The ids the committed id table (generator/openttdIds.json) gives the model:
   * its GRF id's low 16 bits and each preset's and formation's block of part ids,
   * in their order. Written into the catalog's block only.
   */
  ids?: OpenttdIds;
}

/** A model's ids from the committed OpenTTD id table (OpenttdProperties.ids). */
export interface OpenttdIds {
  grf: number;
  presets: OpenttdIdBlock[];
  formations: OpenttdIdBlock[];
}

/** A preset's or formation's block of part ids: its first id and how many it reserves. */
export interface OpenttdIdBlock {
  id: number;
  size: number;
}

/** The facts every vehicle the GRF can hold states (OpenttdRequired); the balance figures are derived. */
export const OPENTTD_REQUIRED_FACTS = ["introYear", "capacity", "cargo", "refitClasses", "climates"] as const;

/** The most parts a formation may have in OpenTTD (the export's cap, properties.ts MAX_PARTS). */
export const OPENTTD_MAX_PARTS = 32;

const OPENTTD_RANGES: Record<string, [number, number]> = {
  introYear: [1, 5000000], vehicleLife: [1, 255], modelLife: [1, 255], reliabilityDecay: [0, 255],
  costFactor: [0, 255], runningCostFactor: [0, 255], capacity: [0, 65535],
};
const OPENTTD_CLIMATES: readonly string[] = ["temperate", "arctic", "tropical", "toyland"];

/**
 * Checks a design's OpenTTD properties (OpenttdProperties): only a vehicle a GRF
 * can hold may carry them, and every such vehicle (`exportable`, its OpenTTD type;
 * null for one a GRF cannot hold, undefined when not known) must, with the facts
 * OPENTTD_REQUIRED_FACTS lists (a train's rail type too) and its presets; every
 * figure is an integer in its range, labels are four printable ASCII characters,
 * each variant names a real, non-default parameter selection at most once, each
 * preset and formation car a real, offered selection that is not the whole
 * articulated train, the default preset first. Throws, naming the design.
 */
export function checkOpenttdProperties(design: ProceduralDesign, vehicle: boolean, exportable?: "train" | "road" | "ship" | "aircraft" | null): void {
  const ottd = design.openttd;
  const fail = (why: string): never => {
    throw new Error(`${design.id}: openttd properties ${why} (docs/site/openttd-export.md)`);
  };
  if (!ottd) {
    if (exportable) fail("are missing: every vehicle OpenTTD can hold states them (generator/openttdTable.ts)");
    return;
  }
  if (!vehicle) fail("belong to vehicles only");
  if (vehicle && exportable === null) fail("belong to vehicles OpenTTD can hold only");
  if (exportable) {
    for (const k of OPENTTD_REQUIRED_FACTS) if (ottd[k] === undefined) fail(`lack the required "${k}"`);
    if (exportable === "train" && ottd.railType === undefined) fail('lack the required "railType" of a train');
    if (exportable !== "train" && ottd.railType !== undefined) fail('state a "railType" on a vehicle that is not a train');
    if (!ottd.presets?.length) fail("list no presets");
  }
  const checkFields = (f: OpenttdFields & { params?: ParamValues; variants?: unknown }, where: string) => {
    for (const [k, v] of Object.entries(f)) {
      if (k === "params" || k === "variants" || (where === "" && (k === "presets" || k === "formations" || k === "ids"))) continue;
      if (k in OPENTTD_RANGES) {
        const [lo, hi] = OPENTTD_RANGES[k]!;
        if (typeof v !== "number" || !Number.isInteger(v) || v < lo || v > hi) fail(`${where}have an invalid "${k}": ${String(v)}`);
      } else if (k === "cargo" || k === "railType") {
        if (typeof v !== "string" || !/^[\x20-\x7e]{4}$/.test(v)) fail(`${where}have an invalid "${k}" label: ${String(v)}`);
      } else if (k === "climates") {
        if (!Array.isArray(v) || v.some((c) => !OPENTTD_CLIMATES.includes(c as string))) fail(`${where}list an unknown climate`);
      } else if (k === "refitClasses") {
        if (!Array.isArray(v) || v.some((c) => !(OPENTTD_CARGO_CLASSES as readonly string[]).includes(c as string))) fail(`${where}list an unknown cargo class`);
      } else {
        fail(`${where}have an unknown field "${k}"`);
      }
    }
  };
  checkFields(ottd, "");
  const specs = design.params ?? [];
  const seen = new Set<string>();
  for (const variant of ottd.variants ?? []) {
    const names = Object.keys(variant.params);
    if (!names.length) fail("list a variant without parameters");
    let resolved: ParamValues;
    try {
      resolved = resolveParams(specs, variant.params);
    } catch (e) {
      return fail(`list a variant that does not resolve: ${(e as Error).message}`);
    }
    for (const name of names) {
      if (resolved[name] !== variant.params[name]) fail(`list a variant whose "${name}" does not apply`);
      if (specs.find((s) => s.name === name)!.default === variant.params[name]) fail(`list a variant at the default "${name}"`);
    }
    const key = JSON.stringify(Object.entries(variant.params).sort());
    if (seen.has(key)) fail(`list the variant ${key} twice`);
    seen.add(key);
    checkFields(variant, `variant ${key}: `);
  }
  // a preset or formation car: a real, offered, non-default selection (or none at all)
  const selection = (params: ParamValues, where: string): string => {
    let resolved: ParamValues;
    try {
      resolved = resolveParams(specs, params);
    } catch (e) {
      return fail(`list ${where} that does not resolve: ${(e as Error).message}`);
    }
    for (const [name, value] of Object.entries(params)) {
      if (resolved[name] !== value) fail(`list ${where} whose "${name}" does not apply`);
      if (specs.find((s) => s.name === name)!.default === value) fail(`list ${where} at the default "${name}"`);
    }
    if (resolved.unit === "train") fail(`list ${where} of the whole articulated train (a formation stands in for it)`);
    return JSON.stringify(Object.entries(params).sort());
  };
  if (ottd.presets) {
    if (!ottd.presets.length) fail("list an empty presets list");
    if (Object.keys(ottd.presets[0]!).length) fail("list a preset ahead of the default ({} comes first)");
    const keys = new Set<string>();
    for (const preset of ottd.presets) {
      const key = selection(preset, "a preset");
      if (keys.has(key)) fail(`list the preset ${key} twice`);
      keys.add(key);
    }
  }
  const names = new Set<string>();
  for (const f of ottd.formations ?? []) {
    if (!/^[\x20-\x7e]{1,40}$/.test(f.name)) fail(`name a formation "${f.name}" (1..40 printable ASCII characters)`);
    if (names.has(f.name)) fail(`name two formations "${f.name}"`);
    names.add(f.name);
    if (f.cars.length < 2) fail(`give the formation "${f.name}" fewer than two cars`);
    for (const car of f.cars) selection(car.params, `a car of the formation "${f.name}"`);
  }
}

/**
 * A vehicle's running figures, in the game's units: weight in tonnes, power in
 * kW, top speed in km/h, acceleration in m/s2. null where the game has no figure
 * (a coach's power, a cable car cabin's weight). Every key is required, so a
 * vehicle states each one, even as null.
 */
export interface VehiclePhysics {
  weight: number | null;
  power: number | null;
  maxspeed: number | null;
  accel: number | null;
}

/** A vehicle's game properties that may differ per parameter variant. */
export interface VehicleGameFields extends VehiclePhysics {
  /** Fraction of the model's height below the waterline. Ships only. */
  draftFrac?: number;
  /** Fraction of the model's height at the rope. Cable car cabins only. */
  ropeFrac?: number;
  /** Fraction of the model's height at the door sill. Cable car cabins only. */
  boardFrac?: number;
  /** The largest airport class the airframe needs: "small" | "medium" | "big". Aircraft only. */
  sizeClass?: string;
  /**
   * Where the game's Passenger camera sits, as a fraction of the body length from
   * the nose (0..1): the window seat with the best outlook, ahead of or behind the
   * wing. Aircraft only, and optional: without it the game uses its own default.
   */
  seatFrac?: number;
}

/** The game properties of one parameter variant: the fields that differ from the design's. */
export type VehicleGameVariant = { params: ParamValues } & Partial<VehicleGameFields>;

/** Which main squares a landmark may stand on (the webapp's core/city/CityPlaza.ts PlazaUse). */
export interface PlazaUse {
  cities: string[];
  layouts?: Array<"rect" | "radial">;
  fit?: "square" | "footprint";
  fullBlocks?: boolean;
  round?: boolean;
  apron?: number;
}

/** What of a building's footprint blocks rails and roads, as fractions of its plan (the webapp's BuildingBlockShape). */
export interface BlockShape {
  rects: Array<{ x: number; z: number; w: number; d: number }>;
}

/**
 * What the game needs of a model beyond its geometry, exported in its meta.json
 * entry (catalog.ts). Taken over once from the game's old hand-authored models
 * (docs/models/game-properties.md); a new design states its own.
 */
/**
 * One rope a cable car cabin hangs from or is hauled by, which the game draws (the
 * cabin itself draws none): `zFrac` across the rope (the cabin's +z, in the frame
 * where the rope runs along +x after the catalog's yaw) and `dyFrac` up from the rope
 * datum, both as fractions of the model's height, like ropeFrac. A haul rope goes
 * round the stations' bull wheels; a track rope is fixed and ends at each station.
 */
export interface CabinRopeFrac { kind: "haul" | "track"; zFrac: number; dyFrac: number }

/**
 * How a cable car cabin's line may run: `circulating` cabins (detachable gondolas, a
 * funitel, 3S and bicable cabins) may go round the wheels, any count; a `jigback`
 * cabin (an aerial tramway's) shuttles, one or two to a line.
 */
export type Ropeway = "circulating" | "jigback";

export interface GameProperties extends Partial<VehicleGameFields> {
  /** The ropes a cable car cabin hangs from (cable car cabins only, required there). */
  ropes?: CabinRopeFrac[];
  /** How a cable car cabin's line may run (cable car cabins only, required there). */
  ropeway?: Ropeway;
  /**
   * The vehicle's on-map size factor, where the game does not derive it from the
   * legacy table (a ship's or aircraft's length scale). Absent means 1.
   */
  scale?: number;
  /**
   * Parameter variants whose figures differ from the design's: `params` is the
   * variant's non-default selection, matched exactly; only the differing fields
   * are listed.
   */
  variants?: VehicleGameVariant[];
  /** A landmark's main-square rules. Buildings only. */
  plaza?: PlazaUse;
  /** A building's blocking footprint. Buildings only. */
  block?: BlockShape;
  /**
   * Which of its parameters the game's cities vary, replacing its pool's family
   * default (cityVariants.ts). Buildings only; usually left to the default.
   */
  city?: CityUse;
}

const PHYSICS_KEYS = ["weight", "power", "maxspeed", "accel"] as const;
const VEHICLE_KEYS = [...PHYSICS_KEYS, "scale", "draftFrac", "ropeFrac", "boardFrac", "sizeClass", "seatFrac", "variants"];

/**
 * Checks a design's game properties (GameProperties): a vehicle must have them,
 * with every running figure stated (a number or null), and each variant must name
 * a real, non-default parameter selection, at most once; a building may carry only
 * plaza and block rules. Throws, naming the design, so the build fails before
 * anything incomplete reaches the export.
 */
export function checkGameProperties(design: ProceduralDesign, vehicle: boolean): void {
  const game = design.game;
  const fail = (why: string): never => {
    throw new Error(`${design.id}: game properties ${why} (docs/models/game-properties.md)`);
  };
  if (!vehicle) {
    if (game && Object.keys(game).some((k) => k !== "plaza" && k !== "block" && k !== "city")) fail("of a building may hold only plaza, block and city");
    return;
  }
  if (!game) return fail("missing: a vehicle states its weight, power, maxspeed and accel");
  if (game.plaza || game.block || game.city) fail("of a vehicle hold no plaza, block or city");
  for (const k of PHYSICS_KEYS) {
    const v = game[k];
    if (v === undefined) fail(`lack "${k}" (use null for none)`);
    if (v !== null && (typeof v !== "number" || !Number.isFinite(v) || v < 0)) fail(`have an invalid "${k}": ${String(v)}`);
  }
  if (game.ropeFrac !== undefined) {
    if (!game.ropes?.length) fail('of a cable car cabin lack "ropes" (the ropes the game draws for it)');
    if (game.ropeway !== "circulating" && game.ropeway !== "jigback") fail('of a cable car cabin lack "ropeway" (circulating or jigback)');
    for (const r of game.ropes!) {
      if ((r.kind !== "haul" && r.kind !== "track") || !Number.isFinite(r.zFrac) || !Number.isFinite(r.dyFrac)) fail(`have an invalid rope: ${JSON.stringify(r)}`);
    }
    if (!game.ropes!.some((r) => r.dyFrac === 0)) fail("have no rope at the rope datum (ropeFrac)");
  } else if (game.ropes || game.ropeway) fail('hold "ropes" or "ropeway", which are for cable car cabins only');
  const seats = [game.seatFrac, ...(game.variants ?? []).map((v) => v.seatFrac)].filter((v) => v !== undefined);
  if (seats.length && design.catalog?.category !== "Aircraft") fail('hold a "seatFrac", which is for aircraft only');
  for (const v of seats) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) fail(`have an invalid "seatFrac": ${String(v)} (a fraction of the length, 0..1)`);
  }
  const specs = design.params ?? [];
  const seen = new Set<string>();
  for (const variant of game.variants ?? []) {
    const names = Object.keys(variant.params);
    if (!names.length) fail("list a variant without parameters");
    let resolved: ParamValues;
    try {
      resolved = resolveParams(specs, variant.params);
    } catch (e) {
      return fail(`list a variant that does not resolve: ${(e as Error).message}`);
    }
    for (const name of names) {
      if (resolved[name] !== variant.params[name]) fail(`list a variant whose "${name}" does not apply`);
      if (specs.find((s) => s.name === name)!.default === variant.params[name]) fail(`list a variant at the default "${name}"`);
    }
    const key = JSON.stringify(Object.entries(variant.params).sort());
    if (seen.has(key)) fail(`list the variant ${key} twice`);
    seen.add(key);
    if (Object.keys(variant).some((k) => k !== "params" && !VEHICLE_KEYS.includes(k))) fail("list a variant with an unknown field");
  }
}

/**
 * Every parameter of `specs` resolved: the given value or the default. Throws on
 * a name the design does not declare or a value its enum does not list, so a
 * typo never silently builds the default.
 */
export function resolveParams(specs: readonly ParamSpec[], given: ParamValues = {}): ParamValues {
  for (const name of Object.keys(given)) {
    if (!specs.some((s) => s.name === name)) throw new Error(`unknown parameter "${name}"`);
  }
  for (const s of specs) {
    const retired = s.retired?.[given[s.name] ?? ""];
    if (retired) given = { ...given, ...retired };
  }
  const out: ParamValues = {};
  for (const s of specs) {
    if (!paramApplies(s, out)) continue;
    const v = given[s.name] ?? s.default;
    if (!s.values.some((x) => x.value === v)) {
      throw new Error(`parameter "${s.name}" has no value "${v}" (expected ${s.values.map((x) => x.value).join(", ")})`);
    }
    out[s.name] = v;
  }
  return out;
}


/** Every combination of the parameters' values, the defaults first; [{}] for none. A conditional value is only where it is offered. */
export function paramCombinations(specs: readonly ParamSpec[] = []): ParamValues[] {
  let out: ParamValues[] = [{}];
  for (const s of specs) {
    // a conditional value (ParamValue.when) only where the values before it offer it (paramOffers.ts offeredValues)
    const ordered = (combo: ParamValues) => [s.default, ...s.values.filter((v) => !v.when || v.when.values.includes(combo[v.when.name] ?? "")).map((v) => v.value).filter((v) => v !== s.default)];
    out = out.flatMap((combo) => (paramApplies(s, combo) ? ordered(combo).map((v) => ({ ...combo, [s.name]: v })) : [combo]));
  }
  return out;
}

/** A party-wall parameter's name (partyWalls.ts: `partyLeft`, `partyBack`, ...). */
const PARTY_PARAM = /^party[A-Z]/;

/**
 * The combinations the tests build: every combination of the shape parameters
 * with the finish parameters at their defaults (the defaults first), then each
 * other value of each finish parameter with everything else at its default.
 * Without finish parameters this is paramCombinations(specs).
 */
export function coverageCombinations(specs: readonly ParamSpec[] = [], finishParams: readonly string[] = []): ParamValues[] {
  // a party wall (partyWalls.ts) changes no extent either: one at a time too
  const finish = [...finishParams, ...specs.filter((s) => PARTY_PARAM.test(s.name)).map((s) => s.name)];
  const shapes = paramCombinations(specs.filter((s) => !finish.includes(s.name)));
  const defaults = resolveParams(specs);
  const out = shapes.map((c) => ({ ...defaults, ...c }));
  for (const s of specs) {
    if (!finish.includes(s.name)) continue;
    if (!paramApplies(s, defaults)) continue;
    for (const v of s.values) if (v.value !== s.default && (!v.when || v.when.values.includes(defaults[v.when.name] ?? ""))) out.push({ ...defaults, [s.name]: v.value });
  }
  return out;
}

/**
 * The game-catalog fields a family of models shares, written into each model's
 * meta.json entry (catalog.ts): the picker category, the pool it is drawn from,
 * the on-map size, and the attribution.
 */
export interface CatalogFields {
  /** Degrees about Y to match the consumer vehicle forward convention. */
  yaw?: number;
  category: string;
  group: string;
  /** A powered rail vehicle's traction (a locomotive's, a unit's); absent for anything else. */
  traction?: Traction;
  /** A site preview's set type id (docs/models/previews.md): the id a saved game stores, shown in place of the model id. */
  gameId?: string;
  defaultScale: number;
  license: string;
  author: string;
  source: string;
}

/**
 * Binds the shared build functions `build(values, value)` and `buildLod(values, value)`
 * to one value (`bound`): the bound functions keep the shared names, which is what a
 * design's JS model imports from its source module.
 */
export function boundDesign(
  build: (params: ParamValues | undefined, value: string) => MeshBuilder,
  buildLod: (params: ParamValues | undefined, value: string) => MeshBuilder,
  value: string,
): { build: (params?: ParamValues) => MeshBuilder; buildLod: (params?: ParamValues) => MeshBuilder; bound: string } {
  const bind = (fn: (params: ParamValues | undefined, value: string) => MeshBuilder) =>
    Object.defineProperty((params?: ParamValues) => fn(params, value), "name", { value: fn.name });
  return { build: bind(build), buildLod: bind(buildLod), bound: value };
}
