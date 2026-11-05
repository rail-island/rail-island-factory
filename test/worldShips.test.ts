// The world ships on the hull kit (generator/hullKit.ts, generator/worldShips*.ts,
// docs/models/world-ships.md): each at its real length and beam, standing on its
// keel at y = 0, its waterline (draftFrac of its height) on the edge between the
// bottom paint and the boot top, in its budget (20,000 triangles over 150 m, 4,000
// for small craft, else 10,000) with a distant model of at most 100 triangles that
// does not flicker; every ship has its OpenTTD entry with the cargo of its type.

import { describe, expect, it } from "vitest";
import { CARGO_SHIP_SPECS } from "../generator/worldShipsCargo";
import { SERVICE_SHIP_SPECS } from "../generator/worldShipsService";
import { PASSENGER_SHIP_SPECS } from "../generator/worldShipsPassenger";
import { SMALL_SHIP_SPECS } from "../generator/worldShipsSmall";
import { shipBudget, shipLength } from "../generator/hullKit";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { coverageCombinations, type ParamValues } from "../generator/design";
import { sample } from "./catalogCache";

const ALL = [...CARGO_SHIP_SPECS, ...SERVICE_SHIP_SPECS, ...PASSENGER_SHIP_SPECS, ...SMALL_SHIP_SPECS];

/** Each axis's [min, max] over the corners of the given materials (all when none). */
function bounds(pos: number[]): [number[], number[]] {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3]!, pos[i]!); hi[i % 3] = Math.max(hi[i % 3]!, pos[i]!); }
  return [lo, hi];
}

/** The corners of one material of a built model. */
function cornersOf(m: unknown, mat: string): number[] {
  return (m as { groups: Map<string, { pos: number[] }> }).groups.get(mat)?.pos ?? [];
}

describe("the world ships", () => {
  it("are on the spec's list, each once, in the catalog's ships with an OpenTTD entry", () => {
    const ids = ALL.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of ALL) {
      const id = proceduralId(s.id);
      const d = DESIGNS.get(id);
      expect(d, id).toBeDefined();
      expect(d!.catalog).toMatchObject({ category: "Ships", group: "ship", yaw: 180 });
      expect(OPENTTD_TABLE[id], id).toBeDefined();
      expect(OPENTTD_TABLE[id]!.capacity).toBeGreaterThan(0);
      expect(d!.references).toBe(s.id.replace(/^veh-/, ""));
    }
  });

  it("carry the cargo of their type: containers goods, tankers oil, bulkers bulk, reefers food, passenger ships passengers", () => {
    const cargo = (id: string): string => OPENTTD_TABLE[proceduralId(id)]!.cargo!;
    for (const id of ["veh-ship-triple-e", "veh-ship-emma-maersk", "veh-ship-msc-gulsun", "veh-ship-panamax-container", "veh-ship-feeder-container"]) expect(cargo(id), id).toBe("GOOD");
    for (const id of ["veh-ship-vlcc", "veh-ship-seawise-giant", "veh-ship-aframax", "veh-ship-product-tanker", "veh-ship-chemical-tanker"]) expect(cargo(id), id).toBe("OIL_");
    for (const id of ["veh-ship-capesize", "veh-ship-valemax", "veh-ship-handysize"]) expect(OPENTTD_TABLE[proceduralId(id)]!.refitClasses, id).toContain("bulk");
    expect(cargo("veh-ship-reefer")).toBe("FOOD");
    for (const s of PASSENGER_SHIP_SPECS) expect(cargo(s.id), s.id).toBe("PASS");
  });

  for (const s of ALL) {
    describe(s.id, () => {
      const combos = sample(coverageCombinations(s.params, s.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("is its real size, on its keel, in budget, its waterline on a paint edge (%s)", (_n, params: ParamValues) => {
        const spec = s.spec(params);
        const m = s.build(params);
        expect(m.triangleCount()).toBeLessThanOrEqual(shipBudget(spec));
        const [lo, hi] = bounds(m.positions());
        expect(lo[1]).toBeCloseTo(0, 5);
        if (spec.hull) {
          // the hull: as long as the ship (its spars aside), as wide as its beam
          const hull = cornersOf(m, "hull");
          const [hl, hh] = bounds(hull);
          expect(hh[0]! - hl[0]!, "length").toBeCloseTo(spec.hull.length, 0);
          expect(hh[2]! - hl[2]!, "beam").toBeLessThanOrEqual(spec.hull.beam + 0.05);
          expect(hh[2]! - hl[2]!, "beam").toBeGreaterThan(spec.hull.beam * 0.9);
          // the waterline: draftFrac of the model's height, where the bottom paint ends
          const d = DESIGNS.get(proceduralId(s.id))!;
          const variant = d.game!.variants?.find((v) => JSON.stringify(v.params) === JSON.stringify(Object.fromEntries(Object.entries(params).filter(([k, v]) => (s.params ?? []).find((p) => p.name === k)?.default !== v))));
          const frac = variant?.draftFrac ?? d.game!.draftFrac!;
          expect(frac * hi[1]!, "waterline").toBeCloseTo(spec.hull.draft, 1);
          const bottom = cornersOf(m, "bottom");
          let top = 0;
          for (let i = 1; i < bottom.length; i += 3) if (bottom[i]! <= spec.hull.draft + 1e-6) top = Math.max(top, bottom[i]!);
          expect(top).toBeCloseTo(spec.hull.draft, 3);
        } else {
          expect(hi[0]! - lo[0]!).toBeCloseTo(shipLength(spec), 0);
        }
        const lod = s.buildLod(params);
        expect(lod.triangleCount()).toBeGreaterThan(0);
        expect(lod.triangleCount()).toBeLessThanOrEqual(100);
        expect(findCoplanarOverlaps(lod.toGlb(s.id))).toEqual([]);
      });
    });
  }

  it("budgets 20,000 triangles for the ocean ships over 150 m, 4,000 for small craft", () => {
    for (const s of ALL) {
      const spec = s.spec();
      const want = spec.small ? 4000 : shipLength(spec) > 150 ? 20_000 : 10_000;
      expect(shipBudget(spec), s.id).toBe(want);
    }
    // real sizes: the largest container ship and the largest ship ever built
    expect(shipLength(CARGO_SHIP_SPECS.find((s) => s.id === "veh-ship-triple-e")!.spec())).toBe(399);
    expect(shipLength(CARGO_SHIP_SPECS.find((s) => s.id === "veh-ship-seawise-giant")!.spec())).toBeCloseTo(458.45, 2);
  });

  it("drops the containers of an empty container ship, and changes only colours with a livery", () => {
    const t = CARGO_SHIP_SPECS.find((s) => s.id === "veh-ship-triple-e")!;
    expect(t.build({ load: "empty" }).triangleCount()).toBeLessThan(t.build().triangleCount() * 0.7);
    for (const s of ALL.filter((x) => x.finishParams?.includes("livery"))) {
      const p = s.params!.find((q) => q.name === "livery")!;
      expect(new Set(p.values.map((v) => s.build({ livery: v.value }).triangleCount())).size, s.id).toBe(1);
    }
  });
});
