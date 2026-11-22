// Rail token prices (generator/tokenPrices.ts, docs/models/token-prices.md): the
// vehicle rules, the looks multiplier, the ladder, and the stated tables against
// the catalog and the set registry. The vehicles' extents come from the committed
// build cache, so nothing is built here.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, DESIGNS, catalogFields } from "../generator/generate.ts";
import { metaEntry, withTokenPrice } from "../generator/catalog.ts";
import { BUILD_CACHE_DIR, readStoredFacts } from "../generator/buildCache.ts";
import { proceduralId } from "../generator/modelId.ts";
import { SETS } from "../generator/sets/registry.ts";
import {
  ANIMAL_TOKEN_PRICES, LANDMARK_TOKEN_PRICES, STRUCTURE_TOKEN_PRICES, TOKEN_LADDER, looksOf, lookMultiplier,
  snapToLadder, structureTokenPrice, tokenPriceProblems, vehicleTokenPrice, type VehiclePriceInput,
} from "../generator/tokenPrices.ts";

const loco = (over: Partial<VehiclePriceInput> = {}): VehiclePriceInput => ({
  id: "proc-vehicle-test", category: "Rail vehicles", group: "loco", traction: "electric",
  game: { weight: 80, power: 4000, maxspeed: 160 }, length: 18, height: 4.5, ...over,
});
const values = (n: number) => Array.from({ length: n }, (_, i) => ({ value: `v${i}` }));

describe("vehicle prices", () => {
  it("prices a locomotive by speed and power", () => {
    // 100 + 200 (up to 180 km/h) + 100 (3-6 MW)
    expect(vehicleTokenPrice(loco())).toBe(400);
    expect(vehicleTokenPrice(loco({ game: { weight: 60, power: 500, maxspeed: 50 } }))).toBe(100);
    expect(vehicleTokenPrice(loco({ group: "unit", game: { weight: 60, power: 1200, maxspeed: 320 } }))).toBe(1000);
  });

  it("adds the steam bonus", () => {
    expect(vehicleTokenPrice(loco({ traction: "steam", game: { weight: 500, power: 4690, maxspeed: 129 } }))).toBe(500);
  });

  it("prices aircraft by class and refuses one without a class or an override", () => {
    const plane = (game: VehiclePriceInput["game"]) => loco({ category: "Aircraft", group: "aircraft", traction: undefined, game });
    expect(vehicleTokenPrice(plane({ sizeClass: "medium", maxspeed: 840 }))).toBe(650);
    expect(vehicleTokenPrice(plane({ sizeClass: "big", weight: 560, maxspeed: 900 }))).toBe(1250);
    expect(vehicleTokenPrice(plane({ aircraftKind: "helicopter", maxspeed: 250 }))).toBe(400);
    expect(() => vehicleTokenPrice(plane({ maxspeed: 800 }))).toThrow(/VEHICLE_BASE_OVERRIDES/);
    expect(vehicleTokenPrice({ ...plane({ maxspeed: 800 }), id: "proc-vehicle-boeing-747" })).toBe(1000);
  });

  it("prices ships by length", () => {
    const ship = (length: number) => loco({ category: "Ships", group: "ship", traction: undefined, length });
    expect([10, 30, 80, 150, 250, 345].map((l) => vehicleTokenPrice(ship(l)))).toEqual([100, 200, 300, 500, 800, 1000]);
  });

  it("has no price outside the vehicle categories", () => {
    expect(vehicleTokenPrice(loco({ category: "Commercial" }))).toBeNull();
  });
});

describe("looks", () => {
  it("counts only the look parameters", () => {
    const params = [
      { name: "livery", values: values(3) }, { name: "cars", values: values(7) },
      { name: "unit", values: values(3) }, { name: "load", values: values(2) }, { name: "body", values: values(2) },
    ];
    expect(looksOf(params)).toBe(6);
    expect(looksOf(undefined)).toBe(1);
  });

  it("adds 15 % a look, at most x2.5, and sells the whole design at one price", () => {
    expect(lookMultiplier(1)).toBe(1);
    expect(lookMultiplier(2)).toBeCloseTo(1.15);
    expect(lookMultiplier(5)).toBeCloseTo(1.6);
    expect(lookMultiplier(36)).toBe(2.5);
    // a 300 RT locomotive with 13 liveries
    expect(vehicleTokenPrice(loco({ game: { weight: 87, power: 3480, maxspeed: 120 }, params: [{ name: "livery", values: values(13) }] }))).toBe(800);
  });
});

describe("the ladder", () => {
  it("snaps to the nearest step", () => {
    expect(snapToLadder(345)).toBe(300);
    expect(snapToLadder(360)).toBe(400);
    expect(snapToLadder(10)).toBe(50);
    expect(snapToLadder(99999)).toBe(3000);
  });

  it("holds every stated price", () => {
    const stated = [...Object.values(LANDMARK_TOKEN_PRICES), ...Object.values(ANIMAL_TOKEN_PRICES),
      ...Object.values(STRUCTURE_TOKEN_PRICES).flatMap((t) => Object.values(t))];
    for (const p of stated) expect(TOKEN_LADDER).toContain(p);
  });
});

describe("the catalog", () => {
  const facts = readStoredFacts(BUILD_CACHE_DIR);

  it("prices every vehicle from its stored extent", () => {
    const records = ALL_VEHICLES.map((d) => {
      const stats = facts.get(proceduralId(d.id))?.stats;
      expect(stats, `${d.id}: no stored facts (run pnpm build:models)`).toBeDefined();
      return withTokenPrice(metaEntry(d, catalogFields(d)), stats!.max.map((v, i) => v - stats!.min[i]!));
    });
    expect(tokenPriceProblems(records, DESIGNS.keys())).toEqual([]);
    expect(records.every((r) => r.tokenPrice !== undefined)).toBe(true);
  });

  it("names only real models and prices every landmark and animal", () => {
    const ids = [...DESIGNS.values()].map((d) => proceduralId(d.id));
    const priced = [...DESIGNS.values()]
      .filter((d) => proceduralId(d.id) in LANDMARK_TOKEN_PRICES || proceduralId(d.id) in ANIMAL_TOKEN_PRICES)
      .map((d) => withTokenPrice(metaEntry(d, catalogFields(d)), null));
    expect(tokenPriceProblems(priced, ids)).toEqual([]);
    expect(priced).toHaveLength(Object.keys(LANDMARK_TOKEN_PRICES).length + Object.keys(ANIMAL_TOKEN_PRICES).length);
    // every plaza landmark of the historic centre is sold
    const plaza = [...DESIGNS.values()].filter((d) => catalogFields(d).group === "hist_center").map((d) => proceduralId(d.id));
    for (const id of plaza) expect(LANDMARK_TOKEN_PRICES[id], id).toBeDefined();
  });

  it("prices exactly the collectible sets' types", () => {
    const collectible = SETS.filter((s) => s.collectible);
    expect(Object.keys(STRUCTURE_TOKEN_PRICES).sort()).toEqual(collectible.map((s) => s.set).sort());
    for (const s of collectible) {
      expect(Object.keys(STRUCTURE_TOKEN_PRICES[s.set]!).sort(), s.set).toEqual(s.types.map((t) => t.id).sort());
      for (const t of s.types) expect(structureTokenPrice(s.set, t.id)).toBeGreaterThan(0);
    }
    expect(() => structureTokenPrice("bridge", "no_such")).toThrow(/STRUCTURE_TOKEN_PRICES/);
  });
});
