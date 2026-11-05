// The world cable car cabins on the cabin kit (generator/worldCabins.ts,
// generator/cabinKit.ts, docs/models/world-cabins.md): each hangs where its game
// properties say - the rope and the door sill at the stated fractions of its
// height, the underside at y 0 - stays within the cabins' 8,000-triangle budget,
// and its parameters change what they say.

import { describe, expect, it } from "vitest";
import { buildCabin, buildCabinLod, cabinDatums } from "../generator/cabinKit";
import { WORLD_CABIN_SPECS, WORLD_CABINS } from "../generator/worldCabins";
import { DESIGNS } from "../generator/generate";
import { proceduralId } from "../generator/modelId";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { coverageCombinations } from "../generator/design";
import { sample } from "./catalogCache";

const tris = (glb: Uint8Array): Tri[] => {
  const { json, bin } = parseGlb(glb);
  return collectTriangles(json, bin);
};
const span = (ts: readonly Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) { lo = Math.min(lo, p[axis]!); hi = Math.max(hi, p[axis]!); }
  return [lo, hi];
};

describe("the world cable car cabins", () => {
  it("are ten designs in the catalog, in the list's order, with the cabins' catalog fields", () => {
    expect(WORLD_CABINS).toHaveLength(10);
    for (const d of WORLD_CABINS) {
      expect(DESIGNS.has(proceduralId(d.id))).toBe(true);
      expect(d.catalog!.category).toBe("Cable car");
      expect(d.catalog!.group).toBe("cabin");
    }
  });

  for (const c of WORLD_CABIN_SPECS) {
    describe(c.id, () => {
      const combos = sample(coverageCombinations(c.params, c.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("hangs from its rope at its stated datums, in budget (%s)", (_n, params) => {
        const spec = c.spec(params);
        const d = cabinDatums(spec);
        const ts = tris(buildCabin(spec).toGlb(c.id));
        expect(ts.length).toBeLessThanOrEqual(8000);
        const [y0, y1] = span(ts, 1);
        expect(y0).toBeCloseTo(0, 3);
        expect(Math.abs(y1 - d.y1), `top ${y1} vs ${d.y1}`).toBeLessThan(0.01);
        // the rope pieces (haul or track) run along x at the rope's height
        const ropes = ts.filter((t) => t.material === "rubber" && span([t], 0)[1] - span([t], 0)[0] > 1);
        expect(ropes.length).toBeGreaterThan(0);
        const ry = span(ropes, 1);
        expect(ry[0]).toBeLessThan(d.rope + 1e-6);
        expect(ry[1]).toBeGreaterThan(d.rope - 1e-6);
        // the sill plate's top is the sill
        const plates = ts.filter((t) => t.material === "steel" && t.p.every((p) => p[1] < spec.sill + 1e-6 && p[1] > spec.sill - 0.05));
        expect(span(plates, 1)[1]).toBeCloseTo(spec.sill, 4);
        // the design's game properties are these datums
        const g = DESIGNS.get(proceduralId(c.id))!.game!;
        expect(g.ropeFrac).toBeCloseTo(d.ropeFrac, 4);
        expect(g.boardFrac).toBeCloseTo(d.boardFrac, 4);
        // the low level keeps the full model's height range, so it hangs the same way
        const lod = span(tris(buildCabinLod(spec).toGlb(c.id)), 1);
        expect(lod[0]).toBeCloseTo(0, 3);
        expect(Math.abs(lod[1] - d.y1)).toBeLessThan(0.05);
      });
    });
  }

  it("keeps every variant's height range, so one set of game properties fits them all", () => {
    for (const c of WORLD_CABIN_SPECS.filter((c) => c.params)) {
      const tops = coverageCombinations(c.params, c.finishParams).map((p) => cabinDatums(c.spec(p)));
      for (const t of tops) expect(t).toEqual(tops[0]);
    }
  });

  it("paints the glass-floor variants' belly glass and the standard ones' in the body colour", () => {
    const belly = (id: string, params: Record<string, string>): string[] => {
      const c = WORLD_CABIN_SPECS.find((x) => x.id === id)!;
      return [...new Set(tris(buildCabin(c.spec(params)).toGlb(id)).filter((t) => t.p.every((p) => p[1] < 0.06)).map((t) => t.material))];
    };
    expect(belly("veh-peak-2-peak", { variant: "glassFloor" })).toEqual(["glass"]);
    expect(belly("veh-peak-2-peak", { variant: "standard" })).not.toContain("glass");
    expect(belly("veh-ngong-ping-crystal", { variant: "crystal" })).toEqual(["glass"]);
    expect(belly("veh-ngong-ping-crystal", {})).not.toContain("glass");
  });

  it("hangs the funitel between two ropes 3.2 m apart and the Cabrio from both its sides", () => {
    const ropeZ = (id: string): number[] => {
      const ts = tris(buildCabin(WORLD_CABIN_SPECS.find((x) => x.id === id)!.spec()).toGlb(id)).filter((t) => t.material === "rubber" && span([t], 0)[1] - span([t], 0)[0] > 1);
      return [...new Set(ts.map((t) => Math.round(((span([t], 2)[0] + span([t], 2)[1]) / 2) * 10) / 10))].sort((a, b) => a - b);
    };
    const f = ropeZ("veh-poma-funitel");
    expect(f[0]).toBeCloseTo(-1.6, 0);
    expect(f[f.length - 1]).toBeCloseTo(1.6, 0);
    const cabrio = ropeZ("veh-stanserhorn-cabrio");
    expect(cabrio[0]).toBeLessThan(-1.9);
    expect(cabrio[cabrio.length - 1]).toBeGreaterThan(1.9);
  });
});
