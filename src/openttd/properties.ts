// What an exported vehicle is in OpenTTD: its vehicle type, its figures and its
// local id. Pure functions over the catalog record -- no DOM, no three -- so
// Vitest drives them in node.
//
// The figures come from three layers, later ones winning: the category defaults
// below, the design's declared `openttd` block (generator/design.ts
// OpenttdProperties) and that block's entry for the exported variant. The running
// figures (weight, power, speed) come from the record's `game`, with its variant
// overrides, as the game reads them.

import type { CatalogRecord } from "../../generator/catalog.ts";
import type { OpenttdCargoClass, OpenttdClimate, OpenttdFields } from "../../generator/design.ts";

/** OpenTTD's four vehicle types. */
export type OpenttdFeature = "train" | "road" | "ship" | "aircraft";

/** Every figure the GRF encoder writes for one vehicle, resolved. */
export interface ResolvedVehicle {
  feature: OpenttdFeature;
  name: string;
  introYear: number;
  vehicleLife: number;
  modelLife: number;
  reliabilityDecay: number;
  costFactor: number;
  runningCostFactor: number;
  capacity: number;
  cargo: string;
  climates: OpenttdClimate[];
  railType: string;
  refitClasses: OpenttdCargoClass[];
  /** Tonnes. */
  weight: number;
  /** kW; 0 makes a train vehicle a wagon. */
  power: number;
  /** km/h; 0 for no limit (a wagon). */
  speed: number;
  /** A train's traction, for its engine class and running cost base. */
  traction: "steam" | "diesel" | "electric" | null;
  /** A road vehicle running on tram tracks. */
  tram: boolean;
  /** An aircraft that cannot land at a small airport (the game's medium and big classes). */
  largeAircraft: boolean;
}

/**
 * The OpenTTD vehicle type of a catalog record, or null for what a GRF cannot
 * hold (buildings, cable car cabins). A tram is filed with the rail vehicles but
 * runs on OpenTTD's tram roads, so it is a road vehicle.
 */
export function openttdFeature(r: Pick<CatalogRecord, "category" | "group">): OpenttdFeature | null {
  if (r.category === "Rail vehicles") return r.group === "tram" ? "road" : "train";
  if (r.category === "Road vehicles") return "road";
  if (r.category === "Ships") return "ship";
  if (r.category === "Aircraft") return "aircraft";
  return null;
}

const ALL_BUT_TOYLAND: OpenttdClimate[] = ["temperate", "arctic", "tropical"];

/** The category defaults: what a vehicle that declares nothing exports with. */
export function defaultOpenttdFields(r: Pick<CatalogRecord, "category" | "group" | "traction">): Required<OpenttdFields> {
  const feature = openttdFeature(r);
  const base: Required<OpenttdFields> = {
    introYear: r.traction === "steam" ? 1900 : 1960,
    vehicleLife: 30,
    modelLife: 60,
    reliabilityDecay: 20,
    costFactor: 120,
    runningCostFactor: 100,
    capacity: 0,
    cargo: "PASS",
    climates: [...ALL_BUT_TOYLAND],
    railType: r.traction === "electric" || r.group === "metro" ? "ELRL" : "RAIL",
    refitClasses: [],
  };
  const per: Record<string, Partial<OpenttdFields>> = {
    loco: { costFactor: 140 },
    unit: { costFactor: 150, capacity: 120 },
    metro: { costFactor: 140, capacity: 150 },
    coach: { costFactor: 40, runningCostFactor: 30, capacity: 60 },
    wagon: { costFactor: 30, runningCostFactor: 20, capacity: 30, cargo: "GOOD", refitClasses: ["bulk", "piece", "liquid", "covered"] },
    tram: { costFactor: 130, capacity: 100 },
    bus: { costFactor: 110, capacity: 60 },
    truck: { costFactor: 110, capacity: 20, cargo: "GOOD", refitClasses: ["bulk", "piece", "liquid", "covered"] },
  };
  if (feature === "ship") return { ...base, costFactor: 150, runningCostFactor: 120, capacity: 300 };
  if (feature === "aircraft") return { ...base, costFactor: 180, runningCostFactor: 150, vehicleLife: 25, capacity: 150 };
  return { ...base, ...(per[r.group] ?? {}) };
}

/** The non-default selection `params` matches exactly (a variant's `params`). */
function sameSelection(a: Record<string, string>, b: Record<string, string>): boolean {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
}

/** Copy only the fields that are set, so an absent field never overwrites a default. */
function definedFields<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && k !== "params" && k !== "variants")) as Partial<T>;
}

/**
 * The model's display name in OpenTTD: its title, and for a variant the titles
 * of its non-default parameter values in brackets.
 */
export function variantName(r: Pick<CatalogRecord, "title" | "params">, params: Record<string, string>): string {
  const parts = (r.params ?? []).flatMap((p) => {
    const v = params[p.name];
    if (v === undefined || v === p.default) return [];
    return [p.values.find((x) => x.value === v)?.title ?? v];
  });
  return parts.length ? `${r.title} (${parts.join(", ")})` : r.title;
}

/**
 * Every figure of one exported vehicle: the record at the variant `params`
 * (its non-default values). Throws for a record a GRF cannot hold.
 */
export function resolveVehicle(r: CatalogRecord, params: Record<string, string>): ResolvedVehicle {
  const feature = openttdFeature(r);
  if (!feature) throw new Error(`${r.id} is not a vehicle OpenTTD can hold`);
  const declared = r.openttd;
  const variant = declared?.variants?.find((v) => sameSelection(v.params, params));
  const fields: Required<OpenttdFields> = {
    ...defaultOpenttdFields(r),
    ...(declared ? definedFields(declared) : {}),
    ...(variant ? definedFields(variant) : {}),
  };
  const game = r.game ?? {};
  const gameVariant = game.variants?.find((v) => sameSelection(v.params, params));
  const pick = (k: "weight" | "power" | "maxspeed"): number => {
    const v = gameVariant && gameVariant[k] !== undefined ? gameVariant[k] : game[k];
    return typeof v === "number" ? v : 0;
  };
  const traction = r.traction === "steam" || r.traction === "diesel" || r.traction === "electric" ? r.traction : null;
  return {
    feature,
    name: variantName(r, params),
    ...fields,
    climates: [...fields.climates],
    refitClasses: [...fields.refitClasses],
    weight: pick("weight"),
    power: pick("power"),
    speed: pick("maxspeed"),
    traction: feature === "train" && pick("power") > 0 ? (traction ?? (r.group === "metro" ? "electric" : "diesel")) : null,
    tram: feature === "road" && r.group === "tram",
    // OpenTTD knows small and large aircraft; only a small one lands at a small airport.
    largeAircraft: feature === "aircraft" && (gameVariant?.sizeClass ?? game.sizeClass ?? "big") !== "small",
  };
}

// --- lengths ---------------------------------------------------------------------

/**
 * The metres of vehicle one full OpenTTD length (8/8, half a tile) stands for:
 * one eighth per metre, the scale at which a model's width matches OpenTTD's own
 * vehicles, so a model keeps its true proportions (projection.ts). A 16.4 m
 * locomotive is 16/8 (two parts, one tile), a 26.4 m coach 26/8 (four parts).
 */
export const METRES_PER_FULL_LENGTH = 8;

/** The most parts one articulated OpenTTD vehicle may have (OpenTTD allows 100). */
export const MAX_PARTS = 32;

/**
 * A vehicle of `metres` in OpenTTD's eighths, split into parts of at most 8/8 of
 * as equal length as possible, the longer ones first. Ships and aircraft have no
 * length in OpenTTD: they are always one part.
 */
export function partLengths(metres: number, feature: OpenttdFeature): number[] {
  if (feature === "ship" || feature === "aircraft") return [8];
  const total = Math.max(1, Math.round((metres / METRES_PER_FULL_LENGTH) * 8));
  const parts = Math.min(MAX_PARTS, Math.ceil(total / 8));
  const eighths = Math.min(total, parts * 8);
  const out: number[] = [];
  for (let i = 0; i < parts; i++) out.push(Math.floor(eighths / parts) + (i < eighths % parts ? 1 : 0));
  return out;
}

// --- ids -------------------------------------------------------------------------

/** The local ids the export hands out: above every original vehicle, below the 14-bit limit of articulated parts. */
export const FIRST_LOCAL_ID = 0x0100;
export const LAST_LOCAL_ID = 0x3fff;

/** 32-bit FNV-1a of a string's UTF-16 code units. */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The stable key of one exported vehicle part: model id, sorted non-default params and part index. */
export function partKey(id: string, params: Record<string, string>, part: number): string {
  const sel = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return `${id}?${sel}#${part}`;
}

/**
 * The local id of every key, per OpenTTD feature: hashed into
 * FIRST_LOCAL_ID..LAST_LOCAL_ID, a collision probing to the next free id. Keys
 * are placed in sorted order, so the result depends only on the set of keys, not
 * on the order they were added in, and a key keeps its id unless it collides.
 */
export function assignIds(keys: readonly string[]): Map<string, number> {
  const span = LAST_LOCAL_ID - FIRST_LOCAL_ID + 1;
  if (keys.length > span) throw new Error(`too many vehicles for one GRF: ${keys.length}`);
  const out = new Map<string, number>();
  const used = new Set<number>();
  for (const key of [...new Set(keys)].sort()) {
    let slot = fnv1a(key) % span;
    while (used.has(slot)) slot = (slot + 1) % span;
    used.add(slot);
    out.set(key, FIRST_LOCAL_ID + slot);
  }
  return out;
}

/**
 * The set's four-byte GRF id: "RI" and a 16-bit hash of its name, so the same
 * name always makes the same GRF and OpenTTD keeps a saved game's vehicles.
 */
export function grfIdOf(name: string): Uint8Array {
  const h = fnv1a(name.trim());
  return new Uint8Array([0x52, 0x49, (h >>> 8) & 0xff, h & 0xff]);
}
