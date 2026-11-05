// Every working pantograph a design draws raised is a `liftable` mechanism
// (generator/liftable.ts): a `state` clip from folded at time 0 to raised at
// time 1, the raised pose at rest, and nothing of it at low detail; raised, its
// collector touches the game's wire (generator/collector.ts). And every
// vehicle with lamps names their roles (docs/models/lamps.md). See
// docs/models/animation.md.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { swept } from "./catalogCache";

/** The vehicles the whole-catalog suites build (catalogCache.ts swept). */
const SWEPT_VEHICLES = swept(ALL_VEHICLES);
import { parseGlb } from "../generator/glbTriangles.ts";
import { glbStats } from "../generator/glbStats.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { LIFT_SAMPLES } from "../generator/liftable.ts";
import { buildLodModel } from "../generator/lodModel.ts";
import { variantsUnderTest } from "./catalogCache";
import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "../generator/collector.ts";
import { TRAM_DESIGNS } from "../generator/trams.ts";

/** The highest y of the material `mat` (every material when absent). */
function topOf(m: unknown, mat?: string): number {
  let y = -Infinity;
  for (const [k, g] of (m as { groups: Map<string, { pos: number[] }> }).groups) if (!mat || k === mat) for (let i = 1; i < g.pos.length; i += 3) y = Math.max(y, g.pos[i]!);
  return y;
}

/**
 * What the tests read of every vehicle's default model, from one build of it
 * (the file built each default three times over before).
 */
const DEFAULTS = new Map(
  SWEPT_VEHICLES.map((d) => {
    const m = d.build();
    const groups = (m as unknown as { groups: Map<string, unknown> }).groups;
    return [d.id, { pantograph: m.positions().length > 0 && groups.has("pantograph"), carbon: groups.has("carbon"), carbonTop: topOf(m, "carbon"), top: topOf(m), lamps: m.lamps() }] as const;
  }),
);

/** The designs whose default model draws a pantograph (the material). */
const ELECTRIC = SWEPT_VEHICLES.filter((d) => DEFAULTS.get(d.id)!.pantograph);

describe("pantographs", () => {
  it("are found on the electric locomotives, units and trams", () => {
    expect(ELECTRIC.length).toBeGreaterThan(20);
  });

  for (const d of ELECTRIC) {
    for (const params of variantsUnderTest(d)) {
      it(`${d.id} ${JSON.stringify(params)} folds and raises its working pantographs`, () => {
        const m = d.build(params);
        const glb = m.toGlb(d.title, d.id);
        const { json } = parseGlb(glb);
        const anims = (json as { animations?: Array<{ name: string }> }).animations ?? [];
        const extras = (json as { scenes: Array<{ extras?: { clipDrives?: Record<string, { drive: string }> } }> }).scenes[0]!.extras;
        const lifts = anims.map((a, i) => ({ a, i })).filter(({ a }) => extras?.clipDrives?.[a.name]?.drive === "state");
        // a design that draws every pantograph folded (a trailer of a unit) has none to raise
        const raised = glbStats(glb).max[1];
        if (lifts.length === 0) return;
        for (const { a, i } of lifts) {
          expect(a.name).toMatch(/^pantograph\d+$/);
          expect(sampleCount(glb, i)).toBe(LIFT_SAMPLES + 1);
          // the last sample is the rest pose, the first folds the collector down
          expect(glbStats(poseGlb(glb, LIFT_SAMPLES, i)).max[1]).toBeCloseTo(raised, 4);
        }
        // folded together, the train is lower by at least half a metre, and nothing z-fights
        let folded = glb;
        for (const { i } of lifts) folded = poseGlb(folded, 0, i);
        expect(glbStats(folded).max[1]).toBeLessThan(raised - 0.5);
        expect(findCoplanarOverlaps(folded)).toEqual([]);
        // the low level of detail stays still
        expect(buildLodModel(d, params).animations()).toHaveLength(0);
      });
    }
  }
});

describe("collector heights", () => {
  const trams = new Set(TRAM_DESIGNS.map((d) => d.id));
  // steam and diesel locomotives, coaches and wagons collect no current: no variant of theirs is built to look for a collector
  const unpowered = (v: (typeof ALL_VEHICLES)[number]) => v.catalog?.traction === "steam" || v.catalog?.traction === "diesel" || v.catalog?.group === "coach" || v.catalog?.group === "wagon";
  it("finds no collector on the families that cannot have one", () => {
    for (const d of SWEPT_VEHICLES.filter((v) => v.catalog?.category === "Rail vehicles" && unpowered(v))) expect(DEFAULTS.get(d.id)!.carbon, d.id).toBe(false);
  });
  for (const d of SWEPT_VEHICLES.filter((v) => v.catalog?.category === "Rail vehicles" && !unpowered(v))) {
    const wire = trams.has(d.id) ? TRAM_COLLECTOR_TOP : RAIL_COLLECTOR_TOP;
    variantsUnderTest(d).forEach((params, i) => {
      it(`${d.id} ${JSON.stringify(params)} raises its collector to the game's wire`, () => {
        // the first combination is the defaults, already built
        let at = DEFAULTS.get(d.id)!;
        if (i > 0) {
          const m = d.build(params);
          const groups = (m as unknown as { groups: Map<string, unknown> }).groups;
          at = { ...at, carbon: groups.has("carbon"), carbonTop: topOf(m, "carbon"), top: topOf(m) };
        }
        // a car without a pantograph (a trailer) has no carbon strip to raise
        if (!at.carbon) return;
        expect(at.carbonTop).toBeCloseTo(wire, 3);
        // nothing stands above the wire, and the low detail's collector is no higher
        expect(at.top).toBeCloseTo(wire, 3);
        expect(topOf(buildLodModel(d, params))).toBeLessThan(wire + 1e-3);
      });
    });
  }
});

describe("lamps", () => {
  const ROLES = new Set(["head", "tail", "brake", "indicator"]);
  for (const d of SWEPT_VEHICLES) {
    it(`${d.id} names a known role for every lamp it draws`, () => {
      const lamps = DEFAULTS.get(d.id)!.lamps;
      if (!lamps) return;
      for (const [mat, l] of Object.entries(lamps.materials)) {
        expect(ROLES.has(l.role), mat).toBe(true);
        expect(l.lit).toMatch(/^#[0-9a-f]{6}$/);
        expect(l.intensity).toBeGreaterThan(0);
      }
    });
  }

  it("light every road vehicle's way ahead", () => {
    for (const d of SWEPT_VEHICLES.filter((v) => v.catalog?.category === "Road vehicles")) {
      const roles = Object.values(DEFAULTS.get(d.id)!.lamps?.materials ?? {}).map((l) => l.role);
      expect(roles, d.id).toContain("head");
    }
  });
});
