// The world trucks on the world truck kit (generator/worldTrucks.ts, generator/truckKit.ts,
// generator/truckBodies.ts, docs/models/world-trucks.md): each at its real size, standing on
// its wheels and facing +x, in budget, its steered axles and its chain of trailers in the rig,
// its parameters changing what they say; and - for every truck, not only the catalog sweep's
// sample - its steered wheels clear the body at full lock and every trailer swings clear of the
// units ahead at the rig's largest bend (the checks test/rig.test.ts runs on the sampled ones).

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { WORLD_TRUCK_SPECS, WORLD_TRUCKS } from "../generator/worldTrucks";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { SOUND_TABLE } from "../generator/soundTable";
import { proceduralId } from "../generator/modelId";
import { coverageCombinations, type ParamValues } from "../generator/design";
import { lodBudget } from "../generator/lod";
import { LOD_GLASS } from "../generator/lodKit";
import { pose, steerLock, type VehicleRig } from "../generator/rig";
import { truckLength } from "../generator/truckBodies";
import type { MeshBuilder } from "../generator/meshBuilder";
import { intersectingPairs, worldTriangles, type Tri } from "./collision";
import { sample } from "./catalogCache";
import { MeshBuilder as ThreeBuilder } from "../generator/threeBuilder";

const DEG = Math.PI / 180;

function bounds(m: MeshBuilder): { lo: number[]; hi: number[] } {
  const p = m.positions();
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k]!, p[i + k]!); hi[k] = Math.max(hi[k]!, p[i + k]!); }
  return { lo, hi };
}

/** The new triangle cuts between the parts `a` and `b` that posing makes; a triangle `skip` accepts never counts. */
function clashes(m: MeshBuilder, id: string, poses: Array<{ steer?: number; bend?: number[] }>, a: (o: string) => boolean, skip: (t: Tri) => boolean): number[] {
  // the three.js group the JS model builds (threeBuilder.ts toGroup), from the same mesh
  const group = ThreeBuilder.prototype.toGroup.call(m as never, THREE, id) as unknown as THREE.Group;
  const rig = m.rig!;
  const nodes = new Set([...(rig.sections ?? []).map((s) => s.node), ...(rig.steer?.axles ?? []).flatMap((x) => x.nodes), group.name]);
  const split = (all: Array<{ t: Tri; owner: string }>): [Tri[], Tri[]] => [all.filter((x) => a(x.owner)).map((x) => x.t), all.filter((x) => !a(x.owner)).map((x) => x.t)];
  const [ra, rb] = split(worldTriangles(group, nodes));
  const before = intersectingPairs(ra, rb);
  return poses.map((p) => {
    pose(group, p, rig);
    const [pa, pb] = split(worldTriangles(group, nodes));
    const n = [...intersectingPairs(pa, pb)].filter((key) => {
      if (before.has(key)) return false;
      const [i, j] = key.split(":").map(Number);
      return !skip(pa[i!]!) && !skip(pb[j!]!);
    }).length;
    pose(group, {}, rig);
    return n;
  });
}

describe("the world trucks", () => {
  it("are 100 designs in the catalog's trucks, each with its OpenTTD entry", () => {
    expect(WORLD_TRUCKS).toHaveLength(100);
    for (const d of WORLD_TRUCKS) {
      const id = proceduralId(d.id);
      expect(DESIGNS.has(id), id).toBe(true);
      expect(d.catalog).toMatchObject({ category: "Road vehicles", group: "truck" });
      expect(OPENTTD_TABLE[id], id).toBeDefined();
    }
  });

  it("carry the cargo their bodies hold: a tanker oil, a tipper bulk, a log truck wood, a fire engine nothing", () => {
    const of = (id: string) => OPENTTD_TABLE[`proc-vehicle-${id}`]!;
    expect(of("scania-r").variants?.find((v) => v.params.body === "tank")?.cargo).toBe("OIL_");
    expect(of("volvo-fmx-tipper").cargo).toBe("COAL");
    expect(of("kenworth-c500-log").cargo).toBe("WOOD");
    expect(of("dennis-fire-engine").capacity).toBe(0);
    expect(of("kenworth-t909-road-train").variants?.[0]?.capacity ?? 0).toBeGreaterThan(of("kenworth-t909-road-train").capacity ?? 0);
  });

  it("run the Tesla Semi and the fuel cell Xcient on electric motors", () => {
    expect(SOUND_TABLE["proc-vehicle-tesla-semi"]?.sounds?.engine?.id).toMatch(/^electric-engine-/);
    expect(SOUND_TABLE["proc-vehicle-hyundai-xcient"]?.variants?.[0]?.sounds.engine?.id).toMatch(/^electric-engine-/);
  });

  it("are at their real sizes, the mining trucks far over the road's envelope", () => {
    const size = (id: string, p?: ParamValues) => bounds(WORLD_TRUCK_SPECS.find((t) => t.id === id)!.build(p));
    const belaz = size("veh-belaz-75710");
    expect(belaz.hi[0]! - belaz.lo[0]!).toBeCloseTo(20.6, 0);
    expect(belaz.hi[2]! - belaz.lo[2]!).toBeGreaterThan(9.5);
    expect(belaz.hi[1]!).toBeCloseTo(8.2, 0);
    const kei = size("veh-kei-truck");
    expect(kei.hi[0]! - kei.lo[0]!).toBeLessThan(3.5);
    expect(kei.hi[2]! - kei.lo[2]!).toBeLessThan(1.95);
    const rt = WORLD_TRUCK_SPECS.find((t) => t.id === "veh-kenworth-t909-road-train")!;
    expect(truckLength(rt.spec({ load: "3" }))).toBeGreaterThan(45);
    expect(rt.build({ load: "3" }).rig!.sections).toHaveLength(4);
  });

  it("change only the colours with a colour or a livery", () => {
    for (const t of WORLD_TRUCK_SPECS.filter((x) => x.finishParams?.length)) {
      const tris = coverageCombinations(t.params, t.finishParams).map((p) => t.build(p).triangleCount() as number);
      expect(new Set(tris).size, t.id).toBe(1);
    }
  });

  for (const t of WORLD_TRUCK_SPECS) {
    const combos = sample(coverageCombinations(t.params, t.finishParams));
    it.each(combos.map((p) => [JSON.stringify(p), p] as const))(`${t.id} stands on its wheels, faces +x, keeps its rig and its budgets (%s)`, (_n, params) => {
      const spec = t.spec(params);
      const m = t.build(params);
      expect(m.triangleCount()).toBeLessThanOrEqual(10_000);
      const b = bounds(m);
      expect(b.lo[1]).toBeCloseTo(0, 5);
      // as long as its chain; a chute, a plough, a ladder or a boom may reach past it
      expect(b.hi[0]! - b.lo[0]!).toBeGreaterThan(truckLength(spec) - 0.2);
      expect(b.hi[0]! - b.lo[0]!).toBeLessThan(truckLength(spec) + 2.5);
      // the rig: the steered axles, the chain of the truck and its trailers, no bellows
      const rig = m.rig as VehicleRig;
      expect(rig.steer!.axles).toHaveLength(spec.chassis.axles.filter((a) => a.steer).length);
      expect(rig.sections?.length ?? 1).toBe(1 + (spec.trailers?.length ?? 0));
      expect(rig.joints ?? []).toEqual([]);
      // the head lamps at the front, the low detail within its budget, as long, glazed and on the road
      const lod = t.buildLod(params);
      expect(lod.triangleCount()).toBeLessThanOrEqual(lodBudget(DESIGNS.get(proceduralId(t.id))!));
      const lb = bounds(lod);
      expect(lb.lo[1]).toBeCloseTo(0, 5);
      expect(lb.hi[0]! - lb.lo[0]!).toBeGreaterThan(0.95 * truckLength(spec));
      expect((lod as unknown as { groups: Map<string, unknown> }).groups.has(LOD_GLASS)).toBe(true);
      expect(m.lamps()?.materials.lampHead?.role).toBe("head");
    });
  }

  // every truck, its default build: the steered tyres at full lock, each hinge at its largest bend
  it.each(WORLD_TRUCK_SPECS.map((t) => [t.id] as const))("%s: its wheels steer and its trailers swing clear", (id) => {
    const t = WORLD_TRUCK_SPECS.find((x) => x.id === id)!;
    const m = t.build();
    const rig = m.rig!;
    const wheels = new Set(rig.steer!.axles.flatMap((a) => a.nodes));
    const lock = steerLock(rig.steer!);
    // the axle beam's end reaches into the hub: it turns with nothing
    const beam = axleBeam(m);
    const steer = clashes(m, id, [{ steer: lock }, { steer: -lock }], (o) => wheels.has(o), beam);
    expect(steer, "steering lock").toEqual([0, 0]);
    const sections = rig.sections ?? [];
    for (let h = 1; h < sections.length; h++) {
      const [px, , pz] = sections[h]!.pivot;
      const behind = new Set(sections.slice(h).map((s) => s.node));
      const pin = (tr: Tri): boolean => tr.every((p) => Math.hypot(p[0] - px, p[2] - pz) < 0.12);
      const bend = (d: number) => ({ bend: sections.slice(1).map((_, i) => (i + 1 === h ? d * DEG : 0)) });
      const max = rig.maxBendDeg!;
      expect(clashes(m, id, [bend(max), bend(-max), bend(max / 2), bend(-max / 2)], (o) => behind.has(o), pin), `hinge ${h}`).toEqual([0, 0, 0, 0]);
    }
  }, 30_000);
});

/** A triangle of a steered axle's beam, at the wheel's centre (x and y within 12 cm): it turns with nothing. */
function axleBeam(m: MeshBuilder): (tr: Tri) => boolean {
  const rig = m.rig!;
  const centres = (m as unknown as { parts: Array<{ name: string; pivot: [number, number, number] }> }).parts.filter((p) => rig.steer!.axles.some((a) => a.nodes.includes(p.name))).map((p) => p.pivot);
  return (tr) => centres.some((c) => tr.every((p) => Math.abs(p[0] - c[0]) < 0.12 && Math.abs(p[1] - c[1]) < 0.12));
}
