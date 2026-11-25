// The passenger and cargo numbers the game's traffic engine reads
// (docs/models/traffic.md): a building's `game.traffic` (residents, jobs, the cargo
// it produces per hour and the classes it accepts) and a vehicle's `game.capacity`
// (seats and cargo units per class). Stated by hand per design in
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
 * What is carried besides passengers. The ids are stored in players' saved games
 * (the game's traffic.json): never rename one.
 */
export const CARGO_CLASSES = ["goods", "bulk", "liquids", "food", "mail"] as const;
export type CargoClass = (typeof CARGO_CLASSES)[number];

/** Cargo units by class; a unit is one tonne. */
export type CargoUnits = Partial<Record<CargoClass, number>>;

/** A building's traffic fields; a variant states only those that differ. */
export interface BuildingTrafficFields {
  /** People living in it. */
  residents?: number;
  /** People working in it. */
  jobs?: number;
  /** Cargo it sends out, tonnes per hour of game time, by class. */
  produces?: CargoUnits;
  /** The cargo classes it takes in. */
  accepts?: CargoClass[];
}

/** A vehicle's capacity fields; a variant states only those that differ. */
export interface VehicleCapacityFields {
  /** Passengers it carries, seated and standing. */
  seats?: number;
  /** Cargo it carries, tonnes by class. */
  cargo?: CargoUnits;
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

/** The exported blocks: the table entry without its source. Empty `{}` means none. */
export type ExportedTraffic = BuildingTrafficFields & { variants?: TrafficVariant<BuildingTrafficFields>[] };
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
const MAX = { residents: 20_000, jobs: 20_000, produces: 2_000, seats: 3_000, cargo: 250_000 } as const;

const BUILDING_FIELDS = ["residents", "jobs", "produces", "accepts"];
const VEHICLE_FIELDS = ["seats", "cargo"];

function count(v: unknown, max: number, integer: boolean): string | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return `${String(v)} is not a number >= 0`;
  if (integer && !Number.isInteger(v)) return `${v} is not a whole number`;
  if (v > max) return `${v} is over ${max}`;
  return null;
}

function unitsProblems(where: string, v: unknown, max: number): string[] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return [`${where} is not an object of classes`];
  const out: string[] = [];
  for (const [k, n] of Object.entries(v)) {
    if (!(CARGO_CLASSES as readonly string[]).includes(k)) out.push(`${where} names an unknown class "${k}"`);
    const bad = count(n, max, false);
    if (bad) out.push(`${where}.${k}: ${bad}`);
    else if (n === 0) out.push(`${where}.${k} is 0 (leave the class out)`);
  }
  return out;
}

function fieldProblems(where: string, f: Record<string, unknown>, vehicle: boolean): string[] {
  const out: string[] = [];
  for (const k of Object.keys(f)) if (!(vehicle ? VEHICLE_FIELDS : BUILDING_FIELDS).includes(k)) out.push(`${where} has an unknown field "${k}"`);
  const num = (k: keyof typeof MAX, integer: boolean) => {
    if (f[k] === undefined) return;
    const bad = count(f[k], MAX[k], integer);
    if (bad) out.push(`${where}.${k}: ${bad}`);
  };
  if (vehicle) {
    num("seats", true);
    if (f.cargo !== undefined) out.push(...unitsProblems(`${where}.cargo`, f.cargo, MAX.cargo));
  } else {
    num("residents", true);
    num("jobs", true);
    if (f.produces !== undefined) out.push(...unitsProblems(`${where}.produces`, f.produces, MAX.produces));
    if (f.accepts !== undefined) {
      const a = f.accepts;
      if (!Array.isArray(a)) out.push(`${where}.accepts is not a list`);
      else {
        for (const c of a) if (!(CARGO_CLASSES as readonly string[]).includes(c as string)) out.push(`${where}.accepts names an unknown class "${String(c)}"`);
        if (new Set(a).size !== a.length) out.push(`${where}.accepts lists a class twice`);
      }
    }
  }
  return out;
}

/** True when the fields say the design generates, accepts or carries anything. */
function carriesAnything(f: Record<string, unknown>, vehicle: boolean): boolean {
  if (vehicle) return (f.seats as number) > 0 || Object.keys((f.cargo as object | undefined) ?? {}).length > 0;
  return (
    (f.residents as number) > 0 ||
    (f.jobs as number) > 0 ||
    Object.keys((f.produces as object | undefined) ?? {}).length > 0 ||
    ((f.accepts as unknown[] | undefined) ?? []).length > 0
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
 * count, every class known, every variant a real selection.
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
  return out.map((p) => `${p} (generator/${table})`);
}

/** The exported block: the entry without its source; `{}` for a design that carries nothing. */
export function exportedBlock(entry: BuildingTrafficEntry | VehicleCapacityEntry | undefined): ExportedTraffic | ExportedCapacity {
  if (!entry || entry.nothing) return {};
  const { source: _source, nothing: _nothing, ...rest } = entry;
  return JSON.parse(JSON.stringify(rest)) as ExportedTraffic | ExportedCapacity;
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
