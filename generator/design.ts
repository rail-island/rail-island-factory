// What every procedural model is: an id, a title and the function that builds
// it. The skyscrapers (skyscrapers.ts) and the vehicles (vehicles.ts) are lists
// of these; generate.ts runs them. No `node:` imports.
//
// A design may be PARAMETRIC: it declares enum parameters (`params`), each with
// its values and a default, and `build` takes the chosen values. The export holds
// one GLB, thumbnail and source tree per design, built with the defaults; the
// meta and catalog entries list the parameters, and the standalone JS model's
// `build(THREE, params)` builds any combination (docs/models/parameters.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { CityUse } from "./cityPresets.ts";

/** What drives a powered rail vehicle. */
export type Traction = "electric" | "diesel" | "steam";

/** One value of an enum parameter. */
export interface ParamValue {
  /** The stable token, e.g. "classA": what a caller passes and a saved map would store. */
  value: string;
  /** What a picker shows, e.g. "Class A (1st class)". */
  title: string;
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
  lodTriangles?: 100 | 200 | 300 | 500 | 12000;
  /**
   * The names of the parameters that only recolour the model (a roof or wall
   * colour): they change no geometry, so the tests vary them one value at a
   * time instead of multiplying every combination by them (coverageCombinations).
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
   * What an OpenTTD GRF export needs of a vehicle beyond `game`: dates, costs,
   * capacity, climates (OpenttdProperties). Optional: the site fills every missing
   * field from the vehicle's category (docs/site/openttd-export.md).
   */
  openttd?: OpenttdProperties;
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

/** What an OpenTTD GRF export needs of a vehicle (ProceduralDesign.openttd). */
export interface OpenttdProperties extends OpenttdFields {
  /** Parameter variants whose figures differ, matched like GameProperties.variants. */
  variants?: OpenttdVariant[];
}

const OPENTTD_RANGES: Record<string, [number, number]> = {
  introYear: [1, 5000000], vehicleLife: [1, 255], modelLife: [1, 255], reliabilityDecay: [0, 255],
  costFactor: [0, 255], runningCostFactor: [0, 255], capacity: [0, 65535],
};
const OPENTTD_CLIMATES: readonly string[] = ["temperate", "arctic", "tropical", "toyland"];

/**
 * Checks a design's optional OpenTTD properties (OpenttdProperties): only a
 * vehicle may carry them, every figure is an integer in its range, labels are four
 * printable ASCII characters, and each variant names a real, non-default parameter
 * selection at most once. Throws, naming the design.
 */
export function checkOpenttdProperties(design: ProceduralDesign, vehicle: boolean): void {
  const ottd = design.openttd;
  if (!ottd) return;
  const fail = (why: string): never => {
    throw new Error(`${design.id}: openttd properties ${why} (docs/site/openttd-export.md)`);
  };
  if (!vehicle) fail("belong to vehicles only");
  const checkFields = (f: OpenttdFields & { params?: ParamValues; variants?: unknown }, where: string) => {
    for (const [k, v] of Object.entries(f)) {
      if (k === "params" || k === "variants") continue;
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
export interface GameProperties extends Partial<VehicleGameFields> {
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
   * The variants the game's city generator builds of it, replacing its pool's
   * family default (cityPresets.ts). Buildings only; usually left to the default.
   */
  city?: CityUse;
}

const PHYSICS_KEYS = ["weight", "power", "maxspeed", "accel"] as const;
const VEHICLE_KEYS = [...PHYSICS_KEYS, "scale", "draftFrac", "ropeFrac", "boardFrac", "sizeClass", "variants"];

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

/** Every combination of the parameters' values, the defaults first; [{}] for none. */
export function paramCombinations(specs: readonly ParamSpec[] = []): ParamValues[] {
  let out: ParamValues[] = [{}];
  for (const s of specs) {
    const ordered = [s.default, ...s.values.map((v) => v.value).filter((v) => v !== s.default)];
    out = out.flatMap((combo) => (paramApplies(s, combo) ? ordered.map((v) => ({ ...combo, [s.name]: v })) : [combo]));
  }
  return out;
}

/**
 * The combinations the tests build: every combination of the shape parameters
 * with the finish parameters at their defaults (the defaults first), then each
 * other value of each finish parameter with everything else at its default.
 * Without finish parameters this is paramCombinations(specs).
 */
export function coverageCombinations(specs: readonly ParamSpec[] = [], finish: readonly string[] = []): ParamValues[] {
  const shapes = paramCombinations(specs.filter((s) => !finish.includes(s.name)));
  const defaults = resolveParams(specs);
  const out = shapes.map((c) => ({ ...defaults, ...c }));
  for (const s of specs) {
    if (!finish.includes(s.name)) continue;
    if (!paramApplies(s, defaults)) continue;
    for (const v of s.values) if (v.value !== s.default) out.push({ ...defaults, [s.name]: v.value });
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
