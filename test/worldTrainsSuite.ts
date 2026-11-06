// The trains of the eight-country plan (docs/specs/2026-11-05-trains-of-eight-countries.md):
// every design of the plan's kit families (KIT_FAMILY_MODULES, test/catalogCache.ts), on
// its defaults and a sampled combination - no z-fighting, emitters on their mouths, inside
// its loading gauge and the triangle budget, doors opening exactly on a passenger car, its
// supports and bogie pivots -
// at its published length, its LOD inside its budget, filed under its country, every
// parameter value fitting the game's 16-character button. The catalog sweep and the door
// suite run their full checks on each module's first design (docs/guide/setup-and-build.md).
// test/worldTrains.test.ts runs the first quarter and the shared checks, worldTrains-2..4 the
// others (worldTrainsSuite), so the workers share them.

import { describe, expect, it } from "vitest";
import { DESIGNS, designSource } from "../generator/generate";
import { COUNTRY_OF } from "../generator/countryTable";
import { loadingGaugeOf } from "../generator/loadingGauge";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { RAIL_COLLECTOR_TOP } from "../generator/collector";
import { lodBudget } from "../generator/lod";
import { buildLodModel } from "../generator/lodModel";
import { KIT_FAMILY_MODULES, variantsUnderTest } from "./catalogCache";
import { expectEmittersOnMouths } from "./emitterCheck";
import { parseGlb } from "../generator/glbTriangles";

const FAMILIES = [...DESIGNS.values()].filter((d) => KIT_FAMILY_MODULES.has(designSource(d.id)));

/** The length (m) each default build spans over its buffers or couplers, where the design states one. */
const LENGTHS: Record<string, number> = {
  "proc-vehicle-db-103": 20.2, "proc-vehicle-db-101": 19.1, "proc-vehicle-db-120": 19.2, "proc-vehicle-drg-e18": 16.92,
  "proc-vehicle-drg-e94": 18.6, "proc-vehicle-db-v200": 18.53, "proc-vehicle-db-218": 16.4, "proc-vehicle-db-ic-coach": 26.4,
  "proc-vehicle-db-vt98": 13.95, "proc-vehicle-db-650": 25.5,
  "proc-vehicle-sncf-cc6500": 20.19, "proc-vehicle-sncf-cc40100": 22.03, "proc-vehicle-sncf-bb22200": 17.48, "proc-vehicle-sncf-cc7100": 18.92,
  "proc-vehicle-sncf-bb9200": 16.2, "proc-vehicle-sncf-bb27000": 19.52, "proc-vehicle-sncf-bb67400": 17.09, "proc-vehicle-sncf-cc72000": 20.19,
  "proc-vehicle-sncf-corail-coach": 26.4, "proc-vehicle-sncf-grand-confort": 24.5, "proc-vehicle-ciwl-car": 23.45, "proc-vehicle-sncf-x3800": 21.85, "proc-vehicle-sncf-x73500": 28.9,
  "proc-vehicle-ns-1700": 17.48, "proc-vehicle-ns-1100": 12.93, "proc-vehicle-ns-1300": 18.95, "proc-vehicle-ns-1200": 18.08, "proc-vehicle-ns-2200": 14.1,
  "proc-vehicle-ns-icr-coach": 26.4, "proc-vehicle-ns-de1": 26.0,
  "proc-vehicle-sbb-re460": 18.5, "proc-vehicle-sbb-re420": 15.41, "proc-vehicle-sbb-re620": 19.31, "proc-vehicle-sbb-ae66": 18.4, "proc-vehicle-sbb-ce68": 19.46,
  "proc-vehicle-sbb-ae814": 34.0, "proc-vehicle-rhb-ge443": 16.0, "proc-vehicle-rhb-ge66": 13.3, "proc-vehicle-mgb-hge442": 14.776, "proc-vehicle-sbb-roter-pfeil": 22.4,
  "proc-vehicle-renfe-354": 17.5, "proc-vehicle-renfe-252": 20.38, "proc-vehicle-renfe-269": 17.27, "proc-vehicle-renfe-277": 20.68, "proc-vehicle-renfe-319": 20.0, "proc-vehicle-renfe-333": 20.7,
  "proc-vehicle-br-class-55": 21.18, "proc-vehicle-br-class-37": 18.75, "proc-vehicle-br-class-47": 19.38, "proc-vehicle-br-class-66": 21.35, "proc-vehicle-br-class-86": 17.83,
  "proc-vehicle-br-mk1-coach": 19.66, "proc-vehicle-br-class-378": 20.4,
  "proc-vehicle-ir-wam4": 18.79, "proc-vehicle-ir-wap4": 18.79, "proc-vehicle-ir-wap7": 20.56, "proc-vehicle-ir-wap5": 18.16, "proc-vehicle-ir-wag12b": 35.0,
  "proc-vehicle-ir-lhb-coach": 24.0, "proc-vehicle-ir-icf-coach": 22.3, "proc-vehicle-ir-boxn-wagon": 10.71, "proc-vehicle-cr-c70-wagon": 13.98,
  "proc-vehicle-cr-hxd1": 35.2, "proc-vehicle-cr-hxd3d": 20.85, "proc-vehicle-cr-ss1": 20.4, "proc-vehicle-cr-ss8": 17.5, "proc-vehicle-cr-df4": 20.5, "proc-vehicle-cr-df11": 21.25,
  "proc-vehicle-cr-25t-coach": 26.6,
  "proc-vehicle-sbb-ew4-coach": 26.4, "proc-vehicle-sbb-ic2000": 26.8, "proc-vehicle-glacier-express": 18.4,
};

/** A design's country by the operator prefix of its id. */
const COUNTRY: Record<string, string> = { db: "de", dr: "de", drg: "de", kpev: "de", sncf: "fr", ratp: "fr", ciwl: "fr", ns: "nl", sbb: "ch", rhb: "ch", mgb: "ch", glacier: "ch", renfe: "es", talgo: "es", iryo: "es", br: "gb", lner: "gb", gwr: "gb", lms: "gb", lu: "gb", eurostar: "gb", rocket: "gb", ir: "in", eir: "in", dhr: "in", ncrtc: "in", dmrc: "in", cr: "cn" };

const PASSENGER_GROUPS = new Set(["coach", "unit", "tram", "metro", "bus"]);

export function worldTrainsSuite(index: number, count: number): void {
describe("the eight countries' trains", () => {
  if (index === 0) it("are all filed under their country", () => {
    // the plan's 160 designs and the Class 378 added after it
    expect(FAMILIES.length).toBe(161);
    for (const d of FAMILIES) {
      const prefix = d.id.replace("proc-vehicle-", "").split("-")[0]!;
      expect(COUNTRY_OF.get(d.id), d.id).toBe(COUNTRY[prefix]);
    }
  });

  if (index === 0) it("fit every parameter value's title on the game's button", () => {
    for (const d of FAMILIES) for (const p of d.params ?? []) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
  });

  for (const d of FAMILIES.filter((_, i) => i % count === index))
    it(`${d.id}: its defaults and a sampled combination clean, in gauge and budget, its doors, length and LOD`, () => {
      const g = loadingGaugeOf(d);
      const combos = variantsUnderTest(d);
      const sampled = combos.length > 1 ? [combos[0]!, combos[combos.length - 1]!] : [combos[0] ?? {}];
      sampled.forEach((v, i) => {
        const label = `${d.id} ${JSON.stringify(v)}`;
        const m = d.build(v);
        const glb = m.toGlb(d.id);
        expect(findCoplanarOverlaps(glb), label).toEqual([]);
        expectEmittersOnMouths(m.emitters(), m.emitters().length ? m.positions() : [], label);
        const s = glbStats(glb);
        expect(s.min[1], label).toBeCloseTo(0, 5);
        expect(s.min[2], label).toBeCloseTo(-s.max[2], 5);
        expect(s.max[2] - s.min[2], label).toBeLessThanOrEqual(g.width);
        // a raised pantograph reaches for the wire, above the body's gauge
        expect(s.max[1], label).toBeLessThanOrEqual(d.catalog?.traction === "electric" ? RAIL_COLLECTOR_TOP + 0.01 : g.height);
        const cars = m.rig?.sections?.length ?? 1;
        expect(s.triangles, label).toBeLessThanOrEqual(16_000 * cars);
        if (i === 0) {
          // the rig the game moves it with (test/railSupports.test.ts, here for the families' later designs):
          // two or more supports in order, each bogie a top-level node at its pivot at axle height
          const supports = m.rig?.supports ?? [];
          expect(supports.length, label).toBeGreaterThanOrEqual(2);
          expect(supports.map((x) => x.x)).toEqual([...supports.map((x) => x.x)].sort((p, q) => p - q));
          const { json } = parseGlb(glb);
          const nodes = (json.nodes ?? []) as Array<{ name: string; translation?: number[] }>;
          for (const sup of supports) {
            if (!sup.node) { expect(sup.axles, label).toBe(1); continue; }
            const t = nodes.find((n) => n.name === sup.node)?.translation;
            expect(t, `${label} ${sup.node}`).toBeDefined();
            expect(t![0]).toBeCloseTo(sup.x, 3);
            expect(t![1]).toBeGreaterThan(0.25);
            expect(t![1]).toBeLessThan(0.82);
            // a turning bogie stands two or three axles together; a single axle (a railbus, a Talgo car) is one
            expect(sup.axles, label).toBeGreaterThanOrEqual(1);
            expect(sup.axles, label).toBeLessThanOrEqual(3);
          }
          // doors open on a passenger car (a unit's cars, a coach), never on a locomotive
          const opens = m.animations().some((c) => c.drive.drive === "door");
          expect(opens, label).toBe(PASSENGER_GROUPS.has(d.catalog?.group ?? "") && !(d.id === "proc-vehicle-db-ice2"));
          const want = LENGTHS[d.id];
          if (want) expect(Math.abs(s.max[0] - s.min[0] - want), `${d.id} length`).toBeLessThan(0.05 * want);
        }
      });
      const lod = buildLodModel(d);
      // the build refuses a flickering LOD too (generate.ts)
      expect(findCoplanarOverlaps(lod.toGlb(d.id)), `${d.id} LOD`).toEqual([]);
      expect(lod.triangleCount()).toBeGreaterThan(0);
      expect(lod.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    });
});
}
