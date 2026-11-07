// The JNR locomotives and the Blue Train coach (generator/jpLocos.ts). See docs/models/jnr-locos.md.
import { describe, expect, it } from "vitest";
import { BLUE_LENGTH, EF66_LENGTH, JNR_LOCOS, jnrSteamSpec } from "../generator/jpLocos";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { coverageCombinations } from "../generator/design";

const design = (id: string) => JNR_LOCOS.find((d) => d.id === id)!;

describe("the JNR locomotives and the Blue Train", () => {
  it("are five designs on the UIC gauge with their groups", () => {
    expect(JNR_LOCOS.map((d) => d.id)).toEqual(["proc-vehicle-jnr-c62", "proc-vehicle-jnr-d51", "proc-vehicle-jnr-ef66", "proc-vehicle-jnr-dd51", "proc-vehicle-blue-train-24"]);
    expect(JNR_LOCOS.map((d) => d.catalog?.traction)).toEqual(["steam", "steam", "electric", "diesel", undefined]);
    for (const d of JNR_LOCOS) for (const p of d.params ?? []) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
  });

  for (const d of JNR_LOCOS)
    it(`${d.id}: every combination inside the UIC gauge (a raised pantograph aside), in budget, without z-fighting`, () => {
      for (const v of coverageCombinations(d.params, d.finishParams)) {
        const m = d.build(v);
        const glb = m.toGlb(d.id);
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.uic.width);
        if (d.id !== "proc-vehicle-jnr-ef66") expect(s.max[1]).toBeLessThanOrEqual(LOADING_GAUGES.uic.height);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      }
    });

  it("gives the C62 three 1,750 mm drivers and the D51 four of 1,400 mm, each with its tender", () => {
    const c62 = jnrSteamSpec("proc-vehicle-jnr-c62");
    expect(c62.gear.engines[0]!.coupled.map((i) => c62.gear.wheels[i]!.d)).toEqual([1.75, 1.75, 1.75]);
    const d51 = jnrSteamSpec("proc-vehicle-jnr-d51");
    expect(d51.gear.engines[0]!.coupled.map((i) => d51.gear.wheels[i]!.d)).toEqual([1.4, 1.4, 1.4, 1.4]);
    // the drivers at the published 1,550 mm pitch; engine and 8-20 tender 19.73 m over the couplers
    const drivers = d51.gear.engines[0]!.coupled.map((i) => d51.gear.wheels[i]!.x);
    for (let i = 1; i < drivers.length; i++) expect(drivers[i]! - drivers[i - 1]!).toBeCloseTo(1.55, 5);
    const tender = jnrSteamSpec("proc-vehicle-jnr-d51", { unit: "tender" });
    expect(d51.heads[1] - d51.heads[0] + tender.heads[1] - tender.heads[0]).toBeCloseTo(19.73, 5);
  });

  it("gives the D51 one dome casing: the standard's 2.6 m casing behind the chimney, the namekuji's long one from it", () => {
    const span = (variant: string) => {
      const s = jnrSteamSpec("proc-vehicle-jnr-d51", { variant });
      expect(s.volumes).toHaveLength(1);
      const plan = s.volumes![0]!.plan;
      return { x0: plan[0]![0], x1: plan[plan.length - 1]![0], chimney: s.chimney!.x };
    };
    const std = span("standard");
    expect(std.x1 - std.x0).toBeCloseTo(2.65, 1);
    expect(std.x0 - std.chimney).toBeGreaterThan(1.2);
    const nam = span("namekuji");
    expect(nam.x1 - nam.x0).toBeGreaterThan(5);
    expect(Math.abs(nam.x0 - nam.chimney)).toBeLessThan(0.35);
  });

  it("runs the EF66 and the DD51 on three bogies, the EF66's rear pantograph raised", () => {
    const ef = design("proc-vehicle-jnr-ef66").build();
    expect(ef.rig!.supports).toHaveLength(3);
    const s = glbStats(ef.toGlb("ef"));
    expect(s.max[0] - s.min[0]).toBeCloseTo(EF66_LENGTH, 1);
    expect(s.max[1]).toBeGreaterThan(5.8);
    expect(design("proc-vehicle-jnr-dd51").build().rig!.supports).toHaveLength(3);
  });

  it("builds the Blue Train's sleeper and dining car at 20.8 m with a door each side", () => {
    for (const unit of ["sleeper", "dining"]) {
      const m = design("proc-vehicle-blue-train-24").build({ unit });
      expect(glbStats(m.toGlb("b")).max[0] - glbStats(m.toGlb("b")).min[0]).toBeCloseTo(BLUE_LENGTH, 1);
      expect(m.animations().filter((c) => c.drive.drive === "door")).toHaveLength(2);
    }
  });
});
