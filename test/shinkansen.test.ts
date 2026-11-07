// The later Shinkansen series (generator/shinkansen.ts). See docs/models/shinkansen.md.
import { describe, expect, it } from "vitest";
import { SHINKANSEN_DESIGNS, SHINKANSEN_SERIES, shinkansenTrain } from "../generator/shinkansen";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { readTriangles } from "../generator/renderGlbThumb";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";

describe("the later Shinkansen", () => {
  it("are seven series on the Shinkansen gauge, each an end car, a middle car and a train of 3 - 8", () => {
    expect(SHINKANSEN_DESIGNS.map((d) => d.id)).toEqual(Object.keys(SHINKANSEN_SERIES));
    for (const d of SHINKANSEN_DESIGNS) {
      expect(d.loadingGauge).toBe("shinkansen");
      expect(d.catalog).toMatchObject({ group: "unit", traction: "electric" });
      expect(d.params!.map((p) => p.name)).toEqual(["unit", "cars", "livery"]);
      expect(d.params![0]!.default).toBe("endCar");
      expect(d.params![2]!.values).toHaveLength(2);
      for (const p of d.params!) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
    }
  });

  for (const d of SHINKANSEN_DESIGNS) {
    const s = SHINKANSEN_SERIES[d.id]!;
    it(`${d.id}: the end and middle cars at their lengths, inside the gauge, in budget, without z-fighting`, () => {
      for (const [unit, len] of [["endCar", s.endLength], ["middleCar", s.midLength]] as const) {
        const m = d.build({ unit });
        const glb = m.toGlb(unit);
        const st = glbStats(glb);
        expect(st.max[0] - st.min[0]).toBeCloseTo(len, 1);
        expect(st.max[2] - st.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.shinkansen.width);
        expect(st.triangles).toBeLessThanOrEqual(16000);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        expect(m.rig!.supports).toHaveLength(2);
      }
      // the end car's body under the gauge's height; the middle car raises its pantograph to the wire
      expect(glbStats(d.build().toGlb("e")).max[1]).toBeLessThanOrEqual(LOADING_GAUGES.shinkansen.height);
      expect(glbStats(d.build({ unit: "middleCar" }).toGlb("m")).max[1]).toBeGreaterThan(5.8);
    });

    // the sampled trains' flicker, budget and distant models are the catalog sweep's (test/catalogSweep.ts)
    it(`${d.id}: the default train at its formation's length, one section a car`, () => {
      const m = d.build({ unit: "train" });
      const st = glbStats(m.toGlb("t"));
      expect(st.max[0] - st.min[0]).toBeCloseTo(2 * s.endLength + 2 * s.midLength, 1);
      expect(m.rig!.sections).toHaveLength(4);
      expect(buildLodModel(d, { unit: "train" }).triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    });
  }

  // regression: the E5's windscreen read as a pale blob over the whole canopy crown (docs/models/shinkansen.md)
  it("gives the E5's canopy a dark windscreen on its front under a green crown, the headlights inside it", () => {
    const d = SHINKANSEN_DESIGNS.find((x) => x.id === "proc-vehicle-shinkansen-e5")!;
    const { json, bin } = parseGlb(d.build().toGlb("e5"));
    const tris = collectTriangles(json, bin);
    const tip = Math.max(...tris.flatMap((t) => t.p.map((p) => p[0])));
    const of = (mat: string) => tris.filter((t) => t.material === mat && t.p.every((p) => p[0] > tip - 13));
    const normal = (t: (typeof tris)[number]) => {
      const [a, b, c] = t.p, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]] as const;
    };
    const glass = of("e5Glass");
    expect(glass.length).toBeGreaterThan(100);
    // very dark glass, nothing like the green or the white
    expect(Math.max(...glass[0]!.color)).toBeLessThan(0.03);
    // seen head-on (the area facing forward, projected on the front) a wide pane: over 0.5 m2, wider than 1.5 m
    const front = glass.map(normal).reduce((s, n) => s + Math.max(0, n[0]) / 2, 0);
    expect(front).toBeGreaterThan(0.5);
    const zs = glass.flatMap((t) => t.p.map((p) => p[2]));
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(1.5);
    // under the crown: no glass above 3 m and none lying flat on the canopy's top
    expect(Math.max(...glass.flatMap((t) => t.p.map((p) => p[1])))).toBeLessThan(3.0);
    const top = glass.map(normal).reduce((s, n) => s + Math.max(0, Math.abs(n[1]) - 0.9 * Math.hypot(...n)) / 2, 0);
    expect(top).toBeLessThan(0.01);
    expect(of("rubber").length).toBeGreaterThan(0);
    // the four headlights within the glass's height and width
    const lamps = of("lampHead");
    expect(lamps).toHaveLength(8);
    const ys = glass.flatMap((t) => t.p.map((p) => p[1]));
    for (const p of lamps.flatMap((t) => t.p)) {
      expect(p[1]).toBeGreaterThan(Math.min(...ys));
      expect(p[1]).toBeLessThan(Math.max(...ys));
      expect(Math.abs(p[2])).toBeLessThan(Math.max(...zs) - 0.2);
    }
  });

  it("puts the pantographs on the second and next-to-last cars, the rear end car turned", () => {
    const t = shinkansenTrain(SHINKANSEN_SERIES["proc-vehicle-shinkansen-n700s"]!, 8);
    expect(t.map((x) => x.pantograph)).toEqual([false, false, true, false, false, true, false, false]);
    expect(t.map((x) => x.turned)).toEqual([false, false, false, false, false, false, false, true]);
    expect(shinkansenTrain(SHINKANSEN_SERIES["proc-vehicle-shinkansen-n700s"]!, 3).map((x) => x.pantograph)).toEqual([false, true, false]);
  });

  it("draws the E6's windscreen on its canopy only: one glass wrapping from the front into the side windows", () => {
    // regression: the windscreen was a polygon seen head on, smeared along the twisting nose round the canopy
    const tris = readTriangles(SHINKANSEN_DESIGNS.find((d) => d.id === "proc-vehicle-shinkansen-e6")!.build().toGlb("e6"));
    const tip = Math.max(...tris.flatMap((t) => t.p.map((p) => p[0])));
    for (const mat of ["e6Glass", "cabMask"]) {
      const pts = tris.filter((t) => t.material === mat).flatMap((t) => t.p);
      expect(pts.length, mat).toBeGreaterThan(0);
      const range = (f: (p: readonly number[]) => number) => [Math.min(...pts.map(f)), Math.max(...pts.map(f))];
      const [d0, d1] = range((p) => tip - p[0]!), [y0, y1] = range((p) => p[1]!), [z0, z1] = range((p) => p[2]!);
      // on the canopy, 1.6 m wide, its foot level above the headlights' lens, from the front back to 7.2 m
      expect(Math.max(-z0, z1), mat).toBeLessThanOrEqual(0.8);
      expect(y0, mat).toBeGreaterThanOrEqual(2.1);
      expect(y1, mat).toBeLessThanOrEqual(3.05);
      expect(d0, mat).toBeGreaterThan(3.7);
      expect(d1, mat).toBeLessThan(7.2);
      expect(d1 - d0, mat).toBeGreaterThan(2.8);
    }
  });
});
