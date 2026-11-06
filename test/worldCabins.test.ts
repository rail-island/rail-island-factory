// The world cable car cabins on the cabin kit (generator/worldCabins.ts,
// generator/cabinKit.ts, docs/models/world-cabins.md): each hangs where its game
// properties say - the rope and the door sill at the stated fractions of its
// height, the underside at y 0 - stays within the cabins' 8,000-triangle budget,
// and its parameters change what they say.

import { describe, expect, it } from "vitest";
import { buildCabin, buildCabinLod, cabinDatums, cabinRopes } from "../generator/cabinKit";
import { cabinRopeFracs, WORLD_CABIN_SPECS, WORLD_CABINS } from "../generator/worldCabins";
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
        // no rope is drawn on the cabin (the game draws them), and its running gear meets every rope it states
        expect(ts.filter((t) => t.material === "rubber" && t.p.every((p) => p[1] > d.rope - 0.6))).toHaveLength(0);
        for (const r of cabinRopes(spec)) {
          const y = d.rope + r.dy;
          const near = ts.filter((t) => t.p.some((p) => Math.hypot(p[1] - y, p[2] - r.z) < 0.35));
          expect(near.length, `${r.kind} rope at z ${r.z}, y ${y}`).toBeGreaterThan(0);
        }
        // the sill plate's top is the sill
        const plates = ts.filter((t) => t.material === "steel" && t.p.every((p) => p[1] < spec.sill + 1e-6 && p[1] > spec.sill - 0.05));
        expect(span(plates, 1)[1]).toBeCloseTo(spec.sill, 4);
        // the design's game properties are these datums
        const g = DESIGNS.get(proceduralId(c.id))!.game!;
        expect(g.ropeFrac).toBeCloseTo(d.ropeFrac, 4);
        expect(g.boardFrac).toBeCloseTo(d.boardFrac, 4);
        expect(g.ropes).toEqual(cabinRopeFracs(spec));
        expect(g.ropeway).toBe(c.ropeway);
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

  it("hangs the funitel between two haul ropes 3.2 m apart, the Cabrio between two track ropes and the trams under two", () => {
    const ropes = (id: string) => cabinRopes(WORLD_CABIN_SPECS.find((x) => x.id === id)!.spec());
    expect(ropes("veh-poma-funitel")).toEqual([{ kind: "haul", z: -1.6, dy: 0 }, { kind: "haul", z: 1.6, dy: 0 }]);
    expect(ropes("veh-stanserhorn-cabrio").map((r) => r.kind)).toEqual(["track", "track"]);
    expect(ropes("veh-stanserhorn-cabrio")[1]!.z).toBeGreaterThan(1.9);
    expect(ropes("veh-vanoise-express").map((r) => r.kind)).toEqual(["track", "track", "haul"]);
    expect(ropes("veh-ngong-ping-crystal").map((r) => [r.kind, r.z])).toEqual([["track", 0], ["haul", 0]]);
    expect(ropes("veh-doppelmayr-omega")).toEqual([{ kind: "haul", z: 0, dy: 0 }]);
  });

  it("runs the aerial tramways as jig-backs and the detachable systems round the wheels", () => {
    const jig = WORLD_CABIN_SPECS.filter((c) => c.ropeway === "jigback").map((c) => c.id);
    expect(jig).toEqual(["veh-stanserhorn-cabrio", "veh-titlis-rotair", "veh-vanoise-express", "veh-roosevelt-island-tram", "veh-sugarloaf-bondinho"]);
  });
});
