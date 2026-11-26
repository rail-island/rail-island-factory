// A building's passengers and cargo as the catalog's columns show them
// (docs/site/catalog-site.md, "Passengers and cargo"): residents, jobs, visitors, the trips
// they make, what it produces, what it takes in and its recipe, all per minute of
// game time (docs/models/traffic.md). Each figure is the design's default, or a
// range "min-max" over its default and every variant when they differ - the
// Chains tab's way (src/chains.ts). Pure functions, no Solid.

import type { CatalogRecord } from "../generator/catalog.ts";
import type { BuildingTrafficFields, Recipe, TrafficVariant } from "../generator/traffic.ts";
import { COMMODITY_ORDER, formatAmount, selectionsOf } from "./chains";

/**
 * The trips a resident starts per minute of game time (the game's
 * TRIPS_PER_RESIDENT). The factory states people; the game turns them into trips.
 * A job or a visitor site starts none of its own: the workers and tourists it draws
 * travel back home after their stay, so its trips are those returns.
 */
export const TRIPS_PER_RESIDENT_MIN = 5 / 60;

type Block = BuildingTrafficFields & { variants?: TrafficVariant<BuildingTrafficFields>[] };

/** A building's selections (its default first), or null for a record with no traffic block (a vehicle). */
function selections(r: Pick<CatalogRecord, "params" | "game">): BuildingTrafficFields[] | null {
  const block = r.game?.traffic as Block | undefined;
  return block ? selectionsOf(r, block) : null;
}

/** "3" or "3-6": the range of a set of numbers. */
function range(values: readonly number[]): string {
  const lo = Math.min(...values), hi = Math.max(...values);
  return lo === hi ? formatAmount(lo) : `${formatAmount(lo)}-${formatAmount(hi)}`;
}

/** "iron-ore" -> "iron ore". */
function lower(c: string): string {
  return c.replace(/-/g, " ");
}

function order(c: string): number {
  const i = (COMMODITY_ORDER as readonly string[]).indexOf(c);
  return i < 0 ? COMMODITY_ORDER.length : i;
}

/** A count over the selections ("4", "3-5"), or null when no selection states one above 0. */
function countText(r: Pick<CatalogRecord, "params" | "game">, of: (f: BuildingTrafficFields) => number): string | null {
  const all = selections(r);
  if (!all) return null;
  const values = all.map(of);
  return values.some((v) => v > 0) ? range(values) : null;
}

/** A selection's passenger trips per minute. */
export function tripsPerMinute(f: BuildingTrafficFields): number {
  return (f.residents ?? 0) * TRIPS_PER_RESIDENT_MIN;
}

/** The default's figure, for sorting: null when it has none above 0. */
function defaultFigure(r: Pick<CatalogRecord, "params" | "game">, of: (f: BuildingTrafficFields) => number): number | null {
  const all = selections(r);
  const v = all ? of(all[0]!) : 0;
  return v > 0 ? v : null;
}

export const residentsText = (r: Pick<CatalogRecord, "params" | "game">) => countText(r, (f) => f.residents ?? 0);
export const residentsSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, (f) => f.residents ?? 0);
export const jobsText = (r: Pick<CatalogRecord, "params" | "game">) => countText(r, (f) => f.jobs ?? 0);
export const jobsSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, (f) => f.jobs ?? 0);

/** A visitor site's capacity and stay over the selections: "800 (15 min)", "300-1000 (15-25 min)"; null when it is none. */
export function visitorsText(r: Pick<CatalogRecord, "params" | "game">): string | null {
  const all = selections(r);
  const sites = (all ?? []).map((f) => f.visitors).filter((v): v is NonNullable<BuildingTrafficFields["visitors"]> => !!v);
  if (!sites.length) return null;
  return `${range(sites.map((v) => v.capacity))} (${range(sites.map((v) => v.stayMin))} min)`;
}
export const visitorsSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, (f) => f.visitors?.capacity ?? 0);
/** Trips per minute: "0.33", "0.17-0.42". */
export const passengersText = (r: Pick<CatalogRecord, "params" | "game">) => countText(r, tripsPerMinute);
export const passengersSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, tripsPerMinute);

const producedTotal = (f: BuildingTrafficFields) => Object.values(f.produces ?? {}).reduce((s, n) => s + (n ?? 0), 0);

/** What it makes from nothing, t/min per commodity over the selections: "grain 180-300", "coal 300, iron ore 360". */
export function producesText(r: Pick<CatalogRecord, "params" | "game">): string | null {
  const all = selections(r);
  if (!all) return null;
  const by = new Map<string, number[]>();
  for (const f of all) for (const [c, n] of Object.entries(f.produces ?? {})) if (typeof n === "number" && n > 0) by.set(c, [...(by.get(c) ?? []), n]);
  if (!by.size) return null;
  return [...by.keys()].sort((a, b) => order(a) - order(b) || a.localeCompare(b)).map((c) => `${lower(c)} ${range(by.get(c)!)}`).join(", ");
}
/** The default's total t/min. */
export const producesSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, producedTotal);

/** What it takes in over the selections - delivered for consumption or as a recipe's input: "food, goods, mail". */
export function consumesText(r: Pick<CatalogRecord, "params" | "game">): string | null {
  const all = selections(r);
  if (!all) return null;
  const set = new Set<string>();
  for (const f of all) {
    for (const c of f.accepts ?? []) set.add(c);
    for (const c of Object.keys(f.processes?.inputs ?? {})) set.add(c);
  }
  return set.size ? [...set].sort((a, b) => order(a) - order(b) || a.localeCompare(b)).map(lower).join(", ") : null;
}

function recipeSignature(p: Recipe): string {
  return `${Object.entries(p.inputs).map(([c, n]) => `${formatAmount(n ?? 0)} ${lower(c)}`).join(" + ")} -> ${lower(p.output)}`;
}

/** Its recipe with its rate over the selections: "1 iron ore + 0.5 coal -> steel, 360-540 t/min"; several recipes joined by "; ". */
export function recipeText(r: Pick<CatalogRecord, "params" | "game">): string | null {
  const all = selections(r);
  if (!all) return null;
  const by = new Map<string, number[]>();
  for (const f of all) if (f.processes) by.set(recipeSignature(f.processes), [...(by.get(recipeSignature(f.processes)) ?? []), f.processes.rate]);
  if (!by.size) return null;
  return [...by].map(([sig, rates]) => `${sig}, ${range(rates)} t/min`).join("; ");
}
/** The default recipe's rate, t/min. */
export const recipeSort = (r: Pick<CatalogRecord, "params" | "game">) => defaultFigure(r, (f) => f.processes?.rate ?? 0);

/** True for a record whose spec list shows the passengers-and-cargo rows: a building (it has a traffic block). */
export function hasTraffic(r: Pick<CatalogRecord, "game">): boolean {
  return r.game?.traffic !== undefined;
}
