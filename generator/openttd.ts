// The OpenTTD figures a vehicle's catalog record carries (docs/site/openttd-export.md):
// the facts its design states (generator/openttdTable.ts), the balance figures
// derived from them by one formula, and those figures resolved for every
// selection the export names - presets, declared variants and formation cars - so
// the site only reads them. No node: imports; the site imports only its types.

import {
  resolveParams, type CatalogFields, type OpenttdFields, type OpenttdProperties, type OpenttdVariant,
  type ParamValues, type ProceduralDesign,
} from "./design.ts";

/** OpenTTD's four vehicle types (the site's src/openttd/properties.ts openttdFeature). */
export type OpenttdFeatureKind = "train" | "road" | "ship" | "aircraft";

/** The OpenTTD vehicle type of a design's catalog fields, or null for one a GRF cannot hold (cable cars). */
export function openttdFeatureOf(fields: Pick<CatalogFields, "category" | "group">): OpenttdFeatureKind | null {
  if (fields.category === "Rail vehicles") return fields.group === "tram" ? "road" : "train";
  if (fields.category === "Road vehicles") return "road";
  if (fields.category === "Ships") return "ship";
  if (fields.category === "Aircraft") return "aircraft";
  return null;
}

/** The balance figures the formula derives unless a design (or variant) states them. */
export const OPENTTD_BALANCE = ["costFactor", "runningCostFactor", "vehicleLife", "modelLife", "reliabilityDecay"] as const;
export type OpenttdBalance = Required<Pick<OpenttdFields, (typeof OPENTTD_BALANCE)[number]>>;

/** What the formula reads of one vehicle. */
export interface BalanceInput {
  feature: OpenttdFeatureKind;
  group: string;
  traction?: string;
  /** kW; 0 or less for an unpowered vehicle. */
  power: number;
  /** km/h. */
  speed: number;
  capacity: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.round(v)));

/**
 * The balance figures of one vehicle (docs/site/openttd-export.md, "The balance
 * formula"): purchase and running cost factors grow with power, speed and
 * capacity, so a vehicle costs about what OpenTTD's own vehicles of its class
 * cost; lives and reliability decay go by vehicle type.
 */
export function deriveBalance(v: BalanceInput): OpenttdBalance {
  const p = Math.max(0, v.power);
  const s = Math.max(0, v.speed);
  const c = Math.max(0, v.capacity);
  const steam = v.traction === "steam";
  switch (v.feature) {
    case "train": {
      const powered = p > 0;
      return {
        costFactor: clamp(powered ? 20 + p / 40 + s / 5 + c / 4 : 10 + c / 3 + s / 10, 1, 255),
        runningCostFactor: clamp(powered ? 10 + p / 50 + c / 6 : 5 + c / 8, 1, 255),
        vehicleLife: steam ? 40 : powered ? 35 : 40,
        modelLife: 40,
        reliabilityDecay: steam ? 25 : 20,
      };
    }
    case "road": {
      const tram = v.group === "tram";
      return {
        costFactor: clamp(20 + p / 5 + c / 3, 1, 255),
        runningCostFactor: clamp(10 + p / 10 + c / 6, 1, 255),
        vehicleLife: tram ? 30 : 15,
        modelLife: tram ? 35 : 25,
        reliabilityDecay: 20,
      };
    }
    case "ship":
      return {
        costFactor: clamp(40 + p / 50 + c / 10, 1, 255),
        runningCostFactor: clamp(20 + p / 40 + c / 20, 1, 255),
        vehicleLife: 30,
        modelLife: 40,
        reliabilityDecay: 20,
      };
    case "aircraft":
      return {
        costFactor: clamp(60 + p / 100 + c / 3, 1, 255),
        runningCostFactor: clamp(30 + p / 80 + c / 5, 1, 255),
        vehicleLife: 25,
        modelLife: 30,
        reliabilityDecay: 20,
      };
  }
}

const selectionKey = (params: ParamValues): string => JSON.stringify(Object.entries(params).sort());

function sameSelection(a: ParamValues, b: ParamValues): boolean {
  return selectionKey(a) === selectionKey(b);
}

/** The fields of an object that are set, without `params`. */
function stated<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== undefined && k !== "params")) as Partial<T>;
}

/** Every field of one selection: the design's facts, its variant's, then the balance (stated or derived). */
function resolvedFields(design: ProceduralDesign, feature: OpenttdFeatureKind, fields: CatalogFields, params: ParamValues): Required<OpenttdFields> {
  const ottd = design.openttd!;
  const { variants: _v, presets: _p, formations: _f, ...base } = ottd;
  const variant = Object.keys(params).length ? ottd.variants?.find((v) => sameSelection(v.params, params)) : undefined;
  const facts = { ...stated(base), ...stated(variant) } as OpenttdFields;
  const game = design.game ?? {};
  const gameVariant = Object.keys(params).length ? game.variants?.find((v) => sameSelection(v.params, params)) : undefined;
  const pick = (k: "power" | "maxspeed"): number => {
    const v = gameVariant && gameVariant[k] !== undefined ? gameVariant[k] : game[k];
    return typeof v === "number" ? v : 0;
  };
  const derived = deriveBalance({
    feature, group: fields.group, traction: fields.traction,
    power: pick("power"), speed: pick("maxspeed"), capacity: facts.capacity ?? 0,
  });
  return {
    ...derived,
    ...facts,
    railType: facts.railType ?? "RAIL",
    climates: [...(facts.climates ?? [])],
    refitClasses: [...(facts.refitClasses ?? [])],
  } as Required<OpenttdFields>;
}

/**
 * The `openttd` block of a vehicle's catalog record: every field resolved at the
 * default selection, and a variant entry - only the fields that differ - for each
 * preset, declared variant and formation car whose figures differ; the presets
 * and formations as declared. Undefined for a design without a block.
 */
export function catalogOpenttd(design: ProceduralDesign, fields: CatalogFields): OpenttdProperties | undefined {
  const ottd = design.openttd;
  if (!ottd) return undefined;
  const feature = openttdFeatureOf(fields);
  if (!feature) return undefined;
  const base = resolvedFields(design, feature, fields, {});
  if (feature !== "train") delete (base as OpenttdFields).railType;
  const specs = design.params ?? [];
  const selections: ParamValues[] = [];
  const add = (params: ParamValues): void => {
    if (!Object.keys(params).length || selections.some((s) => sameSelection(s, params))) return;
    selections.push(params);
  };
  for (const v of ottd.variants ?? []) add(v.params);
  for (const p of ottd.presets ?? []) add(p);
  for (const f of ottd.formations ?? []) for (const c of f.cars) add(c.params);
  const variants: OpenttdVariant[] = [];
  for (const params of selections) {
    resolveParams(specs, params);
    const all = resolvedFields(design, feature, fields, params);
    const diff: Partial<OpenttdFields> = {};
    for (const [k, v] of Object.entries(all) as Array<[keyof OpenttdFields, unknown]>) {
      if (k === "railType" && feature !== "train") continue;
      if (JSON.stringify(v) !== JSON.stringify((base as OpenttdFields)[k])) (diff as Record<string, unknown>)[k] = v;
    }
    if (Object.keys(diff).length) variants.push({ params: { ...params }, ...diff });
  }
  return {
    ...base,
    ...(variants.length ? { variants } : {}),
    presets: (ottd.presets ?? [{}]).map((p) => ({ ...p })),
    ...(ottd.formations?.length ? { formations: ottd.formations.map((f) => ({ name: f.name, cars: f.cars.map((c) => ({ params: { ...c.params }, ...(c.turned ? { turned: true } : {}) })) })) } : {}),
  };
}

/**
 * The parts one car of `metres` becomes in OpenTTD at the export's scale (8 m to a
 * full length of 8/8): the site's src/openttd/properties.ts partLengths, counted.
 */
export function openttdPartCount(metres: number): number {
  return Math.ceil(Math.max(1, Math.round(metres)) / 8);
}
