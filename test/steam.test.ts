// The steam locomotives and tenders transferred from vlakosimdb
// (generator/steamLocos.ts) and their running-gear animation
// (generator/steamGear.ts). See docs/models/steam-locomotives.md and
// docs/models/animation.md.

import { describe, expect, it } from "vitest";
import { paramCombinations } from "../generator/design.ts";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { STEAM_CATALOG, STEAM_DESIGNS, STEAM_RAILCAR_CATALOG, STEAM_LOCOS, UNIT_PARAM, steamSpec } from "../generator/steamLocos.ts";
import { N_SAMPLES, RUNNING_CLIP, RUNNING_SPEED, RunningGear, axleHeight, tyreSides } from "../generator/steamGear.ts";
import { STEAM_TRANSFERS, steamComparison, worstPixels } from "../generator/steamComparison.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { glbStats } from "../generator/glbStats.ts";
import { parseGlb, readAccessor } from "../generator/glbParse.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { isLeaf, type TreeNode } from "../generator/sourceTree.ts";

type Gltf = {
  nodes: Array<{ name: string; translation?: number[] }>;
  animations?: Array<{ name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number; interpolation: string }> }>;
};

const COMBOS = STEAM_DESIGNS.flatMap((d) => paramCombinations(d.params).map((p) => ({ d, p, label: `${d.id} ${JSON.stringify(p)}` })));

const walk = (n: TreeNode): TreeNode[] => (isLeaf(n) ? [n] : [n, ...n.children.flatMap(walk)]);

describe("the steam designs", () => {
  it("are registered as rail vehicles with stable ids", () => {
    expect(STEAM_DESIGNS.map((d) => d.id)).toEqual([
      "proc-vehicle-csd-433-0", "proc-vehicle-csd-456-0", "proc-vehicle-csd-475-1", "proc-vehicle-csd-477-0", "proc-vehicle-csd-498-1",
      "proc-vehicle-csd-556-0", "proc-vehicle-csd-636", "proc-vehicle-csd-386", "proc-vehicle-csd-m112",
    ]);
    for (const d of STEAM_DESIGNS) {
      expect(ALL_VEHICLES).toContain(STEAM_LOCOS.find((x) => x.id === d.id));
      const v = STEAM_LOCOS.find((x) => x.id === d.id)!;
      expect(v.catalog).toBe(d.railcar ? STEAM_RAILCAR_CATALOG : STEAM_CATALOG);
      expect(v.catalog?.category).toBe("Rail vehicles");
      expect(v.references).toBe(d.folder);
    }
  });

  it("make every locomotive with a tender one design with a `unit` parameter, the locomotive by default", () => {
    const withTender = STEAM_DESIGNS.filter((d) => d.params?.some((p) => p.name === "unit")).map((d) => d.id);
    expect(withTender).toEqual(["proc-vehicle-csd-475-1", "proc-vehicle-csd-498-1", "proc-vehicle-csd-556-0", "proc-vehicle-csd-636", "proc-vehicle-csd-386"]);
    expect(UNIT_PARAM.default).toBe("locomotive");
    expect(UNIT_PARAM.values.map((v) => v.value)).toEqual(["locomotive", "tender"]);
    for (const id of withTender) {
      const d = STEAM_DESIGNS.find((x) => x.id === id)!;
      const loco = d.build().triangleCount();
      expect(d.build({ unit: "locomotive" }).triangleCount()).toBe(loco);
      const tender = d.build({ unit: "tender" });
      expect(tender.triangleCount()).not.toBe(loco);
      // a tender has no boiler, a locomotive has one
      expect(walk(tender.sourceTree(id, "t").root).some((n) => n.id === "body/boiler")).toBe(false);
      if (id !== "proc-vehicle-csd-386") expect(walk(d.build().sourceTree(id, "l").root).some((n) => n.id === "body/boiler")).toBe(true);
    }
  });

  it.each(COMBOS.map((c) => [c.label, c] as const))("%s stands every wheel on the rail at gauge", (_, { d, p }) => {
    const spec = steamSpec(d.id, p);
    const nodes = walk(d.build(p).sourceTree(d.id, d.title).root);
    spec.gear.wheels.forEach((w, i) => {
      for (const side of ["right", "left"]) {
        const tyre = nodes.find((n) => n.id === `wheelset-${i + 1}/${side}-wheel/tyre`)!;
        expect(tyre.min![1]).toBeCloseTo(0, 3);
        // flat facets at the top and the bottom
        expect(tyre.max![1] - tyre.min![1]).toBeCloseTo(2 * axleHeight(w), 2); // tree extents are rounded to the millimetre
        // the tread's back faces 1.36 m apart, standard back-to-back
        expect(Math.min(Math.abs(tyre.min![2]), Math.abs(tyre.max![2]))).toBeCloseTo(0.68, 3);
      }
    });
  });

  it.each(STEAM_TRANSFERS.map((t) => [t.key] as const))("%s matches its vlakosimdb side view within each landmark's tolerance", (key) => {
    const rows = steamComparison(key);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const r of rows) expect(worstPixels(r), `${key} ${r.id}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it("transfers centre the model between the buffer heads it builds", () => {
    for (const t of STEAM_TRANSFERS) {
      const spec = steamSpec(t.id, t.params);
      expect((spec.heads[0] + spec.heads[1]) / 2, t.key).toBeCloseTo(t.centre, 6);
    }
  });

  it("show their running numbers on the cab sides", () => {
    const numbers = STEAM_DESIGNS.map((d) => steamSpec(d.id).number?.text);
    expect(numbers).toEqual(["433.049", "456.008", "475.179", "477.013", "498.106", "556.0510", "636.001", "386.001", "M 112.001"]);
    for (const d of STEAM_DESIGNS) {
      const plates = walk(d.build().sourceTree(d.id, d.title).root).filter((n) => isLeaf(n) && n.id.startsWith("body/numbers/") && n.material === "plateText");
      expect(plates.length, d.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("the running animation", () => {
  it.each(COMBOS.map((c) => [c.label, c] as const))("%s has one looping clip that turns every wheelset and moves every rod", (_, { d, p }) => {
    const glb = d.build(p).toGlb("t", "vehicle");
    const { json, bin } = parseGlb(glb);
    const g = json as unknown as Gltf;
    expect(g.animations?.map((a) => a.name)).toEqual([RUNNING_CLIP]);
    const a = g.animations![0]!;
    const spec = steamSpec(d.id, p);
    const times = readAccessor(json, bin, a.samplers[0]!.input);
    expect(times.length).toBe(N_SAMPLES + 1);
    const ref = spec.gear.wheels[spec.gear.reference]!;
    expect(times[times.length - 1]).toBeCloseTo((Math.PI * ref.d) / RUNNING_SPEED, 5);
    // every part but the body is animated, and every sampler is linear and shares the times
    const animated = new Set(a.channels.map((c) => g.nodes[c.target.node]!.name));
    expect(g.nodes.map((n) => n.name).filter((n) => !animated.has(n))).toEqual(["body"]);
    for (const s of a.samplers) {
      expect(s.input).toBe(a.samplers[0]!.input);
      expect(s.interpolation).toBe("LINEAR");
    }
    for (const c of a.channels) {
      const v = readAccessor(json, bin, a.samplers[c.sampler]!.output);
      const w = c.target.path === "rotation" ? 4 : 3;
      expect(v.length).toBe(w * times.length);
      // the loop closes: the last sample is the first pose (a quaternion up to its
      // sign); a smaller wheel closes by whole spoke pitches, checked below
      const node = g.nodes[c.target.node]!.name;
      const wheel = /^wheelset-(\d+)$/.exec(node);
      if (wheel && c.target.path === "rotation" && spec.gear.wheels[Number(wheel[1]) - 1]!.d !== ref.d) continue;
      const first = v.slice(0, w);
      const last = v.slice(v.length - w);
      const sign = w === 4 && first.reduce((s2, x, i) => s2 + x * last[i]!, 0) < 0 ? -1 : 1;
      first.forEach((x, i) => expect(sign * last[i]!, `${g.nodes[c.target.node]!.name} ${c.target.path}`).toBeCloseTo(x, 4));
      if (c.target.path === "translation") {
        // the first sample is the node's rest translation (its pivot)
        const rest = g.nodes[c.target.node]!.translation ?? [0, 0, 0];
        first.forEach((x, i) => expect(x).toBeCloseTo(rest[i]!, 4));
      }
    }
    // each wheelset turns once per cycle (a smaller wheel a whole number of spoke pitches more)
    spec.gear.wheels.forEach((w, i) => {
      const ch = a.channels.find((c) => g.nodes[c.target.node]!.name === `wheelset-${i + 1}` && c.target.path === "rotation")!;
      const q = readAccessor(json, bin, a.samplers[ch.sampler]!.output);
      const step = 2 * Math.atan2(q[6]!, q[7]!); // the angle at sample 1
      const turns = (-step * N_SAMPLES) / (2 * Math.PI);
      expect(turns).toBeGreaterThan(0); // rolling forward: clockwise seen from the right
      if (w.d === ref.d) expect(turns).toBeCloseTo(1, 6);
      else {
        expect(Math.abs(turns - ref.d / w.d)).toBeLessThan(0.07); // rolls at the same speed, within rounding
        const k = w.spokes || tyreSides(w);
        expect(turns * k).toBeCloseTo(Math.round(turns * k), 4); // float32 samples
      }
    });
  });

  it.each(COMBOS.filter((c) => steamSpec(c.d.id, c.p).gear.engines.length).map((c) => [c.label, c] as const))("%s keeps its rods' lengths at every sample", (_, { d, p }) => {
    const spec = steamSpec(d.id, p);
    const xc = (spec.heads[0] + spec.heads[1]) / 2;
    const gear = new RunningGear(spec.gear, (x) => xc - x);
    const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
    for (const side of gear.solvedPoses()) {
      for (const [k, pose] of side.poses.entries()) {
        const angle = (2 * Math.PI * k) / N_SAMPLES;
        expect(dist(pose.crank, side.axle)).toBeCloseTo(side.crank, 6);
        expect(dist(pose.crank, pose.crosshead)).toBeCloseTo(side.lengths.mainRod, 6);
        // the crank pin turns with its wheel, clockwise
        const a0 = Math.atan2(side.poses[0]!.crank[1] - side.axle[1], side.poses[0]!.crank[0] - side.axle[0]);
        expect(Math.cos(Math.atan2(pose.crank[1] - side.axle[1], pose.crank[0] - side.axle[0]) - (a0 - angle))).toBeCloseTo(1, 6);
        if (pose.linkFoot) {
          expect(dist(pose.returnCrank!, pose.linkFoot)).toBeCloseTo(side.lengths.eccentricRod, 5);
          expect(dist(pose.die!, pose.leverTop!)).toBeCloseTo(side.lengths.radiusRod, 5);
          expect(dist(pose.leverFoot!, pose.unionPin!)).toBeCloseTo(side.lengths.unionLink, 5);
          // the valve spindle only slides
          expect(pose.spindle![1]).toBeCloseTo(side.poses[0]!.spindle![1], 9);
        }
      }
    }
  });

  it.each(COMBOS.map((c) => [c.label, c] as const))("%s stays free of flicker and on its wheels through the cycle", (_, { d, p }) => {
    const glb = d.build(p).toGlb("t", "vehicle");
    expect(sampleCount(glb)).toBe(N_SAMPLES + 1);
    for (const k of [6, 18, 30, 42]) {
      const posed = poseGlb(glb, k);
      expect(findCoplanarOverlaps(posed), `sample ${k}`).toEqual([]);
      const s = glbStats(posed);
      // a turning polygonal tyre dips by its sagitta at most
      expect(s.min[1]).toBeGreaterThan(-0.012);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
    }
  });

});
