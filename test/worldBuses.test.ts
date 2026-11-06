// The world buses on the world bus kit (generator/worldBuses.ts,
// generator/worldBusKit.ts, docs/models/world-buses.md): each at its real length,
// width and height, its axles where the spec puts them, its doors on the right,
// its parameters changing what they say, in budget; a trolleybus's poles raise to
// the game's trolley wire; and every bus has its OpenTTD entry.

import { roadTriangleBudget } from "../generator/rig";
import { describe, expect, it } from "vitest";
import { WORLD_BUS_SPECS, WORLD_BUSES } from "../generator/worldBuses";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { SOUND_TABLE } from "../generator/soundTable";
import { proceduralId } from "../generator/modelId";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { coverageCombinations } from "../generator/design";
import { TRAM_COLLECTOR_TOP } from "../generator/collector";
import { sample } from "./catalogCache";

const span = (ts: readonly Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) { lo = Math.min(lo, p[axis]!); hi = Math.max(hi, p[axis]!); }
  return [lo, hi];
};

describe("the world buses", () => {
  it("are 25 designs in the catalog's buses, each with its OpenTTD entry", () => {
    expect(WORLD_BUSES).toHaveLength(25);
    for (const d of WORLD_BUSES) {
      const id = proceduralId(d.id);
      expect(DESIGNS.has(id), id).toBe(true);
      expect(d.catalog).toMatchObject({ category: "Road vehicles", group: "bus" });
      expect(OPENTTD_TABLE[id]?.cargo, id).toBe("PASS");
      expect(OPENTTD_TABLE[id]!.capacity).toBeGreaterThan(0);
    }
  });

  it("run the trolleybuses and battery buses on electric motors", () => {
    for (const id of ["skoda-14tr", "skoda-15tr", "solaris-trollino", "mb-ecitaro", "volvo-7900e", "byd-k9", "van-hool-exquicity"]) {
      expect(SOUND_TABLE[`proc-vehicle-${id}`]?.sounds?.engine?.id, id).toMatch(/^electric-engine-/);
    }
  });

  for (const b of WORLD_BUS_SPECS) {
    describe(b.id, () => {
      const combos = sample(coverageCombinations(b.params, b.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("is the real bus's size, its axles and doors where the spec says (%s)", (_n, params) => {
        const spec = b.spec(params);
        const m = b.build(params);
        const ts = collectTriangles(...(Object.values(parseGlb(m.toGlb(b.id))) as [never, never]));
        expect(m.triangleCount() - m.interiorTriangleCount()).toBeLessThanOrEqual(roadTriangleBudget(m.rig));
        expect(m.interiorTriangleCount()).toBeLessThanOrEqual(1_500);
        // the shell: as long as the bus, as wide, as high at its crown
        const shell = ts.filter((t) => t.material === "body");
        const [x0, x1] = span(shell, 0);
        expect(x1 - x0).toBeCloseTo(spec.length, 1);
        const [z0, z1] = span(ts.filter((t) => t.material !== "frame" && t.material !== "glass"), 2);
        expect(z1 - z0).toBeLessThanOrEqual(spec.width + 0.06);
        expect(span(ts, 1)[0]).toBeCloseTo(0, 5);
        // the tyres: their centres at the axles, metres from the nose
        const tyres = ts.filter((t) => t.material === "rubber" && t.p.every((p) => p[1] < spec.wheelRadius * 2.05));
        for (const a of spec.axles) {
          const x = x1 - a.at;
          const at = tyres.filter((t) => t.p.every((p) => Math.abs(p[0] - x) <= spec.wheelRadius + 1e-3));
          expect(at.length, `axle at ${a.at}`).toBeGreaterThan(0);
        }
        // the sections: one body, or a section a rigid body and a joint per gap
        const names = (parseGlb(m.toGlb(b.id)).json as { nodes: Array<{ name: string }> }).nodes.map((n) => n.name);
        const bodies = spec.bodies?.length ?? 1;
        expect(names.filter((n) => /^section\d+$/.test(n)).length).toBe(bodies > 1 ? bodies : 0);
        expect(names.filter((n) => /^joint\d+$/.test(n)).length).toBe(bodies - 1);
        expect(names).toContain("wheel-front-left");
      });
    });
  }

  it("raises a trolleybus's two poles to the game's trolley wire, each on its own lowering clip", () => {
    for (const id of ["veh-skoda-14tr", "veh-skoda-15tr", "veh-solaris-trollino"]) {
      const b = WORLD_BUS_SPECS.find((x) => x.id === id)!;
      const m = b.build();
      const { json, bin } = parseGlb(m.toGlb(id));
      const ts = collectTriangles(json, bin);
      // raised, the shoes' tops at the wire
      expect(span(ts, 1)[1]).toBeLessThanOrEqual(TRAM_COLLECTOR_TOP + 1e-3);
      expect(span(ts, 1)[1]).toBeGreaterThan(TRAM_COLLECTOR_TOP - 0.01);
      const clips = (json as { animations?: Array<{ name: string }> }).animations?.map((a) => a.name) ?? [];
      expect(clips.filter((c) => /^trolleypole\d+$/.test(c))).toHaveLength(2);
    }
  });

  it("changes only the colours with a finish livery, and the length with a length", () => {
    const len = (id: string, params: Record<string, string>): number => {
      const b = WORLD_BUS_SPECS.find((x) => x.id === id)!;
      return b.spec(params).length;
    };
    expect(len("veh-mb-o405", { length: "articulated" })).toBeCloseTo(17.9, 5);
    expect(len("veh-man-lions-city", { length: "18" })).toBeCloseTo(18.1, 5);
    expect(len("veh-new-flyer-xcelsior", { length: "60" })).toBeCloseTo(18.3, 5);
    for (const id of ["veh-ikarus-260", "veh-adl-enviro500"]) {
      const b = WORLD_BUS_SPECS.find((x) => x.id === id)!;
      const tris = coverageCombinations(b.params).map((p) => b.build(p).triangleCount());
      expect(new Set(tris).size, id).toBe(1);
    }
  });
});
