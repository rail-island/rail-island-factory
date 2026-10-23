// City presets (docs/models/game-properties.md, "City presets"): which variants of
// each building the game's city generator builds. A building in a city pool (its
// catalog `group`) is city-placed with its pool's FAMILY default -- so a new design
// added to a pool family appears in cities with no further line -- unless it
// declares its own (`game.city.presets` on the design, or DESIGN_PRESETS here) or
// opts out (NOT_IN_CITIES: too wide for any city lot at its placed scale; still
// placed by hand). Each preset is one fixed parameter selection, strictly
// validated against the design's parameters; `weight` (default 1) makes it
// commoner. The export writes the resolved list as `game.city.presets`.
//
// No node: imports.

import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";

export interface CityPreset {
  /** The non-default parameter values of this preset (empty: the defaults). */
  params?: ParamValues;
  /** How much commoner than its pool's other presets (default 1). */
  weight?: number;
}

/** The game property a building carries: the presets a city builds of it. */
export interface CityUse {
  presets: CityPreset[];
}

export const FAMILY_PRESETS: Readonly<Record<string, readonly CityPreset[]>> = {
  commercial: [{}, { params: { storeys: "2", finish: "sand" } }, { params: { storeys: "4", finish: "sage" } }, { params: { storeys: "5", finish: "brick" } }],
  skyscraper_c: [{}, { params: { size: "compact", glazing: "blue" } }, { params: { size: "medium", glazing: "jade" } }],
  village_red: [{}, { params: { pitch: "gentle", roof: "ochre" } }],
  hist_center: [{}],
  decor: [{}],
  comm_classic: [{}],
  industry: [{}],
  towers: [{}],
  village: [{}],
};

export const DESIGN_PRESETS: Readonly<Record<string, readonly CityPreset[]>> = {
  "proc-building-comm-balcony-house": [{}, { params: { storeys: "three", roof: "garden" } }, { params: { storeys: "five", roof: "garden" } }],
  "proc-building-comm-corner-shop": [{}, { params: { storeys: "two", roof: "garden" } }, { params: { storeys: "four", roof: "garden" } }],
  "proc-building-comm-market-block": [{}, { params: { storeys: "four", roof: "garden" } }],
  "proc-building-comm-office-house": [{}, { params: { storeys: "five", roof: "garden" } }, { params: { storeys: "nine", roof: "garden" } }],
  "proc-building-comm-terrace-house": [{}, { params: { storeys: "three", roof: "solar" } }, { params: { storeys: "five", roof: "solar" } }],
  "proc-building-commercial-shop": [{}, { params: { storeys: "2", finish: "sand" } }],
  "proc-building-commercial-tenement": [{}, { params: { storeys: "2", finish: "sand" } }, { params: { storeys: "3", finish: "sage" } }, { params: { storeys: "4", finish: "brick" } }],
  "proc-building-castle": [{}, { params: { layout: "keep" } }, { params: { layout: "fortress" } }],
  "proc-building-ind-building-a": [{}, { params: { size: "extended", finish: "blue" } }],
  "proc-building-ind-building-h": [{}, { params: { size: "extended", finish: "blue" } }],
  "proc-building-ind-chimney-basic": [{}, { params: { height: "medium", style: "striped" } }, { params: { height: "tall", style: "steel" } }],
  "proc-building-ind-detail-tank": [{}, { params: { layout: "vertical" } }, { params: { layout: "cluster" } }],
  "proc-building-industry-factory-a": [{}, { params: { size: "extended", finish: "blue" } }],
  "proc-building-tower-bell": [{}, { params: { storeys: "4", roof: "red" } }, { params: { storeys: "5", roof: "red" } }],
  "proc-building-tower-kenney": [{}, { params: { storeys: "3" } }, { params: { storeys: "4" } }],
  "proc-building-tower-radio": [{}, { params: { bays: "6" } }, { params: { bays: "10" } }],
  "proc-building-tower-stone": [{}, { params: { storeys: "2", banners: "blue" } }, { params: { storeys: "4", banners: "none" } }],
  "proc-building-tower-transmission": [{}, { params: { arms: "2" } }],
  "proc-building-tower-watch": [{}, { params: { storeys: "2", banners: "blue" } }, { params: { storeys: "4", banners: "none" } }],
  "proc-building-village-cottage": [{}, { params: { storeys: "one", roof: "red" } }],
  "proc-building-village-family-house": [{}, { params: { roofShape: "hip", roof: "red" } }],
  "proc-building-village-l-house": [{}, { params: { storeys: "one", roof: "red" } }],
  "proc-building-village-modern-house": [{}, { params: { storeys: "one", cladding: "timber" } }],
  "proc-building-village-narrow-house": [{}, { params: { storeys: "three", roof: "red" } }],
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

/**
 * The presets a city builds of a design in pool `group`: its own declaration,
 * else its override here, else its pool's family default; none when it opts out
 * or its pool is not a city pool.
 */
export function cityPresetsOf(id: string, group: string | undefined, declared?: CityUse): CityPreset[] {
  if (declared) return declared.presets;
  if (NOT_IN_CITIES.has(id) || !group) return [];
  return [...(DESIGN_PRESETS[id] ?? FAMILY_PRESETS[group] ?? [])];
}

/**
 * Checks a design's resolved presets: each must resolve strictly against its
 * parameters, name only non-default values, weigh more than zero, and differ from
 * every other preset. Throws, naming the design.
 */
export function checkCityPresets(id: string, specs: readonly ParamSpec[] | undefined, presets: readonly CityPreset[]): void {
  const seen = new Set<string>();
  for (const p of presets) {
    const params = p.params ?? {};
    let resolved: ParamValues;
    try {
      resolved = resolveParams(specs ?? [], params);
    } catch (e) {
      throw new Error(`${id}: city preset ${JSON.stringify(params)} does not resolve: ${(e as Error).message}`);
    }
    for (const [name, value] of Object.entries(params)) {
      if (resolved[name] !== value) throw new Error(`${id}: city preset names "${name}", which does not apply`);
      if ((specs ?? []).find((s) => s.name === name)?.default === value) throw new Error(`${id}: city preset lists the default "${name}"`);
    }
    if (p.weight !== undefined && !(p.weight > 0)) throw new Error(`${id}: city preset weight must be above zero`);
    const key = JSON.stringify(Object.keys(resolved).sort().map((k) => [k, resolved[k]]));
    if (seen.has(key)) throw new Error(`${id}: two city presets select the same variant`);
    seen.add(key);
  }
}
