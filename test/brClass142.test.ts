import { describe, it, expect } from "vitest";
import { UK_UNITS } from "../generator/ukUnits.ts";
import { C142_CAR, C142_WHEELBASE } from "../generator/brClass142.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import type { ParamValues } from "../generator/design.ts";

// the Class 142 Pacer's own two-axle cars (generator/brClass142.ts, docs/models/uk-trains.md)
const design = UK_UNITS.find((d) => d.id === "proc-vehicle-br-class-142")!;
const LIVERIES = ["provincial", "northern", "walesTeal"];

function bounds(params: ParamValues) {
  const m = design.build(params);
  const glb = m.toGlb("test");
  const { json, bin } = parseGlb(glb);
  const pts = collectTriangles(json, bin).flatMap((t) => t.p);
  const ax = (i: number) => [Math.min(...pts.map((p) => p[i]!)), Math.max(...pts.map((p) => p[i]!))] as const;
  return { m, glb, x: ax(0), y: ax(1), z: ax(2) };
}

describe("Class 142 Pacer", () => {
  it("keeps the series kit's parameters and adds the Arriva Wales teal", () => {
    expect((design.params ?? []).map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "endCar", ["endCar", "train"]],
      ["livery", "provincial", LIVERIES],
    ]);
  });

  for (const livery of LIVERIES)
    it(`${livery}: one car within the W6a gauge, its length over the buffers, no coplanar faces`, () => {
      const b = bounds({ livery });
      expect(b.m.triangleCount()).toBeLessThanOrEqual(16000);
      expect(b.x[0]).toBeCloseTo(-C142_CAR / 2, 3);
      expect(b.x[1]).toBeCloseTo(C142_CAR / 2, 3);
      expect(b.y[0]).toBeCloseTo(0, 4);
      expect(b.y[1]).toBeLessThanOrEqual(4.0);
      expect(b.z[1] - b.z[0]).toBeLessThanOrEqual(2.82);
      expect(findCoplanarOverlaps(b.glb)).toEqual([]);
    });

  it("rides on two single axles 9.0 m apart, not on bogies", () => {
    const rig = design.build({}).rig!;
    const xs = rig.supports!.map((s) => s.x).sort((a, b) => a - b);
    expect(xs).toHaveLength(2);
    expect(xs[0]).toBeCloseTo(-C142_WHEELBASE / 2, 2);
    expect(xs[1]).toBeCloseTo(C142_WHEELBASE / 2, 2);
    expect(rig.supports!.every((s) => s.axles === 1)).toBe(true);
  });

  it("couples two cars, the rear one turned, hinged at the coupling between them", () => {
    const b = bounds({ unit: "train", livery: "walesTeal" });
    expect(b.x[0]).toBeCloseTo(-C142_CAR, 3);
    expect(b.x[1]).toBeCloseTo(C142_CAR, 3);
    const rig = b.m.rig!;
    expect(rig.sections).toHaveLength(2);
    expect(rig.joints).toHaveLength(1);
    expect(rig.sections![1]!.pivot[0]).toBeCloseTo(0, 6);
    const sp = [...rig.supports!].sort((p, q) => p.x - q.x);
    expect(sp.map((s) => s.sections)).toEqual([[1], [1], [0], [0]]);
    [-C142_CAR / 2 - 4.5, -C142_CAR / 2 + 4.5, C142_CAR / 2 - 4.5, C142_CAR / 2 + 4.5].forEach((x, i) => expect(sp[i]!.x).toBeCloseTo(x, 2));
    expect(findCoplanarOverlaps(b.glb)).toEqual([]);
    // each car's exhaust smokes at its own inner end, beside the coupling (an emitter is placed, not moved by the frame)
    const smoke = b.m.emitters().map((e) => e.at).sort((p, q) => p[0] - q[0]);
    expect(smoke).toHaveLength(2);
    expect(smoke[0]![0]).toBeCloseTo(-0.8, 2);
    expect(smoke[0]![2]).toBeCloseTo(0.95, 2);
    expect(smoke[1]![0]).toBeCloseTo(0.8, 2);
    expect(smoke[1]![2]).toBeCloseTo(-0.95, 2);
  });

  it("keeps the distant models within budget", () => {
    for (const livery of LIVERIES) {
      expect(design.buildLod({ livery }).triangleCount()).toBeLessThanOrEqual(100);
      expect(design.buildLod({ unit: "train", livery }).triangleCount()).toBeLessThanOrEqual(200);
    }
  });
});
