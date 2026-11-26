// The passenger and cargo numbers the game's traffic engine reads
// (docs/models/traffic.md): a building's `game.traffic` (residents, jobs, the
// commodities it makes from nothing, consumes or processes by a recipe) and a
// vehicle's `game.capacity` (seats, tonnes and the commodities it may carry), and
// the check that the supply chain has no orphan. Stated by hand per design in
// generator/trafficTable.ts and generator/capacityTable.ts, keyed by the exported
// model id, and merged into the meta entries by the export only.
//
// Kept apart from the designs on purpose, like the sounds (soundTable.ts): a design
// module, and design.ts with its types, is bundled into each of its models' JS
// files, so a number stated there would rewrite every model of the module though
// none of them changed.

import { proceduralId } from "./modelId.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";

/**
 * What is carried besides passengers: the commodities of the supply chain, in the
 * order lists and the UI show them. The ids are stored in players' saved games (the
 * game's traffic.json): never rename one.
 */
export const COMMODITIES = ["grain", "wood", "coal", "iron-ore", "oil", "food", "steel", "fuel", "goods", "mail"] as const;
export type Commodity = (typeof COMMODITIES)[number];

/**
 * A commodity's place in the chain: `raw` is made from nothing at a fixed rate by a
 * primary industry, `processed` only by a recipe (`processes`) from other
 * commodities, `town` (mail) by and for towns, outside the industry chain.
 */
export const COMMODITY_KINDS: Readonly<Record<Commodity, "raw" | "processed" | "town">> = {
  grain: "raw",
  wood: "raw",
  coal: "raw",
  "iron-ore": "raw",
  oil: "raw",
  food: "processed",
  steel: "processed",
  fuel: "processed",
  goods: "processed",
  mail: "town",
};

/** Tonnes by commodity; a unit is one tonne. */
export type Tonnes = Partial<Record<Commodity, number>>;

/**
 * A processor's recipe: it turns delivered inputs into its output and makes nothing
 * without them. Its inputs are accepted implicitly (not listed in `accepts`).
 */
export interface Recipe {
  /** What it makes: a processed commodity. */
  output: Commodity;
  /** Tonnes of each input used per tonne of output. */
  inputs: Tonnes;
  /** At most this many tonnes of output per minute of game time. */
  rate: number;
  /** The stockpile cap, tonnes, per input: about 10 minutes of input at the full rate. */
  stock: number;
}

/** A building's traffic fields; a variant states only those that differ. */
export interface BuildingTrafficFields {
  /** People living in it. */
  residents?: number;
  /** People working in it. */
  jobs?: number;
  /** What it makes from nothing, tonnes per minute of game time: a primary industry's raw commodity, a town's mail. */
  produces?: Tonnes;
  /** What it consumes on delivery (a town, a sink). */
  accepts?: Commodity[];
  /** Its recipe, when it is a processor; a variant replaces it whole. */
  processes?: Recipe;
  /** A visitor site (a cathedral, a lookout tower, a castle): the tourists it holds at once; a variant replaces it whole. */
  visitors?: VisitorSite;
}

/**
 * A tourist destination: people travel to it from their homes, stay `stayMin`
 * minutes of game time and travel back the way they came. `capacity` is how many
 * visitors it holds at once - its pull falls as it fills - and is independent of
 * its staff (`jobs`).
 */
export interface VisitorSite {
  /** Visitors present at once, whole people. */
  capacity: number;
  /** The mean stay, minutes of game time. */
  stayMin: number;
}

/** A vehicle's capacity fields; a variant states only those that differ. */
export interface VehicleCapacityFields {
  /** Passengers it carries, seated and standing. */
  seats?: number;
  /** Tonnes of freight it carries, one commodity at a time; stated together with `commodities`. */
  tonnes?: number;
  /** The commodities it may carry; non-empty exactly when `tonnes` is above 0. */
  commodities?: Commodity[];
}

/**
 * A variant's numbers: they apply where every listed parameter has the listed value
 * (other parameters, a livery or a colour, do not matter); later variants win, field
 * by field.
 */
export type TrafficVariant<F> = { params: ParamValues } & F;

/** A design's entry in a table: its numbers at its default parameters, and its variants. */
export type TableEntry<F> = F & {
  variants?: TrafficVariant<F>[];
  /**
   * The design carries nothing though its group does (a tug among the ships, a
   * caboose among the wagons): it states no numbers, and `source` says why. Exported
   * as `{}`, like a locomotive's.
   */
  nothing?: true;
  /** Where the numbers came from (a real type's published figures, or "size"); not exported. */
  source?: string;
};

export type BuildingTrafficEntry = TableEntry<BuildingTrafficFields>;
export type VehicleCapacityEntry = TableEntry<VehicleCapacityFields>;

/**
 * The unit of every rate in a building's traffic block: tonnes per minute of game
 * time. The export writes it on every non-empty block, so the game can tell this
 * table from an older per-hour import (a block without it).
 */
export const TRAFFIC_UNIT = "min";

/** The exported blocks: the table entry without its source. Empty `{}` means none. */
export type ExportedTraffic = BuildingTrafficFields & {
  /** The rates' unit (TRAFFIC_UNIT), on every non-empty building block; a variant carries none, the block's applies. */
  unit?: typeof TRAFFIC_UNIT;
  variants?: TrafficVariant<BuildingTrafficFields>[];
};
export type ExportedCapacity = VehicleCapacityFields & { variants?: TrafficVariant<VehicleCapacityFields>[] };

/** Building categories whose designs generate nothing; every other building must state its traffic. */
export const QUIET_BUILDING_CATEGORIES: readonly string[] = ["Station", "Decor"];

/** Vehicle groups that carry nothing (a locomotive, a cable car's machinery); every other vehicle must state its capacity. */
export const EMPTY_VEHICLE_GROUPS: readonly string[] = ["loco", "cablecar"];

/** Vehicle catalog categories (catalog.ts VEHICLE_CATEGORIES). */
const VEHICLE_CATEGORIES: readonly string[] = ["Rail vehicles", "Road vehicles", "Ships", "Aircraft", "Cable car"];

export function isVehicleCategory(category: string): boolean {
  return VEHICLE_CATEGORIES.includes(category);
}

/** True when a design of this category and group must state its numbers. */
export function mustCarry(category: string, group: string): boolean {
  return isVehicleCategory(category) ? !EMPTY_VEHICLE_GROUPS.includes(group) : !QUIET_BUILDING_CATEGORIES.includes(category);
}

/** Sanity bounds: anything above is a typo, not a design. */
const MAX = { residents: 20_000, jobs: 20_000, produces: 2_000, seats: 3_000, tonnes: 250_000, rate: 2_000, stock: 100_000, input: 10, visitors: 20_000, stayMin: 240 } as const;

const BUILDING_FIELDS = ["residents", "jobs", "produces", "accepts", "processes", "visitors"];
const VISITOR_FIELDS = ["capacity", "stayMin"];
const VEHICLE_FIELDS = ["seats", "tonnes", "commodities"];
const RECIPE_FIELDS = ["output", "inputs", "rate", "stock"];

const isCommodity = (c: unknown): c is Commodity => (COMMODITIES as readonly unknown[]).includes(c);

function count(v: unknown, max: number, integer: boolean): string | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return `${String(v)} is not a number >= 0`;
  if (integer && !Number.isInteger(v)) return `${v} is not a whole number`;
  if (v > max) return `${v} is over ${max}`;
  return null;
}

/** A positive amount: a rate, a stock, an input share. */
function positive(where: string, v: unknown, max: number): string[] {
  const bad = count(v, max, false);
  if (bad) return [`${where}: ${bad}`];
  return v === 0 ? [`${where} is 0`] : [];
}

function tonnesProblems(where: string, v: unknown, max: number): string[] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return [`${where} is not an object of commodities`];
  const out: string[] = [];
  for (const [k, n] of Object.entries(v)) {
    if (!isCommodity(k)) out.push(`${where} names an unknown commodity "${k}"`);
    const bad = count(n, max, false);
    if (bad) out.push(`${where}.${k}: ${bad}`);
    else if (n === 0) out.push(`${where}.${k} is 0 (leave the commodity out)`);
  }
  return out;
}

function listProblems(where: string, v: unknown): string[] {
  if (!Array.isArray(v)) return [`${where} is not a list`];
  const out: string[] = [];
  for (const c of v) if (!isCommodity(c)) out.push(`${where} names an unknown commodity "${String(c)}"`);
  if (new Set(v).size !== v.length) out.push(`${where} lists a commodity twice`);
  return out;
}

function recipeProblems(where: string, r: unknown): string[] {
  if (!r || typeof r !== "object" || Array.isArray(r)) return [`${where} is not a recipe object`];
  const f = r as Record<string, unknown>;
  const out: string[] = [];
  for (const k of Object.keys(f)) if (!RECIPE_FIELDS.includes(k)) out.push(`${where} has an unknown field "${k}"`);
  if (!isCommodity(f.output)) out.push(`${where}.output names an unknown commodity "${String(f.output)}"`);
  else if (COMMODITY_KINDS[f.output] !== "processed") out.push(`${where}.output "${f.output}" is not a processed commodity (raw ones and mail are made with produces)`);
  if (f.inputs === undefined) out.push(`${where} has no inputs`);
  else {
    const inputs = f.inputs as Record<string, unknown>;
    const bad = tonnesProblems(`${where}.inputs`, inputs, MAX.input);
    out.push(...bad);
    if (!bad.length && !Object.keys(inputs).length) out.push(`${where}.inputs is empty`);
    if (isCommodity(f.output) && inputs && typeof inputs === "object" && f.output in inputs) out.push(`${where}: its output "${f.output}" is among its inputs`);
  }
  out.push(...positive(`${where}.rate`, f.rate, MAX.rate));
  out.push(...positive(`${where}.stock`, f.stock, MAX.stock));
  return out;
}

function visitorProblems(where: string, v: unknown): string[] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return [`${where} is not a visitor site object`];
  const f = v as Record<string, unknown>;
  const out: string[] = [];
  for (const k of Object.keys(f)) if (!VISITOR_FIELDS.includes(k)) out.push(`${where} has an unknown field "${k}"`);
  const cap = count(f.capacity, MAX.visitors, true);
  if (cap) out.push(`${where}.capacity: ${cap}`);
  else if (f.capacity === 0) out.push(`${where}.capacity is 0 (leave visitors out)`);
  out.push(...positive(`${where}.stayMin`, f.stayMin, MAX.stayMin));
  return out;
}

function fieldProblems(where: string, f: Record<string, unknown>, vehicle: boolean): string[] {
  const out: string[] = [];
  for (const k of Object.keys(f)) if (!(vehicle ? VEHICLE_FIELDS : BUILDING_FIELDS).includes(k)) out.push(`${where} has an unknown field "${k}"`);
  const num = (k: "residents" | "jobs" | "seats" | "tonnes", integer: boolean) => {
    if (f[k] === undefined) return;
    const bad = count(f[k], MAX[k], integer);
    if (bad) out.push(`${where}.${k}: ${bad}`);
  };
  if (vehicle) {
    num("seats", true);
    num("tonnes", false);
    if (f.commodities !== undefined) out.push(...listProblems(`${where}.commodities`, f.commodities));
    // stated together, so a variant never pairs one block's tonnes with another's list
    if ((f.tonnes === undefined) !== (f.commodities === undefined)) out.push(`${where} states ${f.tonnes === undefined ? "commodities without tonnes" : "tonnes without commodities"} (state both)`);
    else if (f.tonnes !== undefined && Array.isArray(f.commodities) && ((f.tonnes as number) > 0) !== (f.commodities.length > 0)) {
      out.push(`${where}: tonnes ${String(f.tonnes)} with ${f.commodities.length} commodities (tonnes > 0 exactly when it carries a commodity)`);
    }
  } else {
    num("residents", true);
    num("jobs", true);
    if (f.produces !== undefined) {
      out.push(...tonnesProblems(`${where}.produces`, f.produces, MAX.produces));
      for (const c of Object.keys((f.produces as object | null) ?? {})) {
        if (isCommodity(c) && COMMODITY_KINDS[c] === "processed") out.push(`${where}.produces "${c}" from nothing (a processed commodity is made by a recipe: processes)`);
      }
    }
    if (f.accepts !== undefined) out.push(...listProblems(`${where}.accepts`, f.accepts));
    if (f.processes !== undefined) out.push(...recipeProblems(`${where}.processes`, f.processes));
    if (f.visitors !== undefined) out.push(...visitorProblems(`${where}.visitors`, f.visitors));
  }
  return out;
}

/** The problems between a building's fields as one selection resolves them (its recipe against what it makes and takes). */
function selectionProblems(where: string, f: BuildingTrafficFields): string[] {
  const r = f.processes;
  if (!r || typeof r !== "object") return [];
  const out: string[] = [];
  for (const c of f.accepts ?? []) if (r.inputs && c in r.inputs) out.push(`${where} accepts "${c}", which its recipe already takes`);
  if (f.produces && r.output in f.produces) out.push(`${where} produces "${r.output}" from nothing and by its recipe`);
  return out;
}

/** True when the fields say the design generates, accepts or carries anything. */
function carriesAnything(f: Record<string, unknown>, vehicle: boolean): boolean {
  if (vehicle) return (f.seats as number) > 0 || (f.tonnes as number) > 0;
  return (
    (f.residents as number) > 0 ||
    (f.jobs as number) > 0 ||
    Object.keys((f.produces as object | undefined) ?? {}).length > 0 ||
    ((f.accepts as unknown[] | undefined) ?? []).length > 0 ||
    f.processes !== undefined ||
    f.visitors !== undefined
  );
}

/** A variant's parameters name the design's parameters and values, and apply together. */
function variantProblems(where: string, specs: readonly ParamSpec[], params: unknown): string[] {
  if (!params || typeof params !== "object" || !Object.keys(params).length) return [`${where} lists no parameters`];
  let resolved: ParamValues;
  try {
    resolved = resolveParams(specs, params as ParamValues);
  } catch (e) {
    return [`${where} does not resolve: ${(e as Error).message}`];
  }
  const out: string[] = [];
  for (const [name, value] of Object.entries(params as ParamValues)) {
    if (resolved[name] !== value) out.push(`${where}: "${name}" does not apply with the other parameters`);
  }
  return out;
}

/**
 * The problems of a design's table entry, or of a missing one: a design that must
 * carry (mustCarry) states an entry that carries something; every number is a sane
 * count, every commodity known, every recipe sane, every variant a real selection.
 */
export function trafficProblems(
  design: Pick<ProceduralDesign, "id" | "params">,
  fields: { category: string; group: string },
  entry: BuildingTrafficEntry | VehicleCapacityEntry | undefined,
): string[] {
  const vehicle = isVehicleCategory(fields.category);
  const table = vehicle ? "capacityTable.ts" : "trafficTable.ts";
  // named by the exported id, as the tables key it
  design = { ...design, id: proceduralId(design.id) };
  if (!entry) return mustCarry(fields.category, fields.group) ? [`${design.id}: no entry in generator/${table} (docs/models/traffic.md)`] : [];
  const { variants, source, nothing, ...base } = entry as TableEntry<Record<string, unknown>>;
  if (nothing !== undefined) {
    const out: string[] = [];
    if (nothing !== true) out.push(`${design.id}: an invalid "nothing": ${String(nothing)} (true or absent)`);
    if (Object.keys(base).length || variants) out.push(`${design.id}: "nothing" with numbers`);
    if (typeof source !== "string" || !source.trim()) out.push(`${design.id}: "nothing" without a "source" saying why`);
    return out.map((p) => `${p} (generator/${table})`);
  }
  const out = fieldProblems(design.id, base, vehicle);
  if (source !== undefined && (typeof source !== "string" || !source.trim())) out.push(`${design.id}: an empty "source"`);
  // a power car may carry nothing while its set's other cars and the whole set do
  const anywhere = carriesAnything(base, vehicle) || (variants ?? []).some((v) => carriesAnything(v as Record<string, unknown>, vehicle));
  if (mustCarry(fields.category, fields.group) && !anywhere) {
    out.push(`${design.id}: ${vehicle ? "carries" : "generates and accepts"} nothing at its defaults or in any variant (say so with "nothing")`);
  }
  const specs = design.params ?? [];
  const seen = new Set<string>();
  (variants ?? []).forEach((v, i) => {
    const where = `${design.id} variant ${i + 1}`;
    const { params, ...f } = v as TrafficVariant<Record<string, unknown>>;
    out.push(...variantProblems(where, specs, params));
    const key = JSON.stringify(Object.entries(params ?? {}).sort());
    if (seen.has(key)) out.push(`${where} repeats the parameters ${key}`);
    seen.add(key);
    if (!Object.keys(f).length) out.push(`${where} states no numbers`);
    out.push(...fieldProblems(where, f, vehicle));
  });
  // a building's recipe against what it makes and takes, as each selection resolves them
  if (!vehicle && !out.length) {
    const block = base as BuildingTrafficFields & { variants?: TrafficVariant<BuildingTrafficFields>[] };
    out.push(...selectionProblems(design.id, block));
    (variants ?? []).forEach((v, i) => {
      out.push(...selectionProblems(`${design.id} variant ${i + 1}`, resolvedNumbers(specs, { ...block, variants: variants as TrafficVariant<BuildingTrafficFields>[] }, v.params)));
    });
  }
  return out.map((p) => `${p} (generator/${table})`);
}

/** The exported block: the entry without its source; `{}` for a design that carries nothing. */
export function exportedBlock(entry: BuildingTrafficEntry | VehicleCapacityEntry | undefined): ExportedTraffic | ExportedCapacity {
  if (!entry || entry.nothing) return {};
  const { source: _source, nothing: _nothing, ...rest } = entry;
  return JSON.parse(JSON.stringify(rest)) as ExportedTraffic | ExportedCapacity;
}

/** A building's exported `game.traffic`: the block marked with its unit (TRAFFIC_UNIT); `{}` stays `{}`. */
export function exportedTraffic(entry: BuildingTrafficEntry | undefined): ExportedTraffic {
  const block = exportedBlock(entry) as ExportedTraffic;
  return Object.keys(block).length ? { unit: TRAFFIC_UNIT, ...block } : {};
}

/**
 * A design's numbers for one selection, the way the game resolves them: the
 * design's fields, then each variant whose every parameter matches, in order.
 * Used by the checks and the review table; the game has its own copy.
 */
export function resolvedNumbers<F extends object>(
  specs: readonly ParamSpec[],
  block: F & { variants?: TrafficVariant<F>[] },
  values: ParamValues,
): F {
  const resolved = resolveParams(specs, values);
  const { variants, ...base } = block;
  let out = { ...base } as F;
  for (const v of variants ?? []) {
    const { params, ...f } = v;
    if (Object.entries(params).every(([k, x]) => resolved[k] === x)) out = { ...out, ...f };
  }
  return out;
}

/** The ids a table names that no design has. */
export function unknownTrafficIds(table: Readonly<Record<string, unknown>>, ids: Iterable<string>): string[] {
  const known = new Set(ids);
  return Object.keys(table).filter((id) => !known.has(id)).sort();
}

/** A confirmed design's exported block, for the chain check. */
export interface ChainDesign {
  id: string;
  params?: readonly ParamSpec[];
  block: ExportedTraffic | ExportedCapacity;
}

/** Who makes, takes and carries each commodity, by model id (sorted). */
export interface ChainLink {
  /** Buildings that make it: from nothing (`produces`) or by a recipe (`processes.output`). */
  producers: string[];
  /** Buildings that take it: as final consumption (`accepts`) or as a recipe input. */
  consumers: string[];
  /** Vehicles that may carry it. */
  carriers: string[];
}

/** Every selection a block names: its defaults and each variant, resolved as the game resolves them. */
function selections<F extends object>(d: { params?: readonly ParamSpec[] }, block: F & { variants?: TrafficVariant<F>[] }): F[] {
  const specs = d.params ?? [];
  return [resolvedNumbers(specs, block, {}), ...(block.variants ?? []).map((v) => resolvedNumbers(specs, block, v.params))];
}

/** The supply chain the blocks describe: per commodity, in COMMODITIES order, who makes, takes and carries it. */
export function chainOf(buildings: readonly ChainDesign[], vehicles: readonly ChainDesign[]): Record<Commodity, ChainLink> {
  const sets = Object.fromEntries(COMMODITIES.map((c) => [c, { producers: new Set<string>(), consumers: new Set<string>(), carriers: new Set<string>() }])) as Record<
    Commodity,
    { producers: Set<string>; consumers: Set<string>; carriers: Set<string> }
  >;
  const add = (c: string, role: "producers" | "consumers" | "carriers", id: string) => {
    if (isCommodity(c)) sets[c][role].add(id);
  };
  for (const d of buildings) {
    for (const f of selections(d, d.block as ExportedTraffic)) {
      for (const c of Object.keys(f.produces ?? {})) add(c, "producers", d.id);
      for (const c of f.accepts ?? []) add(c, "consumers", d.id);
      if (f.processes) {
        add(f.processes.output, "producers", d.id);
        for (const c of Object.keys(f.processes.inputs ?? {})) add(c, "consumers", d.id);
      }
    }
  }
  for (const d of vehicles) {
    for (const f of selections(d, d.block as ExportedCapacity)) if ((f.tonnes ?? 0) > 0) for (const c of f.commodities ?? []) add(c, "carriers", d.id);
  }
  const sorted = (s: Set<string>) => [...s].sort();
  return Object.fromEntries(COMMODITIES.map((c) => [c, { producers: sorted(sets[c].producers), consumers: sorted(sets[c].consumers), carriers: sorted(sets[c].carriers) }])) as Record<Commodity, ChainLink>;
}

/**
 * The supply chain's orphans: a commodity no confirmed building makes, none takes,
 * or no confirmed vehicle carries. Over the confirmed designs at their defaults and
 * in every variant.
 */
export function chainProblems(buildings: readonly ChainDesign[], vehicles: readonly ChainDesign[]): string[] {
  const chain = chainOf(buildings, vehicles);
  const out: string[] = [];
  for (const c of COMMODITIES) {
    const { producers, consumers, carriers } = chain[c];
    if (!producers.length) out.push(`${c}: no building makes it (produces, or a recipe's output)`);
    if (!consumers.length) out.push(`${c}: no building takes it (accepts, or a recipe's input)`);
    if (!carriers.length) out.push(`${c}: no vehicle carries it (capacity commodities)`);
  }
  return out;
}
