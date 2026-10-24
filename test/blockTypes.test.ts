// Block types (generator/sets/blockType.ts): the six archetypes the game's city
// generator fills its blocks by, their parameters and the fill both the game and the
// site's previews run. Every registry type has its data and nothing else does; the
// names it uses are the game's (city types, rings) or the factory's own pools; every
// city type and ring can always grow something; the retired types keep reading as
// their archetype with their old character.
import { describe, expect, it } from "vitest";
import { BUILDINGS, VILLAGE_DESIGNS, catalogFields } from "../generator/generate.ts";
import { setDef, resolveSetId } from "../generator/sets/registry.ts";
import { setMeta } from "../generator/sets/setsExport.ts";
import {
  BLOCK_HEIGHTS, CITY_TYPES, DECORATIONS, DISTRICTS, GROUNDS, PALETTES, RETIRED_PARAMS, RINGS, SPACINGS, MIN_GAP, ROW_BIAS, TYPE_META,
  blockParamValues, chooseColours, decorates, fillRun, partyParam, partyValues, pickCandidate, rollBlockParams, storedBlockParams,
  touchingSides, type FillCandidate, type FillContext, type VariantReuse,
} from "../generator/sets/blockType.ts";

const def = setDef("blockType");
const pools = new Set([...BUILDINGS, ...VILLAGE_DESIGNS].map((d) => catalogFields(d).group).filter(Boolean));

/** A seeded generator for the fill's draws. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const keyOf = (c: FillCandidate, colours: Readonly<Record<string, string>>): string => `${c.key}|${JSON.stringify(colours)}`;

describe("block types", () => {
  it("has data for exactly the registry's six archetypes", () => {
    expect(Object.keys(TYPE_META).sort()).toEqual(def.types.map((t) => t.id).sort());
    expect(def.types.map((t) => t.id)).toEqual(["houses", "street", "highrise", "industrial", "towerblock", "landmark"]);
  });

  it("names only known grounds, city types, rings, districts, decorations, parameters and the factory's pools", () => {
    for (const [id, t] of Object.entries(TYPE_META)) {
      if (t.ground !== null) expect(GROUNDS, id).toContain(t.ground);
      for (const p of t.pools) expect(pools.has(p.group), `${id} pool ${p.group}`).toBe(true);
      if (t.centerpiece) expect(pools.has(t.centerpiece), `${id} centerpiece`).toBe(true);
      if (t.ringPools) for (const g of Object.values(t.ringPools)) expect(pools.has(g), `${id} ring pool ${g}`).toBe(true);
      for (const [city, rings] of Object.entries(t.cities)) {
        expect(CITY_TYPES as readonly string[], id).toContain(city);
        for (const [ring, w] of Object.entries(rings ?? {})) {
          expect(RINGS as readonly string[]).toContain(ring);
          expect(w).toBeGreaterThanOrEqual(0);
        }
      }
      for (const c of Object.keys(t.limits ?? {})) expect(CITY_TYPES as readonly string[]).toContain(c);
      for (const c of t.landmarkIn ?? []) expect(CITY_TYPES as readonly string[]).toContain(c);
      if (t.district) expect(DISTRICTS).toContain(t.district);
      if (t.decoration) {
        expect(DECORATIONS).toContain(t.decoration.kind);
        for (const g of t.decoration.pools ?? []) expect(t.pools.map((p) => p.group), `${id} decoration pool ${g}`).toContain(g);
        for (const h of t.decoration.heights ?? []) expect(BLOCK_HEIGHTS).toContain(h);
      }
      for (const s of Object.keys(t.params.spacing)) expect(Object.keys(SPACINGS), id).toContain(s);
      for (const h of Object.keys(t.params.height)) expect(BLOCK_HEIGHTS as readonly string[], id).toContain(h);
      expect(blockParamValues(id).spacing.length, id).toBeGreaterThan(0);
      expect(blockParamValues(id).height.length, id).toBeGreaterThan(0);
      if (t.placement === "perimeter") expect(t.pools.length, id).toBeGreaterThan(0);
      else expect(!!t.ringPools || !!t.landmarkIn, id).toBe(true);
    }
  });

  it("lets every city type and ring grow a type that no exclusion can starve", () => {
    for (const city of CITY_TYPES) for (const ring of RINGS) {
      const free = Object.values(TYPE_META).filter((t) => (t.cities[city]?.[ring] ?? 0) > 0 && !t.exclusionKey);
      expect(free.length, `${city}.${ring}`).toBeGreaterThan(0);
    }
  });

  it("retires the fifteen old types as aliases, each read with its old character", () => {
    expect(Object.keys(def.retired).sort()).toEqual(Object.keys(RETIRED_PARAMS).sort());
    expect(resolveSetId(def, "comm_low")).toBe("street");
    expect(resolveSetId(def, "village_red")).toBe("houses");
    expect(resolveSetId(def, "historical")).toBe("landmark");
    expect(resolveSetId(def, "skyscraper_b")).toBe("highrise");
    for (const [old, params] of Object.entries(RETIRED_PARAMS)) {
      const target = def.retired[old]!;
      const valid = blockParamValues(target);
      if (params.height) expect(BLOCK_HEIGHTS as readonly string[], old).toContain(params.height);
      if (params.spacing) expect(Object.keys(SPACINGS), old).toContain(params.spacing);
      if (params.colour) expect(valid.colour, old).toContain(params.colour);
    }
    expect(storedBlockParams("comm_low")).toEqual({ height: "low" });
    // a record's own value wins over the alias's, and unknown names are dropped
    expect(storedBlockParams("comm_oldtown", { colour: "cool", other: "x" })).toEqual({ spacing: "touching", colour: "cool" });
  });

  it("exports the data in blockType.meta.json", () => {
    const meta = setMeta(def, TYPE_META as unknown as Record<string, Record<string, unknown>>);
    expect(meta.module).toBe("blockType.js");
    expect(meta.defaultId).toBe("street");
    expect(meta.types.find((t) => t.id === "street")).toMatchObject({ ground: "pavement" });
  });
});

describe("block parameters", () => {
  it("roll from the type's weights and keep valid fixed values", () => {
    for (const id of Object.keys(TYPE_META)) {
      for (let seed = 1; seed < 40; seed++) {
        const p = rollBlockParams(id, seeded(seed));
        expect(blockParamValues(id).spacing, id).toContain(p.spacing);
        expect(blockParamValues(id).height, id).toContain(p.height);
        expect(PALETTES as readonly string[]).toContain(p.colour);
      }
    }
    expect(rollBlockParams("street", seeded(3), {}, { spacing: "touching", colour: "brick", height: "tall" })).toEqual({ spacing: "touching", colour: "brick", height: "tall" });
    // an invalid fixed value is rolled instead
    expect(PALETTES as readonly string[]).toContain(rollBlockParams("street", seeded(3), {}, { colour: "plaid" }).colour);
  });

  it("draw the same three numbers whatever is fixed", () => {
    const draws = (fixed: Record<string, string>): number => {
      let n = 0;
      const base = seeded(9);
      rollBlockParams("street", () => (n++, base()), {}, fixed);
      return n;
    };
    expect(draws({})).toBe(3);
    expect(draws({ spacing: "tight", colour: "warm", height: "low" })).toBe(3);
  });

  it("favour the city's dominant palettes and the neighbours' schemes", () => {
    const count = (bias: { palettes?: string[]; neighbours?: string[] }): number => {
      let hits = 0;
      for (let seed = 1; seed <= 600; seed++) if (rollBlockParams("street", seeded(seed), bias).colour === "brick") hits++;
      return hits;
    };
    const plain = count({});
    expect(count({ palettes: ["brick"] })).toBeGreaterThan(plain * 2.5);
    expect(count({ neighbours: ["brick", "brick"] })).toBeGreaterThan(plain * 1.8);
  });

  it("raise a decoration only where a type names one", () => {
    expect(decorates("houses", "mixed")).toBe(true);
    expect(decorates("industrial", "mixed")).toBe(true);
    expect(decorates("highrise", "tall")).toBe(false);
  });

  // regression: a city walled its tall streets with noise walls, which read as
  // fences round nothing; no block type raises one now
  it("never walls a city street", () => {
    expect(DECORATIONS as readonly string[]).not.toContain("noise_wall");
    for (const h of BLOCK_HEIGHTS) expect(decorates("street", h), h).toBe(false);
    for (const t of Object.values(TYPE_META)) expect(t.decoration?.kind).not.toBe("noise_wall");
  });
});

describe("the fill", () => {
  const shop = (key: string, w: number, extra: Partial<FillCandidate> = {}): FillCandidate => ({ key, group: "commercial", w, d: 10, ...extra });

  it("prefers the block's height band, falling back when nothing of it fits", () => {
    const pools = new Map([["commercial", [shop("low", 10, { band: "low" }), shop("tall", 10, { band: "tall" })]]]);
    for (let seed = 1; seed < 30; seed++) expect(pickCandidate(pools, [{ group: "commercial", weight: 1 }], "tall", seeded(seed), 40, 20)!.key).toBe("tall");
    const onlyLow = new Map([["commercial", [shop("low", 10, { band: "low" })]]]);
    expect(pickCandidate(onlyLow, [{ group: "commercial", weight: 1 }], "tall", seeded(1), 40, 20)!.key).toBe("low");
    expect(pickCandidate(onlyLow, [{ group: "commercial", weight: 1 }], "tall", seeded(1), 5, 20)).toBeNull();
  });

  it("colours a building mostly from the block's palette", () => {
    const c = shop("a", 10, { colours: [{ name: "walls", values: [{ value: "rose", palettes: ["pastel"] }, { value: "charcoal", palettes: ["stone"] }] }] });
    let pastel = 0;
    for (let seed = 1; seed <= 200; seed++) if (chooseColours(c, "pastel", seeded(seed), keyOf).walls === "rose") pastel++;
    expect(pastel).toBeGreaterThan(170);
  });

  it("reuses variants already standing once the city's budget of new ones is spent", () => {
    const c = shop("a", 10, { colours: [{ name: "walls", values: [{ value: "rose", palettes: ["pastel"] }, { value: "charcoal", palettes: ["stone"] }] }] });
    const used = new Set([keyOf(c, { walls: "charcoal" })]);
    const spent: VariantReuse = { has: (k) => used.has(k), canAdd: () => false, note: () => {} };
    for (let seed = 1; seed <= 50; seed++) expect(chooseColours(c, "pastel", seeded(seed), keyOf, spent).walls).toBe("charcoal");
  });

  const ctx = (spacing: string, list: FillCandidate[]): FillContext => ({
    typeId: "street", params: { spacing, colour: "warm", height: "mixed" }, pools: new Map([["commercial", list], ["comm_classic", list]]),
    density: 1, random: seeded(5), retryStep: 4, keyOf,
  });

  it("stands party-walled buildings wall to wall on a touching block", () => {
    const placed = fillRun({ length: 60, depthLimit: 20 }, ctx("touching", [shop("p", 10, { party: ["left", "right", "back"] })]), () => true);
    expect(placed.length).toBe(6);
    for (let i = 1; i < placed.length; i++) expect(placed[i]!.at).toBeCloseTo(placed[i - 1]!.at + 10, 6);
  });

  it("keeps a gap beside a building that draws no party wall, even on a touching block", () => {
    const placed = fillRun({ length: 60, depthLimit: 20 }, ctx("touching", [shop("n", 10)]), () => true);
    for (let i = 1; i < placed.length; i++) expect(placed[i]!.at - placed[i - 1]!.at - 10).toBeGreaterThanOrEqual(MIN_GAP - 1e-9);
  });

  // regression: a tight street left half-stud slivers between buildings that could touch
  it("never leaves a gap narrower than MIN_GAP: it touches between party walls, else widens", () => {
    for (const spacing of Object.keys(SPACINGS)) {
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const list = [shop("p", 10, { party: ["left", "right"] }), shop("n", 9)];
        const placed = fillRun({ length: 200, depthLimit: 20 }, { ...ctx(spacing, list), random: seeded(seed) }, () => true);
        for (let i = 1; i < placed.length; i++) {
          const gap = placed[i]!.at - placed[i - 1]!.at - placed[i - 1]!.candidate.w;
          const both = placed[i]!.candidate.key === "p" && placed[i - 1]!.candidate.key === "p";
          if (Math.abs(gap) < 1e-9) expect(both, `${spacing} ${seed} #${i}`).toBe(true);
          else expect(gap, `${spacing} ${seed} #${i}`).toBeGreaterThanOrEqual(MIN_GAP - 1e-9);
        }
      }
    }
  });

  it("stands most party-walled neighbours wall to wall on a tight block", () => {
    let touching = 0, pairs = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const placed = fillRun({ length: 200, depthLimit: 20 }, { ...ctx("tight", [shop("p", 10, { party: ["left", "right"] })]), random: seeded(seed) }, () => true);
      for (let i = 1; i < placed.length; i++, pairs++) if (Math.abs(placed[i]!.at - placed[i - 1]!.at - 10) < 1e-9) touching++;
    }
    expect(touching / pairs).toBeGreaterThan(0.3);
    expect(touching).toBeLessThan(pairs); // the passages
  });

  it("does not retry a refused wall-to-wall slot forever", () => {
    const list = [shop("p", 10, { party: ["left", "right"] })];
    let calls = 0;
    const placed = fillRun({ length: 100, depthLimit: 20 }, ctx("touching", list), (at) => {
      calls++;
      return at < 1e-9 || at >= 30;
    });
    expect(calls).toBeLessThan(50);
    expect(placed[1]!.at).toBeGreaterThanOrEqual(10 + MIN_GAP - 1e-9);
  });

  it("favours the row builders on a block whose spacing builds rows", () => {
    // the share of row builders among what stands
    const share = (spacing: string): number => {
      let rows = 0, all = 0;
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const list = [shop("p", 10, { party: ["left", "right"] }), shop("n", 10)];
        const placed = fillRun({ length: 200, depthLimit: 20 }, { ...ctx(spacing, list), random: seeded(seed) }, () => true);
        rows += placed.filter((p) => p.candidate.key === "p").length;
        all += placed.length;
      }
      return rows / all;
    };
    expect(ROW_BIAS).toBeGreaterThan(1);
    expect(share("open")).toBeLessThan(0.65);
    expect(share("touching")).toBeGreaterThan(0.7);
    expect(share("tight")).toBeGreaterThan(0.7);
  });

  it("leaves the spacing's gap on other blocks", () => {
    const placed = fillRun({ length: 80, depthLimit: 20 }, ctx("open", [shop("n", 10)]), () => true);
    for (let i = 1; i < placed.length; i++) expect(placed[i]!.at - placed[i - 1]!.at - 10).toBeGreaterThanOrEqual(SPACINGS.open!.gap - 1e-9);
  });

  it("resumes past a building in its way, wall to wall when both draw party walls", () => {
    const list = [shop("p", 10, { party: ["left", "right"] })];
    const placed = fillRun({ length: 40, depthLimit: 20 }, ctx("touching", list), (at) => (at < 12 ? { skipTo: 12, party: true } : true));
    expect(placed[0]!.at).toBeCloseTo(12, 6);
  });
});

describe("party walls", () => {
  it("finds the faces neighbours share, flanks and backs, and nothing across a gap", () => {
    // two terraced houses side by side facing +Z, and one round the corner standing against the first's back
    const a = { x: 0, z: 0, rot: 0, w: 10, d: 8 };
    const b = { x: 10, z: 0, rot: 0, w: 10, d: 8 };
    const c = { x: -1, z: -9, rot: 270, w: 10, d: 8 };
    const sides = touchingSides([a, b, c]);
    expect(sides[0]).toEqual(["back", "right"]);
    expect(sides[1]).toEqual(["left"]);
    expect(sides[2]).toEqual(["right"]);
    expect(touchingSides([a, { ...b, x: 10.5 }])).toEqual([[], []]);
  });

  it("turns touched sides a design supports into its party parameters", () => {
    expect(partyParam("left")).toBe("partyLeft");
    expect(partyValues(["left", "back", "front"], ["left", "right"])).toEqual({ partyLeft: "yes" });
  });
});
