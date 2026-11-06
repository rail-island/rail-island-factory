import { describe, it, expect } from "vitest";
import { UK_UNITS } from "../generator/ukUnits.ts";
import { C158_BOGIES, C158_CAR } from "../generator/brClass158.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import type { ParamValues } from "../generator/design.ts";

// the Class 158's own cars (generator/brClass158.ts, docs/models/uk-trains.md)
const design = UK_UNITS.find((d) => d.id === "proc-vehicle-br-class-158")!;
const LIVERIES = ["regional", "northern"];

function bounds(params: ParamValues) {
  const m = design.build(params);
  const glb = m.toGlb("test");
  const { json, bin } = parseGlb(glb);
  const pts = collectTriangles(json, bin).flatMap((t) => t.p);
  const ax = (i: number) => [Math.min(...pts.map((p) => p[i]!)), Math.max(...pts.map((p) => p[i]!))] as const;
  return { m, glb, pts, x: ax(0), y: ax(1), z: ax(2) };
}

function ids(params: ParamValues): string[] {
  const out: string[] = [];
  const walk = (n: any) => { out.push(n.id); for (const k of n.children ?? []) walk(k); };
  walk(design.build(params).sourceTree(design.id, design.title).root);
  return out;
}

describe("Class 158", () => {
  it("keeps the series kit's parameters", () => {
    expect((design.params ?? []).map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "endCar", ["endCar", "train"]],
      ["livery", "regional", LIVERIES],
    ]);
  });

  for (const livery of LIVERIES)
    it(`${livery}: one car within the W6a gauge, its length over the couplers, no coplanar faces`, () => {
      const b = bounds({ livery });
      expect(b.m.triangleCount()).toBeLessThanOrEqual(16000);
      expect(b.x[0]).toBeCloseTo(-C158_CAR / 2, 3);
      expect(b.x[1]).toBeCloseTo(C158_CAR / 2, 3);
      expect(b.y[0]).toBeCloseTo(0, 4);
      expect(b.y[1]).toBeLessThanOrEqual(4.0);
      expect(b.z[1] - b.z[0]).toBeLessThanOrEqual(2.82);
      expect(findCoplanarOverlaps(b.glb)).toEqual([]);
    });

  it("has a flat cab front with the gangway door between two windscreens, not a rounded nose", () => {
    const tree = ids({ livery: "northern" });
    expect(tree.filter((id) => /^cab-end\/skin\/pane-\d$/.test(id))).toHaveLength(2);
    expect(tree.filter((id) => /^cab-end\/skin\/surround-\d$/.test(id))).toHaveLength(2);
    for (const part of ["frame-left", "frame-right", "frame-top", "leaf"]) expect(tree.includes(`cab-end/gangway-door/${part}`), part).toBe(true);
    // the face is raked: at the windscreens' height it stands within 0.25 m of the cab front's foot (a nose would be far behind)
    const b = bounds({ livery: "northern" });
    const front = (y0: number, y1: number) => Math.max(...b.pts.filter((p) => p[1] >= y0 && p[1] <= y1 && Math.abs(p[2]!) > 0.55 && Math.abs(p[2]!) < 1.1).map((p) => p[0]!));
    const foot = front(1.2, 1.3);
    expect(foot - front(2.95, 3.2)).toBeGreaterThan(0.1);
    expect(foot - front(2.95, 3.2)).toBeLessThan(0.3);
    // the Northern blue panel over the cab end of each side
    expect(tree.some((id) => /^body\/right-side\/end-panel$/.test(id))).toBe(true);
    expect(ids({ livery: "regional" }).some((id) => /end-panel/.test(id))).toBe(false);
  });

  it("has a double plug door at each end of each side and nine saloon windows", () => {
    const tree = ids({});
    for (const side of ["right-side", "left-side"]) {
      expect(tree.filter((id) => new RegExp(`^body/${side}/door-\\d$`).test(id))).toHaveLength(2);
      expect(tree.filter((id) => new RegExp(`^body/${side}/windows/window-\\d+$`).test(id))).toHaveLength(9);
    }
  });

  it("rides on two bogies 16.0 m apart", () => {
    const rig = design.build({}).rig!;
    const xs = rig.supports!.map((s) => s.x).sort((a, b) => a - b);
    expect(xs).toHaveLength(2);
    expect(xs[0]).toBeCloseTo(-C158_BOGIES / 2, 2);
    expect(xs[1]).toBeCloseTo(C158_BOGIES / 2, 2);
  });

  it("couples two cars, the rear one turned, hinged at the coupling between them", () => {
    const b = bounds({ unit: "train", livery: "northern" });
    expect(b.x[0]).toBeCloseTo(-C158_CAR, 3);
    expect(b.x[1]).toBeCloseTo(C158_CAR, 3);
    const rig = b.m.rig!;
    expect(rig.sections).toHaveLength(2);
    expect(rig.joints).toHaveLength(1);
    const sp = [...rig.supports!].sort((p, q) => p.x - q.x);
    expect(sp.map((s) => s.sections)).toEqual([[1], [1], [0], [0]]);
    [-C158_CAR / 2 - 8, -C158_CAR / 2 + 8, C158_CAR / 2 - 8, C158_CAR / 2 + 8].forEach((x, i) => expect(sp[i]!.x).toBeCloseTo(x, 2));
    expect(findCoplanarOverlaps(b.glb)).toEqual([]);
    expect(b.m.emitters()).toHaveLength(2);
  });

  it("keeps the distant models within budget", () => {
    for (const livery of LIVERIES) {
      expect(design.buildLod({ livery }).triangleCount()).toBeLessThanOrEqual(100);
      expect(design.buildLod({ unit: "train", livery }).triangleCount()).toBeLessThanOrEqual(200);
    }
  });
});
