// The North American steam locomotives (generator/usSteam.ts). See docs/models/us-steam.md.
import { describe, expect, it } from "vitest";
import { US_STEAM, usSteamSpec } from "../generator/usSteam";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { coverageCombinations } from "../generator/design";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";

const ft = (feet: number, inches = 0) => feet * 0.3048 + inches * 0.0254;

/** Published driver diameters and wheel arrangements (leading, drivers per engine, trailing). */
const FIGURES: Record<string, { driver: number; leading: number; drivers: number[]; trailing: number }> = {
  "proc-vehicle-up-big-boy": { driver: ft(0, 68), leading: 2, drivers: [4, 4], trailing: 2 },
  "proc-vehicle-prr-k4s": { driver: ft(0, 80), leading: 2, drivers: [3], trailing: 1 },
  "proc-vehicle-nyc-hudson": { driver: ft(0, 79), leading: 2, drivers: [3], trailing: 2 },
  "proc-vehicle-american-440": { driver: ft(0, 60), leading: 2, drivers: [2], trailing: 0 },
};

describe("the US steam locomotives", () => {
  it("are four steam designs with a locomotive and a tender, on the US gauge", () => {
    expect(US_STEAM.map((d) => d.id)).toEqual(Object.keys(FIGURES));
    for (const d of US_STEAM) {
      expect(d.catalog).toMatchObject({ traction: "steam", group: "loco" });
      expect(d.loadingGauge).toBe("us");
      expect(d.params![0]).toMatchObject({ name: "unit", default: "locomotive" });
    }
    expect(US_STEAM[3]!.params![1]!.values.map((v) => v.value)).toEqual(["jupiter", "no119"]);
  });

  for (const d of US_STEAM) {
    const f = FIGURES[d.id]!;
    it(`${d.id}: the published wheel arrangement and drivers`, () => {
      const spec = usSteamSpec(d.id);
      const coupled = spec.gear.engines.map((e) => e.coupled.length);
      expect(coupled).toEqual(f.drivers);
      const drivers = spec.gear.engines.flatMap((e) => e.coupled.map((i) => spec.gear.wheels[i]!));
      for (const w of drivers) expect(w.d).toBeCloseTo(f.driver, 2);
      const carrying = spec.gear.wheels.filter((_, i) => !spec.gear.engines.some((e) => e.coupled.includes(i)));
      const firstDriver = Math.min(...drivers.map((w) => w.x));
      expect(carrying.filter((w) => w.x < firstDriver)).toHaveLength(f.leading);
      expect(carrying.filter((w) => w.x > firstDriver)).toHaveLength(f.trailing);
    });

    it(`${d.id}: every combination inside the US gauge and the budget, without z-fighting, smoking from its stack`, () => {
      for (const v of coverageCombinations(d.params, d.finishParams)) {
        const m = d.build(v);
        const glb = m.toGlb(d.id);
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.us.width);
        expect(s.max[1]).toBeLessThanOrEqual(LOADING_GAUGES.us.height);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        if (v.unit !== "tender") expect(m.emitters().some((e) => e.kind === "smoke")).toBe(true);
        const low = buildLodModel(d, v);
        expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
      }
    });
  }

  it("draws the Big Boy as two engines under one boiler, 4-8-8-4", () => {
    const spec = usSteamSpec("proc-vehicle-up-big-boy");
    expect(spec.gear.engines.map((e) => e.name)).toEqual(["front", "rear"]);
    expect(spec.gear.wheels).toHaveLength(12);
  });

  it("gives Jupiter its balloon stack and No. 119 its straight one", () => {
    const top = (livery: string) => glbStats(US_STEAM[3]!.build({ livery }).toGlb("a")).max[1];
    expect(top("no119")).toBeLessThan(top("jupiter"));
  });
});
