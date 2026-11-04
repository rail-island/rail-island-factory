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

/**
 * The local ids the export hands out, per OpenTTD vehicle type: above every
 * original vehicle, below the 14-bit limit of articulated parts. The committed id
 * table (generator/openttdIds.json) owns FIRST_LOCAL_ID..LAST_TABLE_ID - every
 * preset's and formation's block of part ids, unique across all models - and an
 * export-list entry that is no preset is hashed into HASHED_FIRST_ID..LAST_LOCAL_ID.
 */
export const FIRST_LOCAL_ID = 0x0100;
export const LAST_TABLE_ID = 0x2fff;
export const HASHED_FIRST_ID = 0x3000;
export const LAST_LOCAL_ID = 0x3fff;

/**
 * The part ids the table reserves for a new preset or formation: twice the parts
 * it is measured at when its ids are first assigned, at least MIN_BLOCK, at most
 * OpenTTD's MAX_PARTS - room to grow without its ids moving. A block keeps its
 * size for ever; the first blocks, assigned before vehicles were measured, hold
 * 16 (a preset) or 32 (a formation).
 */
export const MIN_BLOCK = 4;
export function blockSizeFor(parts: number): number {
  return Math.min(MAX_PARTS, Math.max(MIN_BLOCK, 2 * parts));
}

/**
 * The low 16 bits of a GRF id ("RI" and two bytes): 0x0001..0x7FFF a one-click
 * model GRF's, from the id table; 0x8000..0xFFFF a user's set's, chosen in the
 * Export panel.
 */
export const MODEL_GRF_FIRST = 0x0001;
export const MODEL_GRF_LAST = 0x7fff;
export const SET_GRF_FIRST = 0x8000;
export const SET_GRF_LAST = 0xffff;

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
 * HASHED_FIRST_ID..LAST_LOCAL_ID (the table's ids lie below), a collision probing
 * to the next free id. Keys are placed in sorted order, so the result depends only
 * on the set of keys, not on the order they were added in, and a key keeps its id
 * unless it collides.
 */
export function assignIds(keys: readonly string[]): Map<string, number> {
  const span = LAST_LOCAL_ID - HASHED_FIRST_ID + 1;
  if (keys.length > span) throw new Error(`too many vehicles for one GRF: ${keys.length}`);
  const out = new Map<string, number>();
  const used = new Set<number>();
  for (const key of [...new Set(keys)].sort()) {
    let slot = fnv1a(key) % span;
    while (used.has(slot)) slot = (slot + 1) % span;
    used.add(slot);
    out.set(key, HASHED_FIRST_ID + slot);
  }
  return out;
}

/** The four bytes of a GRF id: "RI" and its low 16 bits, high byte first. */
export function grfIdBytes(low: number): Uint8Array {
  if (!Number.isInteger(low) || low < MODEL_GRF_FIRST || low > SET_GRF_LAST) throw new Error(`a GRF id's low 16 bits run 0001..FFFF: ${low}`);
  return new Uint8Array([0x52, 0x49, (low >>> 8) & 0xff, low & 0xff]);
}

/** A GRF id as OpenTTD's NewGRF window shows it: "52490001". */
export function grfIdText(low: number): string {
  return [...grfIdBytes(low)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * The GRF id a user's set gets until they choose one: its name hashed into the
 * users' half, 0x8000..0xFFFF, so the same name gives the same id.
 */
export function defaultSetGrfId(name: string): number {
  return SET_GRF_FIRST | (fnv1a(name.trim()) & 0x7fff);
}

/** A user's GRF id typed as 4 hex digits ("8A3F"), or null when it is none or not in the users' half. */
export function parseSetGrfId(text: string): number | null {
  const t = text.trim();
  if (!/^[0-9a-fA-F]{4}$/.test(t)) return null;
  const v = parseInt(t, 16);
  return v >= SET_GRF_FIRST && v <= SET_GRF_LAST ? v : null;
}

// --- presets and formations ----------------------------------------------------------

/** One car of an exported vehicle: a selection of the record, drawn facing backwards when `turned`. */
export interface ExportCar {
  params: Record<string, string>;
  turned?: boolean;
}

/**
 * One vehicle a GRF holds: a single car (an export-list entry or a preset) or a
 * formation of several. `key` names it for its ids (partKey); `variantOf` is the
 * index of the item it is grouped under in OpenTTD's purchase list.
 */
export interface ExportItem {
  record: CatalogRecord;
  key: Record<string, string>;
  cars: ExportCar[];
  /** Set for a formation: its name. */
  formation?: string;
  variantOf?: number;
  /**
   * The first of the part ids the committed id table reserves for it (a preset's
   * or formation's block) and how many; absent for an export-list entry that is no
   * preset, whose ids are hashed (assignIds).
   */
  baseId?: number;
  blockSize?: number;
}

/**
 * What the one-click download exports of a record: every preset, the default
 * first, then every formation, all grouped under the default.
 */
export function oneClickItems(r: CatalogRecord): ExportItem[] {
  const presets = r.openttd?.presets?.length ? r.openttd.presets : [{}];
  const ids = r.openttd?.ids;
  const items: ExportItem[] = presets.map((p, i) => ({
    record: r, key: { ...p }, cars: [{ params: { ...p } }],
    ...(i ? { variantOf: 0 } : {}),
    ...(ids?.presets[i] ? { baseId: ids.presets[i]!.id, blockSize: ids.presets[i]!.size } : {}),
  }));
  for (const [i, f] of (r.openttd?.formations ?? []).entries()) {
    items.push({
      record: r,
      key: { formation: f.name },
      cars: f.cars.map((c) => ({ params: { ...c.params }, ...(c.turned ? { turned: true } : {}) })),
      formation: f.name,
      variantOf: 0,
      ...(ids?.formations[i] ? { baseId: ids.formations[i]!.id, blockSize: ids.formations[i]!.size } : {}),
    });
  }
  return items;
}

/**
 * The table's first part id of the preset with exactly these non-default values
 * (an export-list entry that is a preset keeps its one-click ids), or undefined.
 */
export function presetBlock(r: CatalogRecord, params: Record<string, string>): { id: number; size: number } | undefined {
  const presets = r.openttd?.presets ?? [];
  const i = presets.findIndex((p) => sameSelection(p, params));
  return i >= 0 ? r.openttd?.ids?.presets[i] : undefined;
}

/**
 * The one-click item a selection of the model page's parameters stands for: the
 * index of the preset with exactly those non-default values, or -1 when the
 * selection is no preset (the pack does not hold it).
 */
export function oneClickIndex(items: readonly ExportItem[], params: Record<string, string>): number {
  return items.findIndex((i) => !i.formation && sameSelection(i.key, params));
}

const clampByte = (v: number): number => Math.min(255, Math.max(0, Math.round(v)));

/**
 * The figures of an exported item: a single car's resolveVehicle; a formation's
 * head car with the formation's name, the sum of its cars' power, purchase and
 * running costs, and the traction of a powered train. Its cars' own figures
 * (capacity, weight) go on their parts (exportRun.ts).
 */
export function resolveItem(item: ExportItem): { vehicle: ResolvedVehicle; cars: ResolvedVehicle[] } {
  const cars = item.cars.map((c) => resolveVehicle(item.record, c.params));
  const head = cars[0]!;
  if (!item.formation) return { vehicle: head, cars };
  const power = cars.reduce((s, c) => s + c.power, 0);
  const r = item.record;
  const traction = r.traction === "steam" || r.traction === "diesel" || r.traction === "electric" ? r.traction : null;
  const vehicle: ResolvedVehicle = {
    ...head,
    name: `${variantName(r, item.cars[0]!.params)} (${item.formation})`,
    power,
    speed: cars.reduce((s, c) => (c.speed > 0 ? (s > 0 ? Math.min(s, c.speed) : c.speed) : s), 0),
    costFactor: clampByte(cars.reduce((s, c) => s + c.costFactor, 0)),
    runningCostFactor: clampByte(cars.reduce((s, c) => s + c.runningCostFactor, 0)),
    traction: head.feature === "train" && power > 0 ? (traction ?? (r.group === "metro" ? "electric" : "diesel")) : null,
  };
  return { vehicle, cars };
}

/** `total` split over `n` parts as evenly as possible, the larger shares first. */
export function shares(total: number, n: number): number[] {
  const t = Math.max(0, Math.round(total));
  return Array.from({ length: n }, (_, i) => Math.floor(t / n) + (i < t % n ? 1 : 0));
}
