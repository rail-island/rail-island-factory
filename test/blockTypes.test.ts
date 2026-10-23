// Block types (generator/sets/blockType.ts): factory data the game's city generator
// fills its blocks by. Every registry type has its data and nothing else does; the
// names it uses are the game's (facade styles, city types, rings) or the factory's
// own pools; every city type and ring can always grow something.
import { describe, expect, it } from "vitest";
import { BUILDINGS, VILLAGE_DESIGNS, catalogFields } from "../generator/generate.ts";
import { setDef } from "../generator/sets/registry.ts";
import { setMeta } from "../generator/sets/setsExport.ts";
import { CITY_TYPES, DECORATIONS, DISTRICTS, FACADE_STYLES, RINGS, TYPE_META } from "../generator/sets/blockType.ts";

const def = setDef("blockType");
const pools = new Set([...BUILDINGS, ...VILLAGE_DESIGNS].map((d) => catalogFields(d).group).filter(Boolean));

describe("block types", () => {
  it("has data for exactly the registry's types", () => {
    expect(Object.keys(TYPE_META).sort()).toEqual(def.types.map((t) => t.id).sort());
  });

  it("names only known facades, city types, rings, districts, decorations and the factory's pools", () => {
    for (const [id, t] of Object.entries(TYPE_META)) {
      expect(FACADE_STYLES, id).toContain(t.facade);
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
      if (t.district) expect(DISTRICTS).toContain(t.district);
      if (t.decoration) {
        expect(DECORATIONS).toContain(t.decoration.kind);
        for (const g of t.decoration.pools ?? []) expect(t.pools.map((p) => p.group), `${id} decoration pool ${g}`).toContain(g);
      }
      if (t.placement === "perimeter") expect(t.pools.length, id).toBeGreaterThan(0);
      else expect(!!t.ringPools || !!t.landmark, id).toBe(true);
    }
  });

  it("lets every city type and ring grow a type that no exclusion can starve", () => {
    for (const city of CITY_TYPES) for (const ring of RINGS) {
      const free = Object.values(TYPE_META).filter((t) => (t.cities[city]?.[ring] ?? 0) > 0 && !t.exclusionKey);
      expect(free.length, `${city}.${ring}`).toBeGreaterThan(0);
    }
  });

  it("exports the data in blockType.meta.json", () => {
    const meta = setMeta(def, TYPE_META as unknown as Record<string, Record<string, unknown>>);
    expect(meta.module).toBe("blockType.js");
    expect(meta.types.find((t) => t.id === "comm_tenement")).toMatchObject({ facade: "terraced", decoration: { kind: "noise_wall" } });
  });
});
