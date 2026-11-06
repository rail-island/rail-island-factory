// The world buses of the later batches (generator/worldBuses2.ts, worldBuses3.ts,
// worldBuses4.ts; docs/models/world-buses-2.md): each at its real length, width and
// height, its axles where the spec puts them, its sections and joints, in budget,
// its OpenTTD entry; a bonnet ahead of a shorter shell, its fenders clear of the
// steered tyres at full lock; a raised deck; a finish parameter changing only colours.

import { roadTriangleBudget } from "../generator/rig";
import { describe, expect, it } from "vitest";
import { WORLD_BUS_SPECS_2 } from "../generator/worldBuses2";
import { WORLD_BUS_SPECS_3 } from "../generator/worldBuses3";
import { WORLD_BUS_SPECS_4 } from "../generator/worldBuses4";
import { fenderRadius } from "../generator/worldBusKit";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { coverageCombinations } from "../generator/design";
import { sample } from "./catalogCache";

const LATER = [...WORLD_BUS_SPECS_2, ...WORLD_BUS_SPECS_3, ...WORLD_BUS_SPECS_4];

const span = (ts: readonly Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) { lo = Math.min(lo, p[axis]!); hi = Math.max(hi, p[axis]!); }
  return [lo, hi];
};

describe("the later world buses", () => {
  it("are 74 designs in the catalog's buses besides the camello, each with its OpenTTD entry", () => {
    expect(LATER).toHaveLength(74);
    expect(new Set(LATER.map((b) => b.id)).size).toBe(74);
    for (const b of LATER) {
      const id = proceduralId(b.id);
      expect(DESIGNS.has(id), id).toBe(true);
      expect(DESIGNS.get(id)!.catalog).toMatchObject({ category: "Road vehicles", group: "bus" });
      expect(OPENTTD_TABLE[id]?.cargo, id).toBe("PASS");
      expect(OPENTTD_TABLE[id]!.capacity).toBeGreaterThan(0);
    }
  });

  for (const b of LATER) {
    describe(b.id, () => {
      const combos = sample(coverageCombinations(b.params, b.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("is the real bus's size, its axles and sections where the spec says (%s)", (_n, params) => {
        const spec = b.spec(params);
        const m = b.build(params);
        const glb = parseGlb(m.toGlb(b.id));
        const ts = collectTriangles(glb.json, glb.bin);
        expect(m.triangleCount() - m.interiorTriangleCount()).toBeLessThanOrEqual(roadTriangleBudget(m.rig));
        expect(m.interiorTriangleCount()).toBeLessThanOrEqual(1_500);
        // the body: as long as the bus, bumpers aside; as wide; on the road
        const OUTSIDE = (t: Tri) => !["frame", "glass", "rubber", "hub", "pole"].includes(t.material) && !t.material.startsWith("lamp");
        const [x0, x1] = span(ts.filter(OUTSIDE), 0);
        expect(x1 - x0).toBeCloseTo(spec.length, 1);
        const [z0, z1] = span(ts.filter((t) => t.material !== "frame" && t.material !== "glass" && t.material !== "rubber" && t.material !== "hub"), 2);
        expect(z1 - z0).toBeLessThanOrEqual(spec.width + 0.06);
        expect(span(ts, 1)[0]).toBeCloseTo(0, 5);
        // the tyres at the axles, metres from the nose
        const tyres = ts.filter((t) => t.material === "rubber" && t.p.every((p) => p[1] < spec.wheelRadius * 2.05));
        for (const a of spec.axles) {
          const x = x1 - a.at;
          expect(tyres.filter((t) => t.p.every((p) => Math.abs(p[0] - x) <= spec.wheelRadius + 1e-3)).length, `axle at ${a.at}`).toBeGreaterThan(0);
        }
        const names = (glb.json as { nodes: Array<{ name: string }> }).nodes.map((n) => n.name);
        const bodies = spec.bodies?.length ?? 1;
        expect(names.filter((n) => /^section\d+$/.test(n)).length).toBe(bodies > 1 ? bodies : 0);
        expect(names.filter((n) => /^joint\d+$/.test(n)).length).toBe(bodies - 1);
        expect(names).toContain("wheel-front-left");
        const lod = b.buildLod(params);
        expect(lod.triangleCount()).toBeLessThanOrEqual(100 * bodies);
      });
    });
  }

  it("draws a bonnet ahead of a shorter shell, the fenders' insides clear of the tyre at any lock", () => {
    const bonneted = LATER.filter((b) => b.spec().bonnet);
    expect(bonneted.map((b) => b.id)).toEqual(expect.arrayContaining(["veh-blue-bird-vision", "veh-jeepney", "veh-aec-routemaster", "veh-saurer-postbus"]));
    for (const b of bonneted) {
      const s = b.spec();
      const m = b.build();
      const ts = collectTriangles(...(Object.values(parseGlb(m.toGlb(b.id))) as [never, never]));
      // the windscreen stands on the shell's front, the bonnet's length behind the nose
      // (a half cab's upper windows are carried forward over it), the mirrors aside
      const glass = ts.filter((t) => t.material === "glass" && t.p.every((p) => p[1] > Math.max(...s.bonnet!.top) && Math.abs(p[2]) < s.width / 2 - 0.15));
      if (!s.bonnet!.halfCab) expect(span(glass, 0)[1], b.id).toBeLessThan(s.length - s.bonnet!.length + 0.1);
      // the tyre's side outline at full lock (a disc shifted by half its width) stays inside the fender
      const w = 0.26;
      const lock = ((s.maxSteerDeg ?? 50) * Math.PI) / 180;
      expect(s.wheelRadius + (w / 2) * Math.sin(lock), b.id).toBeLessThan(fenderRadius(s.wheelRadius, w));
      // and the shell starts behind the fender: the front axle is under the bonnet
      expect(s.axles[0]!.at + fenderRadius(s.wheelRadius, w), b.id).toBeLessThanOrEqual(s.bonnet!.length);
    }
  });

  it("carries a half cab's upper body forward over the bonnet to the nose", () => {
    const b = LATER.find((x) => x.id === "veh-aec-routemaster")!;
    const s = b.spec();
    const ts = collectTriangles(...(Object.values(parseGlb(b.build().toGlb(b.id))) as [never, never]));
    const upper = ts.filter((t) => t.material !== "glass" && t.material !== "frame" && t.p.every((p) => p[1] > s.bonnet!.halfCab!.from + 0.5));
    expect(span(upper, 0)[1]).toBeCloseTo(s.length, 2);
  });

  it("raises the Scenicruiser's rear deck over its lower front", () => {
    const b = LATER.find((x) => x.id === "veh-gm-scenicruiser")!;
    const s = b.spec();
    const ts = collectTriangles(...(Object.values(parseGlb(b.build().toGlb(b.id))) as [never, never]));
    expect(span(ts.filter((t) => t.material === "body"), 1)[1]).toBeCloseTo(s.deck!.height, 2);
  });

  it("changes only the colours with a finish parameter", () => {
    // the specs differ in their colours alone (no build needed: the kit draws from the spec)
    for (const b of LATER.filter((x) => x.finishParams?.length)) {
      const shapes = coverageCombinations(b.params).map((p) => JSON.stringify({ ...b.spec(p), livery: null }));
      expect(new Set(shapes).size, b.id).toBe(1);
    }
  });
});
