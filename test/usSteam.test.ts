// The North American steam locomotives (generator/usSteam.ts). See docs/models/us-steam.md.
import { describe, expect, it } from "vitest";
import { US_STEAM, usSteamSpec } from "../generator/usSteam";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { coverageCombinations } from "../generator/design";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { buildLoco } from "../generator/steamLoco";
import { parseGlb, readAccessor } from "../generator/glbParse";

type Gltf = {
  nodes: Array<{ name: string; children?: number[]; translation?: number[] }>;
  scenes: Array<{ nodes: number[] }>;
  animations: Array<{ channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ output: number }> }>;
};

/** Every animation track of a GLB by node name and path, and the nodes' rest translations. */
function tracksOf(glb: Uint8Array): { tracks: Map<string, number[]>; nodes: Gltf["nodes"] } {
  const { json, bin } = parseGlb(glb);
  const g = json as unknown as Gltf;
  const a = g.animations[0]!;
  const tracks = new Map(a.channels.map((c) => [`${g.nodes[c.target.node]!.name} ${c.target.path}`, readAccessor(json, bin, a.samplers[c.sampler]!.output)] as const));
  return { tracks, nodes: g.nodes };
}

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

  it("turns the Big Boy's lead truck, both engines and trailing truck on the track: four bogies, each engine's motion in its own", () => {
    const m = US_STEAM[0]!.build();
    // every wheel rides a bogie; the body rests on the two outermost
    const supports = m.rig!.supports!;
    expect(supports.every((s) => s.node)).toBe(true);
    expect(supports.map((s) => s.axles).reverse()).toEqual([2, 4, 4, 2]);
    const g = parseGlb(m.toGlb("t", "vehicle")).json as unknown as Gltf;
    const top = g.scenes[0]!.nodes.map((i) => g.nodes[i]!.name);
    const carried = (node: string) => (g.nodes.find((n) => n.name === node)!.children ?? []).map((i) => g.nodes[i]!.name);
    for (const [node, wheels] of [["bogie0", [1, 2]], ["bogie3", [11, 12]]] as const) {
      expect(top).toContain(node);
      expect(new Set(carried(node))).toEqual(new Set(wheels.map((i) => `wheelset-${i}`)));
    }
    for (const [node, name, wheels] of [["bogie1", "front", [3, 4, 5, 6]], ["bogie2", "rear", [7, 8, 9, 10]]] as const) {
      const c = carried(node);
      expect(new Set(c.filter((n) => n.startsWith("wheelset-")))).toEqual(new Set(wheels.map((i) => `wheelset-${i}`)));
      const rods = new RegExp(`-(right|left)-${name}$`);
      expect(c.filter((n) => !n.startsWith("wheelset-")).sort()).toEqual(g.nodes.filter((n) => rods.test(n.name)).map((n) => n.name).sort());
      expect(c.some((n) => n.startsWith("main-rod-"))).toBe(true);
    }
  });

  it("animates the Big Boy's running gear in its bogies exactly as it would on a rigid frame", () => {
    const spec = usSteamSpec("proc-vehicle-up-big-boy");
    const split = tracksOf(buildLoco(spec).toGlb("t", "vehicle"));
    const rigid = tracksOf(buildLoco(spec, []).toGlb("t", "vehicle"));
    // the bogie a part rides, and its pivot
    const pivotOf = new Map<string, number[]>();
    for (const b of split.nodes.filter((n) => /^bogie\d+$/.test(n.name))) for (const i of b.children ?? []) pivotOf.set(split.nodes[i]!.name, b.translation!);
    expect(pivotOf.size).toBeGreaterThan(12);
    expect([...split.tracks.keys()].sort()).toEqual([...rigid.tracks.keys()].sort());
    for (const [key, values] of split.tracks) {
      const [node, path] = key.split(" ") as [string, string];
      const want = rigid.tracks.get(key)!;
      // a part of a turning unit moves within its bogie: its translation is the rigid one less the bogie's pivot
      const offset = path === "translation" ? pivotOf.get(node) ?? [0, 0, 0] : [0, 0, 0];
      values.forEach((v, i) => expect(v + (path === "translation" ? offset[i % 3]! : 0), `${key} ${i}`).toBeCloseTo(want[i]!, 4));
      // the first sample is the node's rest translation
      if (path === "translation") {
        const rest = split.nodes.find((n) => n.name === node)!.translation ?? [0, 0, 0];
        for (let i = 0; i < 3; i++) expect(values[i]).toBeCloseTo(rest[i]!, 4);
      }
    }
  });

  it("gives Jupiter its balloon stack and No. 119 its straight one", () => {
    const top = (livery: string) => glbStats(US_STEAM[3]!.build({ livery }).toGlb("a")).max[1];
    expect(top("no119")).toBeLessThan(top("jupiter"));
  });
});
