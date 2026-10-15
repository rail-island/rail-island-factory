// The buses from vlakosimdb (generator/buses.ts, karosa.ts, cityBuses.ts): real
// lengths, the steered axle and its wheels, doors on the kerb side, articulated
// sections whose joints seal their gaps, and wheels that fit their arches at lock.

import { describe, expect, it } from "vitest";
import { BUS_DESIGNS } from "../generator/buses";
import { paramCombinations } from "../generator/design";
import { designGlb, designTree } from "../generator/generate";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { KAROSA_LONG, KAROSA_SHORT } from "../generator/karosa";
import { jointTriangles, steerLock } from "../generator/rig";
import { isLeaf, type ScopeNode, type TreeNode } from "../generator/sourceTree";

/** Every node of a tree, depth first. */
function walk(n: TreeNode, out: TreeNode[] = []): TreeNode[] {
  out.push(n);
  if (!isLeaf(n)) for (const c of n.children) walk(c, out);
  return out;
}

/** The real buses' lengths over the body, metres, at the default parameters (assets/<folder>/SOURCES.md). */
const LENGTH: Record<string, number> = {
  "veh-karosa-short": 10.975,
  "veh-karosa-long": 17.355,
  "veh-karosa-renault-citybus-12m": 11.99,
  "veh-karosa-renault-citybus-18m": 17.8,
  "veh-mb-citaro": 11.95,
  "veh-mb-citaro-blue": 11.95,
  "veh-mb-o345-g": 17.94,
  "veh-solaris-urbino-15": 14.59,
  "veh-bus-1": 11.3,
};

const BUSES = BUS_DESIGNS.map((d) => [d.id] as const);

describe("the buses", () => {
  it("are every vlakosimdb bus: the two Karosa families and seven single models", () => {
    expect(BUS_DESIGNS.map((d) => d.id).sort()).toEqual(Object.keys(LENGTH).sort());
    expect(KAROSA_SHORT.map((v) => v.source)).toEqual(["bus_kar_b731", "bus_kar_b732", "bus_kar_c734#1", "bus_kar_lc735#1", "bus_kar_b931", "bus_kar_b931e", "bus_kar_b951e"]);
    expect(KAROSA_LONG.map((v) => v.source)).toEqual(["bus_kar_b741", "bus_kar_b941", "bus_kar_b941e", "bus_kar_b961"]);
    for (const d of BUS_DESIGNS) expect(d.catalog).toMatchObject({ category: "Road vehicles", group: "bus" });
  });

  /** A Karosa variant's length: the 700s', the 900s' (a longer tail) and the 951/961's. */
  const KAROSA: Record<string, number> = {
    b731: 10.975, b732: 10.975, c734: 10.975, lc735: 10.975, b931: 11.345, b931e: 11.345, b951e: 11.32,
    b741: 17.355, b941: 17.615, b941e: 17.615, b961: 17.59,
  };

  it.each(BUSES)("%s is as long as the real bus, bumpers and mirrors aside, in every variant", (id) => {
    const d = BUS_DESIGNS.find((x) => x.id === id)!;
    for (const params of paramCombinations(d.params)) {
      const want = params.variant ? KAROSA[params.variant]! : LENGTH[id]!;
      const tree = d.build(params).sourceTree(id, d.title);
      // the shells alone: every section's body
      const shells = walk(tree.root).filter((n) => !isLeaf(n) && /(^|\/)shell$/.test(n.id));
      const lo = Math.min(...shells.map((n) => n.min![0]));
      const hi = Math.max(...shells.map((n) => n.max![0]));
      expect(hi - lo, JSON.stringify(params)).toBeCloseTo(want, 2);
    }
  });

  it("puts the Karosas' and the City Bus 12M's axles where the real buses have them", () => {
    // front overhang and wheelbases, from the nose (cs.wikipedia)
    const axlesOf = (id: string, params?: Record<string, string>): number[] => {
      const d = BUS_DESIGNS.find((x) => x.id === id)!;
      const nodes = walk(d.build(params).sourceTree(id, d.title).root);
      const shells = nodes.filter((n) => !isLeaf(n) && /(^|\/)shell$/.test(n.id));
      const nose = Math.max(...shells.map((n) => n.max![0]));
      const centres = nodes.filter((n) => !isLeaf(n) && /(^|\/)(front-axle|axle-\d+)$/.test(n.id)).map((n) => (n.min![0] + n.max![0]) / 2);
      return centres.map((c) => Math.round((nose - c) * 1000) / 1000).sort((a, b) => a - b);
    };
    expect(axlesOf("veh-karosa-short", { variant: "b731" })).toEqual([2.29, 7.89]);
    expect(axlesOf("veh-karosa-short", { variant: "b931" })).toEqual([2.355, 7.955]);
    expect(axlesOf("veh-karosa-long", { variant: "b741" })).toEqual([2.29, 7.89, 14.16]);
    expect(axlesOf("veh-karosa-long", { variant: "b961" })).toEqual([2.355, 7.955, 14.225]);
    expect(axlesOf("veh-karosa-renault-citybus-12m")).toEqual([2.71, 8.83]);
  });

  it.each(BUSES)("%s steers its front axle and puts its doors on the kerb (+z) side", (id) => {
    const d = BUS_DESIGNS.find((x) => x.id === id)!;
    for (const params of paramCombinations(d.params)) {
      const m = d.build(params);
      const rig = m.rig!;
      const tree = m.sourceTree(id, d.title);
      const nodes = walk(tree.root);
      expect(rig.steer!.axles.length).toBe(1);
      const [left, right] = rig.steer!.axles[0]!.nodes.map((n) => nodes.find((x) => x.id === n)!);
      // the steered wheels are the frontmost wheels
      const axles = nodes.filter((n) => !isLeaf(n) && /axle/.test(n.id));
      const front = Math.max(...axles.map((n) => (n.min![0] + n.max![0]) / 2));
      expect((left!.min![0] + left!.max![0]) / 2).toBeCloseTo(front, 3);
      expect((right!.min![0] + right!.max![0]) / 2).toBeCloseTo(front, 3);
      // the doors
      const doors = nodes.filter((n) => !isLeaf(n) && /(^|\/)right-doors$/.test(n.id));
      expect(doors.length).toBeGreaterThan(0);
      for (const dn of doors) expect(dn.min![2]).toBeGreaterThan(1);
      expect(nodes.some((n) => /(^|\/)left-doors$/.test(n.id))).toBe(false);
    }
  });

  it.each(BUSES)("%s turns its front tyres inside their arches, up to the lock", (id) => {
    const m = BUS_DESIGNS.find((x) => x.id === id)!.build();
    const steer = m.rig!.steer!;
    const tree = m.sourceTree(id, "x");
    const wheel = walk(tree.root).find((n) => n.id === steer.axles[0]!.nodes[0])! as ScopeNode;
    const r = (wheel.max![1] - wheel.min![1]) / 2;
    const w = wheel.max![2] - wheel.min![2];
    // the inner wheel turns furthest; the tyre's length along x at that angle
    const lock = (steer.maxAngleDeg * Math.PI) / 180;
    expect(steerLock(steer)).toBeLessThan(lock);
    let worst = 0;
    for (let a = 0; a <= lock + 1e-9; a += lock / 20) worst = Math.max(worst, r * Math.cos(a) + (w / 2) * Math.sin(a));
    // the shell's notch over the front axle: as long as the arch the wheel sits in
    const shell = walk(tree.root).filter((n) => isLeaf(n) && n.material === "under" && /shell/.test(n.id));
    const x = (wheel.min![0] + wheel.max![0]) / 2;
    const archHalf = Math.max(...shell.filter((n) => Math.abs((n.min![0] + n.max![0]) / 2 - x) < 1).map((n) => Math.max(Math.abs(n.min![0] - x), Math.abs(n.max![0] - x))));
    expect(worst).toBeLessThan(archHalf);
  });

  it.each(BUSES)("%s fits the road and the budget in every variant", (id) => {
    const d = BUS_DESIGNS.find((x) => x.id === id)!;
    for (const params of paramCombinations(d.params)) {
      const s = glbStats(d.build(params).toGlb("t", "vehicle"));
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(2.7);
      expect(s.max[1]).toBeLessThanOrEqual(3.45); // roof equipment included
      expect(s.triangles).toBeLessThanOrEqual(10_000);
    }
  });
});

describe("the articulated buses", () => {
  const ARTICULATED = BUS_DESIGNS.filter((d) => d.build().rig!.sections).map((d) => [d.id] as const);

  it("are the Karosa long, the City Bus 18M and the O 345 G", () => {
    expect(ARTICULATED.map(([id]) => id)).toEqual(["veh-karosa-long", "veh-karosa-renault-citybus-18m", "veh-mb-o345-g"]);
  });

  it.each(ARTICULATED)("%s: one joint per gap, hinged in its middle, its faces on the sections' ends", (id) => {
    const rig = BUS_DESIGNS.find((d) => d.id === id)!.build().rig!;
    const sections = rig.sections!;
    expect(rig.joints!.length).toBe(sections.length - 1);
    const tree = designTree(id);
    const byId = new Map(walk(tree.root).map((n) => [n.id, n]));
    rig.joints!.forEach((j, i) => {
      const front = byId.get(`${sections[i]!.node}/shell`)!;
      const rear = byId.get(`${sections[i + 1]!.node}/shell`)!;
      // (a tree's extents are rounded to the millimetre)
      expect(j.front).toBeCloseTo(front.min![0], 2);
      expect(j.rear).toBeCloseTo(rear.max![0], 2);
      expect(sections[i + 1]!.pivot[0]).toBeCloseTo((j.front + j.rear) / 2, 6);
      expect(sections[i + 1]!.pivot[2]).toBe(0);
      // the GLB's joint is the renderer's rest pose, and it spans the gap
      const node = byId.get(j.node)!;
      expect(node.min![0]).toBeCloseTo(j.rear, 3);
      expect(node.max![0]).toBeCloseTo(j.front, 3);
      expect(jointTriangles(j, sections).length / 3).toBe(node.triangles);
    });
  });

  it.each(ARTICULATED)("%s: the GLB has a node per section and joint, and the joint is its own mesh", (id) => {
    const { json, bin } = parseGlb(designGlb(id));
    const names = (json.nodes as Array<{ name: string }>).map((n) => n.name);
    const rig = BUS_DESIGNS.find((d) => d.id === id)!.build().rig!;
    for (const s of rig.sections!) expect(names).toContain(s.node);
    for (const j of rig.joints!) expect(names).toContain(j.node);
    expect(collectTriangles(json, bin).filter((t) => t.material === "bellows").length).toBeGreaterThan(0);
  });
});

describe("the shell", () => {
  it("refuses an outline that is not convex", async () => {
    const { MeshBuilder } = await import("../generator/meshBuilder");
    const { drawShell } = await import("../generator/busBody");
    const m = new MeshBuilder({ body: { color: "#ffffff" }, under: { color: "#000000" } });
    const shell = {
      section: [[-1, 0.3], [1, 0.3], [1, 2], [-1, 2]] as Array<[number, number]>,
      side: [[0, 0.3], [5, 0.3], [5, 2], [0, 2]] as Array<[number, number]>,
      plan: [[0, -1], [5, -1], [5, 1], [0, 1]] as Array<[number, number]>,
      base: "body", paint: [], arches: [], under: "under",
    };
    expect(() => m.scope("ok", () => drawShell(m, shell))).not.toThrow();
    // a crossed plan (two corners swapped), as a mis-ordered corner list would make
    expect(() => m.scope("bad", () => drawShell(m, { ...shell, plan: [[0, -1], [5, 1], [5, -1], [0, 1]] }))).toThrow(/not convex/);
  });
});
