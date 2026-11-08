// The North American hood units (generator/usDiesels.ts, usHoodKit.ts). See docs/models/us-diesels.md.
import { describe, expect, it } from "vitest";
import { US_DIESELS } from "../generator/usDiesels";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const ft = (feet: number, inches = 0) => feet * 0.3048 + inches * 0.0254;

/** Published figures: length over the couplers, truck centres, axles a truck, wheel diameter. */
const FIGURES: Record<string, { length: number; centres: number; axles: number; wheel: number; liveries: string[] }> = {
  "proc-vehicle-emd-gp9": { length: ft(56, 2), centres: ft(31), axles: 2, wheel: ft(0, 40), liveries: ["unionPacific", "pennsylvania", "santaFe"] },
  "proc-vehicle-emd-sd40-2": { length: ft(68, 10), centres: ft(40), axles: 3, wheel: ft(0, 40), liveries: ["burlingtonNorthern", "conrail", "unionPacific"] },
  "proc-vehicle-ge-es44ac": { length: ft(73, 2), centres: ft(50, 4), axles: 3, wheel: ft(0, 42), liveries: ["bnsf", "unionPacific", "csx"] },
  "proc-vehicle-emd-sd70ace": { length: ft(74, 3), centres: ft(47, 10), axles: 3, wheel: ft(0, 42), liveries: ["unionPacific", "norfolkSouthern", "bnsf"] },
};

describe("the US hood units", () => {
  it("are four diesel locomotives on the US loading gauge, each with its liveries and references", () => {
    expect(US_DIESELS.map((d) => d.id)).toEqual(Object.keys(FIGURES));
    for (const d of US_DIESELS) {
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco", traction: "diesel" });
      expect(d.loadingGauge).toBe("us");
      expect(d.references).toBe(d.id.replace("proc-vehicle-", ""));
      expect(d.params![0]!.values.map((v) => v.value)).toEqual(FIGURES[d.id]!.liveries);
      for (const v of d.params![0]!.values) expect(v.title.length, v.value).toBeLessThanOrEqual(16);
    }
  });

  for (const d of US_DIESELS) {
    const f = FIGURES[d.id]!;
    it(`${d.id}: every livery at its real size, inside the US gauge and the budget, without z-fighting`, () => {
      for (const livery of f.liveries) {
        const glb = d.build({ livery }).toGlb(d.id);
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[0] - s.min[0]).toBeCloseTo(f.length, 1);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.us.width);
        expect(s.max[1]).toBeLessThanOrEqual(LOADING_GAUGES.us.height);
        // wider than a 3.1 m body could hold: the cab and walkways at their real 10 ft 3 in or so
        expect(s.max[2] - s.min[2]).toBeGreaterThan(3.1);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      }
    });

    it(`${d.id}: rides on two trucks at the published centres, with the published wheels`, () => {
      const m = d.build();
      expect(m.rig!.supports).toHaveLength(2);
      const nodes = leaves(m.sourceTree(d.id, d.title).root);
      const axles = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
      expect(axles).toHaveLength(2 * f.axles);
      const xs = axles.map((n) => (n.min![0] + n.max![0]) / 2);
      const front = xs.filter((x) => x > 0), rear = xs.filter((x) => x < 0);
      const mid = (a: number[]) => (Math.min(...a) + Math.max(...a)) / 2;
      expect(mid(front) - mid(rear)).toBeCloseTo(f.centres, 1);
      const wheels = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-2$/.test(n.id));
      expect(wheels.length).toBeGreaterThan(0);
      expect(wheels[0]!.max![1] - wheels[0]!.min![1]).toBeCloseTo(f.wheel, 1);
    });

    it(`${d.id}: has its exhaust, headlights at both ends, couplers and the railroad's name`, () => {
      const m = d.build();
      expect(m.emitters().some((e) => e.kind === "smoke")).toBe(true);
      const ids = leaves(m.sourceTree(d.id, d.title).root).map((n) => n.id);
      for (const part of ["front/", "long-hood/rear-headlight/", "frame/front-end/coupler/", "frame/rear-end/coupler/", "long-hood/lettering/"])
        expect(ids.some((id) => id.startsWith(part)), part).toBe(true);
    });

    it(`${d.id}: builds the same bytes twice and keeps a valid distant model`, () => {
      expect(Buffer.from(d.build({ livery: f.liveries[1] }).toGlb("a")).equals(Buffer.from(d.build({ livery: f.liveries[1] }).toGlb("a")))).toBe(true);
      const low = buildLodModel(d);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    });
  }
});
