// City variants (docs/models/game-properties.md, "City variants"): which variants of
// each building the game's city generator may stand, and what it needs to choose
// between them. A city samples them freely, under the block's colour scheme and
// height band (generator/sets/blockType.ts), instead of picking from a fixed list:
//
//   - the SHAPE parameters it may vary (its pool family's FAMILY_VARY, or the
//     design's own DESIGN_VARY), each combination exported with its measured size,
//     so the game sizes a lot without building anything;
//   - the COLOUR parameters (the design's `finishParams`, which change no
//     geometry), every value tagged with the named palettes it belongs to
//     (COLOUR_TAGS; a value tagged with none is neutral in every palette);
//   - the HEIGHT band of each value of its height parameter (HEIGHT_TAGS);
//   - the sides it can draw as a blank party wall (its `partyLeft` ... parameters).
//
// A building in a city pool (its catalog `group`) is city-placed unless it opts out
// (NOT_IN_CITIES: too wide for any city lot at its placed scale; still placed by
// hand). The export writes the result as `game.city`.
//
// No node: imports.

import { paramApplies, resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { HEIGHT_BANDS, PALETTES, PARTY_SIDES, partyParam } from "./sets/blockType.ts";

/** What a design may declare of its city use (`game.city`), replacing its family's defaults. */
export interface CityUse {
  /** The shape parameters a city may vary; the others stay at their defaults. */
  vary?: string[];
  /** The values of a varied parameter a city may take (all of them when absent). */
  values?: Record<string, string[]>;
}

/** One shape variant a city may stand, as exported: its non-default values, size and height band. */
export interface CityVariant {
  params?: ParamValues;
  /** The built model's extent (x, y, z) in its own units, at scale 1. */
  size: [number, number, number];
  band?: (typeof HEIGHT_BANDS)[number];
}

/** A colour parameter as exported: each value with the palettes it belongs to. */
export interface CityColour {
  name: string;
  values: { value: string; palettes: string[] }[];
}

/** What the export writes as a building's `game.city`. */
export interface CityExport {
  variants: CityVariant[];
  colours?: CityColour[];
  party?: string[];
}

/** The shape parameters each pool family varies by default (where the design has them). */
export const FAMILY_VARY: Readonly<Record<string, readonly string[]>> = {
  commercial: ["storeys", "width"],
  comm_classic: ["storeys", "width", "bays", "roof"],
  village: ["storeys", "roofShape"],
  village_red: ["pitch"],
  skyscraper_c: ["size"],
  industry: ["size"],
  towers: ["storeys"],
  hist_center: [],
  decor: [],
};

/** Designs whose varied parameters differ from their family's. */
export const DESIGN_VARY: Readonly<Record<string, CityUse>> = {
  "proc-building-castle": { vary: ["layout"] },
  "proc-building-ind-chimney-basic": { vary: ["height", "style"] },
  "proc-building-ind-detail-tank": { vary: ["layout"] },
  "proc-building-tower-bell": { vary: ["storeys", "roof"] },
  "proc-building-tower-radio": { vary: ["bays"] },
  "proc-building-tower-stone": { vary: ["storeys", "banners"] },
  "proc-building-tower-transmission": { vary: ["arms"] },
  "proc-building-tower-watch": { vary: ["storeys", "banners"] },
};

/** Values a family never stands in a city: a skyscraper's landmark size outgrows a city lot. */
export const FAMILY_VALUES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  skyscraper_c: { size: ["compact", "medium", "standard"] },
};

/** Designs in a city pool that no city builds: wider than any city lot at their placed scale, or not yet tuned. */
export const NOT_IN_CITIES: ReadonlySet<string> = new Set([
  "proc-building-chemical-factory",
  "proc-building-industry-oil-pump",
  "proc-building-industry-power-plant",
  "proc-building-sky-dark-slab",
  "proc-building-sky-twin-towers",
  "proc-building-village-alpine-hut",
]);

/** The pools whose designs cities build; any other group is placed by hand only. */
export const CITY_POOLS: ReadonlySet<string> = new Set(Object.keys(FAMILY_VARY));

type Palette = (typeof PALETTES)[number];

/**
 * The palettes each colour value belongs to, by parameter name and value. A value
 * absent here (a design's `original` finish) is neutral: it suits every palette a
 * little (blockType.ts, UNTAGGED_COLOUR).
 */
export const COLOUR_TAGS: Readonly<Record<string, Readonly<Record<string, readonly Palette[]>>>> = {
  roof: {
    green: ["earth", "cool"], red: ["warm", "brick"], brown: ["earth", "warm"], slate: ["stone", "cool"], blue: ["cool"],
    moss: ["earth"], ochre: ["warm", "earth"], terracotta: ["brick", "warm"],
  },
  walls: {
    white: ["stone", "pastel", "cool"], cream: ["warm", "pastel"], ochre: ["warm", "earth"], rose: ["pastel", "warm"],
    sage: ["pastel", "cool", "earth"], ivory: ["pastel", "stone"], chalk: ["stone", "pastel"], charcoal: ["stone", "cool"],
  },
  cladding: { anthracite: ["stone", "cool"], timber: ["earth", "warm"], sand: ["earth", "warm"], teal: ["cool"] },
  timber: { oak: ["warm", "earth"], walnut: ["earth", "brick"], weathered: ["stone", "earth"] },
  accent: { blue: ["cool"], coral: ["warm", "pastel"], gold: ["warm"], green: ["earth", "cool"], plum: ["pastel"], red: ["brick", "warm"] },
  finish: { blue: ["cool"], brick: ["brick", "warm"], cream: ["pastel", "warm"], sage: ["pastel", "cool"], sand: ["earth", "warm"] },
  glazing: { blue: ["cool"], bronze: ["warm", "earth"], jade: ["cool", "pastel"] },
  structure: { graphite: ["stone", "cool"], limestone: ["stone", "warm"] },
};

/**
 * The height band of a height parameter's values, by parameter name; a group's own
 * table (`<group>:<param>`) wins (a skyscraper's `size` is its height, an
 * industrial building's is its floor plan).
 */
export const HEIGHT_TAGS: Readonly<Record<string, Readonly<Record<string, (typeof HEIGHT_BANDS)[number]>>>> = {
  storeys: {
    "1": "low", "2": "low", "3": "mid", "4": "mid", "5": "tall",
    one: "low", two: "low", three: "mid", four: "mid", five: "tall", seven: "tall", nine: "tall",
  },
  "skyscraper_c:size": { compact: "mid", medium: "mid", standard: "tall", landmark: "tall" },
};

function heightTable(group: string, name: string): Readonly<Record<string, (typeof HEIGHT_BANDS)[number]>> | undefined {
  return HEIGHT_TAGS[`${group}:${name}`] ?? (name === "size" ? undefined : HEIGHT_TAGS[name]);
}

/** Whether a design is built by cities: in a city pool and not opted out. */
export function inCities(id: string, group: string | undefined): boolean {
  return !!group && CITY_POOLS.has(group) && !NOT_IN_CITIES.has(id);
}

/** The sides a design can draw as a blank party wall: those it has a `party<Side>` parameter for. */
export function partySidesOf(specs: readonly ParamSpec[] | undefined): string[] {
  return PARTY_SIDES.filter((s) => (specs ?? []).some((p) => p.name === partyParam(s)));
}

/**
 * The shape selections a city may stand of a design: every combination of its
 * varied parameters (only the values allowed), defaults first; each as the
 * non-default values it names. Empty when no city builds it.
 */
export function cityShapes(design: Pick<ProceduralDesign, "id" | "params" | "finishParams">, group: string | undefined, declared?: CityUse): ParamValues[] {
  if (!inCities(design.id, group)) return [];
  const specs = design.params ?? [];
  const finish = new Set(design.finishParams ?? []);
  const use = declared ?? DESIGN_VARY[design.id];
  const vary = (use?.vary ?? FAMILY_VARY[group!] ?? []).filter((n) => !finish.has(n) && specs.some((s) => s.name === n));
  const allowed = (s: ParamSpec): string[] => {
    const only = use?.values?.[s.name] ?? FAMILY_VALUES[group!]?.[s.name];
    const values = s.values.map((v) => v.value).filter((v) => !only || only.includes(v));
    return [s.default, ...values.filter((v) => v !== s.default)].filter((v, i, a) => values.includes(v) && a.indexOf(v) === i);
  };
  let combos: ParamValues[] = [{}];
  for (const s of specs) {
    if (!vary.includes(s.name)) continue;
    combos = combos.flatMap((c) => {
      const chosen = { ...resolveParams(specs, c) };
      return paramApplies(s, chosen) ? allowed(s).map((v) => (v === s.default ? { ...c } : { ...c, [s.name]: v })) : [c];
    });
  }
  return combos;
}

/** The colour parameters a city varies of a design, each value tagged (an untagged value has no palettes). */
export function cityColours(design: Pick<ProceduralDesign, "params" | "finishParams">): CityColour[] {
  const specs = design.params ?? [];
  return (design.finishParams ?? [])
    .map((name) => specs.find((s) => s.name === name))
    .filter((s): s is ParamSpec => !!s && !s.when)
    .map((s) => ({ name: s.name, values: s.values.map((v) => ({ value: v.value, palettes: [...(COLOUR_TAGS[s.name]?.[v.value] ?? [])] })) }));
}

/** The height band of a shape selection: its height parameter's value's band, if it has one. */
export function heightBand(design: Pick<ProceduralDesign, "params">, group: string, values: ParamValues): (typeof HEIGHT_BANDS)[number] | undefined {
  const resolved = resolveParams(design.params ?? [], values);
  for (const s of design.params ?? []) {
    const table = heightTable(group, s.name);
    const band = table?.[resolved[s.name] ?? ""];
    if (band) return band;
  }
  return undefined;
}

/**
 * A design's `game.city`: its shape variants, each measured by `measure` (the built
 * model's extent at those values), its colour parameters and its party sides; null
 * when no city builds it.
 */
export function cityExport(
  design: Pick<ProceduralDesign, "id" | "params" | "finishParams">,
  group: string | undefined,
  measure: (values: ParamValues) => [number, number, number],
  declared?: CityUse,
): CityExport | null {
  const shapes = cityShapes(design, group, declared);
  if (!shapes.length) return null;
  const r4 = (n: number): number => Math.round(n * 1e4) / 1e4;
  const variants = shapes.map((params) => {
    const [x, y, z] = measure(params);
    const band = heightBand(design, group!, params);
    return { ...(Object.keys(params).length ? { params } : {}), size: [r4(x), r4(y), r4(z)] as [number, number, number], ...(band ? { band } : {}) };
  });
  const colours = cityColours(design);
  const party = partySidesOf(design.params);
  return { variants, ...(colours.length ? { colours } : {}), ...(party.length ? { party } : {}) };
}

/** The extent (x, y, z) of a built model's positions. */
export function extentOf(positions: ArrayLike<number>): [number, number, number] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!, y = positions[i + 1]!, z = positions[i + 2]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return positions.length ? [maxX - minX, maxY - minY, maxZ - minZ] : [0, 0, 0];
}
