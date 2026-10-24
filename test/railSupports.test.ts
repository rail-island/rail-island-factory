// Rail supports and turning bogies (MeshCore.bogie, rig.ts RailSupport): every
// rail vehicle tells the game where it rides on the track, and every bogie of two
// or three axles is its own node pivoted at its centre. See docs/models/vehicle-rig.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { ALL_VEHICLES, designGlb, designSource } from "../generator/generate";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { bundleDesign } from "../generator/jsModel";
import { MeshBuilder, ngon } from "../generator/meshBuilder";
import { paramCombinations, resolveParams, type ParamSpec } from "../generator/design";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { TYPE_META as RAIL_TYPES } from "../generator/sets/railType";

const RAIL = ALL_VEHICLES.filter((d) => d.catalog?.category === "Rail vehicles");

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

/** The x of every wheelset in a build: scopes named "wheelset" (their axle, the first sweep). */
function wheelsets(m: MeshBuilder): number[] {
  return leaves(m.sourceTree("x", "x").root)
    .filter((n) => /(^|\/)wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => (n.min![0] + n.max![0]) / 2);
}

type GlbNode = { name: string; translation?: number[]; children?: number[]; mesh?: number };

describe("rail supports", () => {
  it.each(RAIL.map((d) => [d.id] as const))("%s rides on at least two supports, its bogies nodes pivoted between their wheelsets", (id) => {
    const d = RAIL.find((x) => x.id === id)!;
    const m = d.build();
    const rig = m.rig!;
    const supports = rig.supports!;
    expect(supports.length).toBeGreaterThanOrEqual(2);
    expect(supports.map((s) => s.x)).toEqual([...supports.map((s) => s.x)].sort((a, b) => a - b));
    const { json, bin } = parseGlb(designGlb(id));
    const nodes = json.nodes as GlbNode[];
    const roots = new Set((json.scenes![0]!.nodes as number[]));
    for (const s of supports) {
      expect(s.sections.length).toBeGreaterThanOrEqual(1);
      expect(s.sections.length).toBeLessThanOrEqual(2);
      for (const k of s.sections) expect(k).toBeLessThan(rig.sections?.length ?? 1);
      if (!s.node) {
        expect(s.axles).toBe(1);
        continue;
      }
      expect(s.axles).toBeGreaterThanOrEqual(1);
      // a top-level node at the pivot: (x, axle height, 0)
      const i = nodes.findIndex((n) => n.name === s.node);
      expect(roots.has(i)).toBe(true);
      const t = nodes[i]!.translation!;
      expect(t[0]).toBeCloseTo(s.x, 3);
      expect(t[1]).toBeGreaterThan(0.25);
      expect(t[1]).toBeLessThan(0.7);
      expect(t[2]).toBe(0);
      // its own triangles reach either side of the pivot along x
      const own = collectTriangles({ ...json, scenes: [{ nodes: [i] }], scene: 0 }, bin);
      const xs = own.flatMap((tr) => tr.p.map((p) => p[0]));
      expect(Math.min(...xs)).toBeLessThan(s.x);
      expect(Math.max(...xs)).toBeGreaterThan(s.x);
    }
  });

  it("puts a turning bogie under every vehicle whose axles stand two or three together", () => {
    for (const d of RAIL) {
      const m = d.build();
      if (d.catalog?.traction === "steam" || wheelsets(m).length < 4) continue;
      const supports = m.rig!.supports!;
      expect(supports.filter((s) => s.node).length, d.id).toBeGreaterThanOrEqual(2);
      expect(supports.every((s) => s.node && s.axles >= 2 && s.axles <= 3), d.id).toBe(true);
    }
  });

  it("gives a two-axle vehicle and a steam locomotive their outermost wheelsets, no node", () => {
    for (const id of ["proc-vehicle-csd-be31", "proc-vehicle-cd-810", "proc-vehicle-legacy-covered-wagon", "proc-vehicle-csd-498-1"]) {
      const supports = RAIL.find((d) => d.id === id)!.build().rig!.supports!;
      expect(supports, id).toHaveLength(2);
      expect(supports.every((s) => !s.node && s.axles === 1 && s.sections[0] === 0), id).toBe(true);
    }
  });

  it("carries the KT8D5's middle section on the two bogies under its joints", () => {
    const rig = RAIL.find((d) => d.id === "proc-vehicle-tatra-kt8")!.build().rig!;
    const sections = [...rig.supports!].sort((a, b) => b.x - a.x).map((s) => s.sections);
    expect(sections).toEqual([[0], [0, 1], [1, 2], [2]]);
    // the first joint bogie stands at the hinge of the middle section
    const hinge = rig.sections![1]!.pivot[0];
    expect([...rig.supports!].sort((a, b) => b.x - a.x)[1]!.x).toBeCloseTo(hinge, 1);
  });

  it("builds the same bogie nodes in the JS module as in the GLB", async () => {
    const d = RAIL.find((x) => x.id === "proc-vehicle-cd-163")!;
    const mod = (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(await bundleDesign(d, designSource(d.id))).toString("base64")}`)) as { default: (t: typeof THREE) => THREE.Group };
    const group = mod.default(THREE);
    const rig = group.userData.rig as { supports: Array<{ x: number; node?: string }> };
    for (const s of rig.supports) {
      const n = group.getObjectByName(s.node!)!;
      expect(n.parent).toBe(group);
      expect(n.position.x).toBeCloseTo(s.x, 3);
    }
    // the body's meshes stay on the root
    expect(group.children.some((c) => (c as THREE.Mesh).isMesh)).toBe(true);
  });
});

describe("MeshCore.bogie", () => {
  const PALETTE = { steel: { color: "#888888" }, paint: { color: "#aa0000" } };
  const wheelset = (m: MeshBuilder, x: number) => m.scope("wheelset", () => m.sweep("steel", "z", ngon(8, 0.4, 0, x, 0.4), -0.7, ngon(8, 0.4, 0, x, 0.4), 0.7));

  it("takes the bogie's triangles into its own node, pivoted at its axles' mean, and keeps the body as `name`", () => {
    const m = new MeshBuilder(PALETTE);
    m.scope("body", () => m.box("paint", 0, 0, 10, 2, 1, 3));
    m.scope("running gear", () => {
      for (const xc of [-3, 3]) m.scope("bogie", () => m.bogie(() => [-1, 1].forEach((d) => wheelset(m, xc + d))));
    });
    expect(m.rig!.supports).toEqual([
      { x: -3, node: "bogie0", axles: 2, sections: [0] },
      { x: 3, node: "bogie1", axles: 2, sections: [0] },
    ]);
    const { json } = parseGlb(m.toGlb("test", "vehicle"));
    const nodes = json.nodes as GlbNode[];
    expect(nodes.map((n) => n.name)).toEqual(["vehicle", "bogie0", "bogie1"]);
    expect(nodes[1]!.translation![0]).toBeCloseTo(-3, 6);
    expect(nodes[1]!.translation![1]).toBeCloseTo(0.4, 6);
  });

  it("merges a bogie builder drawn inside another into the outer bogie", () => {
    const m = new MeshBuilder(PALETTE);
    m.box("paint", 0, 0, 4, 2, 1, 3);
    m.bogie(() => {
      wheelset(m, -1);
      m.bogie(() => wheelset(m, 1));
    });
    expect(m.rig!.supports).toEqual([{ x: 0, node: "bogie0", axles: 2, sections: [0] }]);
  });

  it("throws for a bogie without a wheelset", () => {
    const m = new MeshBuilder(PALETTE);
    expect(() => m.bogie(() => m.box("paint", 0, 0, 1, 1, 0, 1))).toThrow(/no wheelset/);
  });

  it("leaves a model without wheelsets without supports", () => {
    const m = new MeshBuilder(PALETTE);
    m.box("paint", 0, 0, 1, 1, 0, 1);
    expect(m.rig).toBeNull();
  });

  it("turns a drawing about a vertical line, keeping its faces outward", () => {
    const a = new MeshBuilder(PALETTE);
    a.box("paint", 3, 0.5, 1, 1, 0, 1);
    const b = new MeshBuilder(PALETTE);
    b.turned(1, () => b.box("paint", 3, 0.5, 1, 1, 0, 1));
    const pa = a.positions();
    const pb = b.positions();
    // the box at x = 3, z = 0.5 lands at x = -1, z = -0.5
    const centre = (p: number[], k: number) => p.filter((_, i) => i % 3 === k).reduce((s, v) => s + v, 0) / (p.length / 3);
    expect(centre(pb, 0)).toBeCloseTo(2 * 1 - centre(pa, 0), 6);
    expect(centre(pb, 2)).toBeCloseTo(-centre(pa, 2), 6);
    expect(b.triangleCount()).toBe(a.triangleCount());
  });
});

// The game draws every vehicle at 1.5 studs a metre on the rail type set's track.
// A wheel's tread is everything a vehicle draws at its lowest (y = 0, the running
// surface); each rail head must lie wholly under it, on both sides, or the wheels
// read as standing beside the rails -- which they did while the game's rails were
// 1.8 m apart against these models' 1,435 mm gauge.
describe("wheels on the rail type set's rails", () => {
  const STUDS_PER_M = 1.5;
  it("every rail type shares one rail section", () => {
    const sections = Object.values(RAIL_TYPES).map((t) => JSON.stringify(t.rail));
    expect(new Set(sections).size).toBe(1);
  });
  const rail = Object.values(RAIL_TYPES)[0]!.rail;
  const headIn = (rail.gauge - rail.headWidth) / 2 / STUDS_PER_M;
  const headOut = (rail.gauge + rail.headWidth) / 2 / STUDS_PER_M;
  it.each(RAIL.map((d) => [d.id] as const))("%s runs with both rail heads under its wheel treads", (id) => {
    const { json, bin } = parseGlb(designGlb(id));
    const low = collectTriangles(json, bin).flatMap((t) => t.p).filter((p) => Math.abs(p[1]) < 0.005);
    for (const side of [-1, 1]) {
      const zs = low.filter((p) => p[2] * side > 0).map((p) => Math.abs(p[2]));
      expect(zs.length).toBeGreaterThan(0);
      expect(Math.min(...zs)).toBeLessThanOrEqual(headIn);
      expect(Math.max(...zs)).toBeGreaterThanOrEqual(headOut);
    }
  });
});

describe("conditional parameters", () => {
  const SPECS: ParamSpec[] = [
    { name: "unit", title: "Unit", default: "loco", values: [{ value: "loco", title: "Loco" }, { value: "set", title: "Set" }] },
    { name: "cars", title: "Cars", default: "1", values: [{ value: "1", title: "1" }, { value: "2", title: "2" }], when: { name: "unit", values: ["set"] } },
  ];

  it("resolves and combines a parameter only where it applies", () => {
    expect(resolveParams(SPECS)).toEqual({ unit: "loco" });
    expect(resolveParams(SPECS, { unit: "loco", cars: "2" })).toEqual({ unit: "loco" });
    expect(resolveParams(SPECS, { unit: "set" })).toEqual({ unit: "set", cars: "1" });
    expect(paramCombinations(SPECS)).toEqual([{ unit: "loco" }, { unit: "set", cars: "1" }, { unit: "set", cars: "2" }]);
  });

  it("reads a retired value as its replacement", () => {
    const specs: ParamSpec[] = [{ ...SPECS[0]!, retired: { coach: { unit: "set", cars: "1" } } }, SPECS[1]!];
    expect(resolveParams(specs, { unit: "coach" })).toEqual({ unit: "set", cars: "1" });
    expect(paramCombinations(specs)).toHaveLength(3);
  });
});
