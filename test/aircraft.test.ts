// The airliners' liveries and the Boeing 737-800 (generator/aircraft.ts,
// docs/models/aircraft.md): every livery stays within the aircraft budget and
// keeps the airframe's size, the coplanar check passes on every livery, the
// 737 keeps the axes of the model it replaced, and its nose is a full rounded
// radome rather than the old model's thin cone.

import { describe, expect, it } from "vitest";
import { AIRCRAFT } from "../generator/aircraft";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";

/** The aircraft triangle budget (.agents/skills/aircraft). */
const BUDGET = 10000;

const design = (id: string) => AIRCRAFT.find((d) => d.id === id)!;
const liveries = (id: string): string[] => design(id).params!.find((p) => p.name === "livery")!.values.map((v) => v.value);

describe("aircraft liveries", () => {
  it.each(["proc-vehicle-airbus-a380", "proc-vehicle-boeing-737"])("%s has the neutral default and five airline liveries", (id) => {
    const values = liveries(id);
    expect(values[0]).toBe("neutral");
    expect(values).toHaveLength(6);
  });

  for (const id of ["proc-vehicle-airbus-a380", "proc-vehicle-boeing-737"]) {
    const base = glbStats(design(id).build().toGlb(id));
    it.each(liveries(id).map((l) => [l] as const))(`${id} in %s stays in budget and keeps its size`, (livery) => {
      const glb = design(id).build({ livery }).toGlb(id);
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(BUDGET);
      for (let k = 0; k < 3; k++) {
        expect(s.min[k]).toBeCloseTo(base.min[k], 2);
        expect(s.max[k]).toBeCloseTo(base.max[k], 2);
      }
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });
  }
});

describe("the Boeing 737-800", () => {
  const glb = design("proc-vehicle-boeing-737").build().toGlb("proc-vehicle-boeing-737");

  it("has the real size: 39.5 m long, 35.8 m span, 12.55 m tall, on its wheels", () => {
    const s = glbStats(glb);
    expect(s.max[0] - s.min[0]).toBeCloseTo(39.48, 1);
    expect(s.max[2] - s.min[2]).toBeCloseTo(35.78, 1);
    expect(s.max[1]).toBeCloseTo(12.55, 2);
    expect(s.min[1]).toBeCloseTo(0, 2);
  });

  it("faces -X like the model it replaced (yaw 0): the cockpit glazing is at the -X end", () => {
    const { json, bin } = parseGlb(glb);
    const glass = collectTriangles(json, bin).filter((t) => t.color[0] < 0.01 && t.color[2] < 0.02 && t.p.every((p) => p[1] > 3.9));
    const xs = glass.flatMap((t) => t.p.map((p) => p[0]));
    expect(Math.min(...xs)).toBeLessThan(-17);
    expect(Math.max(...xs)).toBeLessThan(13);
  });

  it("has a rounded nose: 1.1 m behind the tip the fuselage is already over 1.65 m wide", () => {
    // the old model closed its fuselage with a cone from a 0.08 m tip, 1.5 m wide at 1.1 m
    const { json, bin } = parseGlb(glb);
    const tipX = Math.min(...collectTriangles(json, bin).flatMap((t) => t.p.map((p) => p[0])));
    const near = collectTriangles(json, bin).flatMap((t) => t.p).filter((p) => p[0] < tipX + 1.1 && p[1] > 1);
    const width = Math.max(...near.map((p) => p[2])) - Math.min(...near.map((p) => p[2]));
    expect(width).toBeGreaterThan(1.65);
  });
});

const wideBodies = [
  ["proc-vehicle-mcdonnell-douglas-md11", 61.21, 51.66, 17.6],
  ["proc-vehicle-boeing-747", 70.66, 64.44, 19.41],
  ["proc-vehicle-airbus-beluga", 56.15, 44.84, 17.24],
] as const;

describe("new wide-body aircraft", () => {
  for (const [id, length, span, height] of wideBodies) {
    const d = design(id);
    for (const livery of d.params?.[0]?.values.map(v => v.value) ?? [undefined]) {
      it(`${id} / ${livery ?? "Airbus"} has finite geometry, real dimensions, retractable gear and no flicker`, () => {
        const g = d.build(livery ? { livery } : undefined).toGlb(id);
        const stats = glbStats(g);
        expect(stats.triangles).toBeLessThanOrEqual(BUDGET);
        expect(stats.max[0] - stats.min[0]).toBeCloseTo(length, 2);
        expect(stats.max[2] - stats.min[2]).toBeCloseTo(span, 2);
        expect(stats.min[1]).toBeCloseTo(0, 3);
        expect(stats.max[1]).toBeCloseTo(height, 2);
        const { json, bin } = parseGlb(g);
        expect(collectTriangles(json, bin).every(t => t.p.every(p => p.every(Number.isFinite)))).toBe(true);
        expect(json.nodes?.map(n => (n as { name?: string }).name)).toEqual(expect.arrayContaining(["airframe", "gear"]));
        expect(findCoplanarOverlaps(g)).toEqual([]);
        expect(d.build(livery ? { livery } : undefined).toGlb(id)).toEqual(g);
      });
    }
  }
  it("offers three operator liveries plus neutral on each passenger airliner", () => {
    expect(liveries(wideBodies[0][0])).toEqual(["neutral", "klm", "swissair", "fedex"]);
    expect(liveries(wideBodies[1][0])).toEqual(["neutral", "britishAirways", "lufthansa", "klm"]);
    expect(design(wideBodies[2][0]).params).toBeUndefined();
  });
  it("removes passenger windows from the FedEx freighter", () => {
    const d = design(wideBodies[0][0]);
    const windows = (livery: string) => {
      const { json, bin } = parseGlb(d.build({ livery }).toGlb(d.id));
      return collectTriangles(json, bin).filter(t => t.color[0] < 0.01 && t.color[2] < 0.02 && t.p.every(p => p[1] > 5.8 && p[1] < 6.4 && p[0] > -15 && p[0] < 15));
    };
    expect(windows("neutral").length).toBeGreaterThan(100);
    expect(windows("fedex")).toHaveLength(0);
  });
});
