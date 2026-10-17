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

describe("the wide bodies' shapes", () => {
  const tris = (id: string) => {
    const { json, bin } = parseGlb(design(id).build().toGlb(id));
    return collectTriangles(json, bin);
  };
  /** The highest and the widest point of the fuselage triangles in a slice across x. */
  const slice = (t: ReturnType<typeof tris>, x0: number, x1: number, y0 = 0, y1 = 99) => {
    const pts = t.flatMap((tr) => tr.p).filter((p) => p[0] >= x0 && p[0] <= x1 && p[1] > y0 && p[1] < y1 && Math.abs(p[2]) < 4.5);
    return { top: Math.max(...pts.map((p) => p[1])), width: 2 * Math.max(...pts.map((p) => Math.abs(p[2]))) };
  };

  it("gives the 747 its upper-deck hump over the forward fuselage only", () => {
    const t = tris("proc-vehicle-boeing-747");
    expect(slice(t, 14, 16, 3).top).toBeGreaterThan(10.3);
    expect(slice(t, -9, -7, 3).top).toBeLessThan(9.1);
  });

  it("gives the Beluga its cargo bulge, low cockpit and AIRBUS BELUGA titles", () => {
    const t = tris("proc-vehicle-airbus-beluga");
    // the bulge: about 7.7 m wide and its crown at 11.6 m, over the A300's 5.6 m lower lobe
    expect(slice(t, -2, 9, 6).width).toBeGreaterThan(7.5);
    expect(slice(t, -2, 9, 6).top).toBeGreaterThan(11.4);
    expect(slice(t, 18, 20, 2.5, 4.5).width).toBeLessThan(5.8);
    // the cockpit windscreen sits low on the nose, under the forehead
    const glass = t.filter((tr) => tr.color[0] < 0.02 && tr.color[2] < 0.03 && tr.p.every((p) => p[0] > 25));
    expect(glass.length).toBeGreaterThan(20);
    expect(Math.max(...glass.flatMap((tr) => tr.p.map((p) => p[1])))).toBeLessThan(5.6);
    // the titles: navy strokes along both sides of the bulge
    const titles = t.filter((tr) => tr.color[2] > 0.05 && tr.color[0] < 0.01 && tr.p.every((p) => p[1] > 7 && p[1] < 9.1 && p[0] > -7 && p[0] < 16));
    expect(titles.filter((tr) => tr.p[0]![2] > 0).length).toBeGreaterThan(200);
    expect(titles.filter((tr) => tr.p[0]![2] < 0).length).toBeGreaterThan(200);
  });

  it("tucks the Beluga's cockpit low under a slanted forehead", () => {
    const t = tris("proc-vehicle-airbus-beluga");
    // 1.5 m behind the tip the cockpit roof is still low (5.5 m), 3.5 m behind it
    // the forehead has climbed to about 8 m rather than standing as a dome
    expect(slice(t, 26.3, 26.8).top).toBeLessThan(5.8);
    expect(slice(t, 24.2, 24.8).top).toBeGreaterThan(7.6);
    expect(slice(t, 24.2, 24.8).top).toBeLessThan(9.2);
    // the bill is narrow: 3 m behind the tip it is under 4 m wide
    expect(slice(t, 24.9, 25.4, 2, 5).width).toBeLessThan(4);
  });

  it("cuts the Beluga's blue tail along a straight diagonal, not in whole triangles", () => {
    const t = tris("proc-vehicle-airbus-beluga");
    const blue = t.filter((tr) => tr.color[2] > 0.05 && tr.color[0] < 0.01 && tr.p.every((p) => Math.abs(p[2]) > 0.6 && Math.abs(p[2]) < 4 && p[0] < -10));
    expect(blue.length).toBeGreaterThan(50);
    for (const tr of blue) for (const p of tr.p) expect(p[0]).toBeLessThanOrEqual(-16 - 0.8 * (p[1] - 2) + 1e-4);
    // and the white skin right ahead of the cut reaches the plane
    const white = t.filter((tr) => tr.color[0] > 0.8 && tr.p.every((p) => Math.abs(p[2]) > 0.6 && p[0] < -10));
    expect(white.some((tr) => tr.p.some((p) => Math.abs(p[0] - (-16 - 0.8 * (p[1] - 2))) < 1e-4))).toBe(true);
  });
});

describe("the small airplane", () => {
  const id = "proc-vehicle-small-airplane";
  // the bounds of the community model in assets/small-airplane/small-airplane.glb
  const REF = { min: [-4.38, 0, -3.74], max: [4.38, 2.17, 3.74] };
  const colors = (): string[] => design(id).params!.find((p) => p.name === "color")!.values.map((v) => v.value);

  it("defaults to blue and offers four colours", () => {
    expect(colors()).toEqual(["blue", "red", "yellow", "green"]);
    expect(design(id).params![0]!.default).toBe("blue");
  });

  it.each(colors().map((c) => [c] as const))("in %s keeps the reference's axes and size, stays in budget and does not flicker", (color) => {
    const glb = design(id).build({ color }).toGlb(id);
    const s = glbStats(glb);
    expect(s.triangles).toBeLessThanOrEqual(BUDGET);
    for (let k = 0; k < 3; k++) {
      const want = REF.max[k]! - REF.min[k]!;
      expect(Math.abs(s.max[k] - s.min[k] - want) / want).toBeLessThanOrEqual(0.05);
    }
    expect(s.min[1]).toBeCloseTo(0, 2);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
  });

  it("points its nose at +Z (the white spinner) and has the red light on the left wing (+X)", () => {
    const { json, bin } = parseGlb(design(id).build().toGlb(id));
    const t = collectTriangles(json, bin);
    const zMax = Math.max(...t.flatMap((tr) => tr.p.map((p) => p[2])));
    const nose = t.filter((tr) => tr.p.some((p) => p[2] > zMax - 0.01));
    expect(nose.length).toBeGreaterThan(0);
    expect(nose.every((tr) => tr.color[0] > 0.8 && tr.color[1] > 0.8)).toBe(true);
    const red = t.filter((tr) => tr.color[0] > 0.7 && tr.color[1] < 0.1 && tr.color[2] < 0.1);
    expect(red.length).toBeGreaterThan(0);
    expect(red.every((tr) => tr.p.every((p) => p[0] > 4))).toBe(true);
  });

  it("is deterministic", () => {
    expect(design(id).build({ color: "yellow" }).toGlb(id)).toEqual(design(id).build({ color: "yellow" }).toGlb(id));
  });
});
