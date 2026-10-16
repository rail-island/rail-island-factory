import { proceduralId } from "../generator/modelId.ts";
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
import type { MeshBuilder } from "../generator/meshBuilder";
import { insideSeen, type Tri, type V3 } from "./collision";

/** Every node of a tree, depth first. */
function walk(n: TreeNode, out: TreeNode[] = []): TreeNode[] {
  out.push(n);
  if (!isLeaf(n)) for (const c of n.children) walk(c, out);
  return out;
}

/** The real buses' lengths over the body, metres, at the default parameters (assets/<folder>/SOURCES.md). */
const LENGTH: Record<string, number> = {
  "proc-vehicle-karosa-short": 10.975,
  "proc-vehicle-karosa-long": 17.355,
  "proc-vehicle-karosa-renault-citybus-12m": 11.99,
  "proc-vehicle-karosa-renault-citybus-18m": 17.8,
  "proc-vehicle-mb-citaro": 11.95,
  "proc-vehicle-mb-citaro-blue": 11.95,
  "proc-vehicle-mb-o345-g": 17.94,
  "proc-vehicle-solaris-urbino-15": 14.59,
  "proc-vehicle-bus-1": 11.3,
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

  it("puts the axles where the real buses have them", () => {
    // front overhang and wheelbases, from the nose (assets/<folder>/SOURCES.md)
    const axlesOf = (id: string, params?: Record<string, string>): number[] => {
      const d = BUS_DESIGNS.find((x) => x.id === id)!;
      const nodes = walk(d.build(params).sourceTree(id, d.title).root);
      const shells = nodes.filter((n) => !isLeaf(n) && /(^|\/)shell$/.test(n.id));
      const nose = Math.max(...shells.map((n) => n.max![0]));
      const centres = nodes.filter((n) => !isLeaf(n) && /(^|\/)(front-axle|axle-\d+)$/.test(n.id)).map((n) => (n.min![0] + n.max![0]) / 2);
      return centres.map((c) => Math.round((nose - c) * 1000) / 1000).sort((a, b) => a - b);
    };
    expect(axlesOf("proc-vehicle-karosa-short", { variant: "b731" })).toEqual([2.29, 7.89]);
    expect(axlesOf("proc-vehicle-karosa-short", { variant: "b931" })).toEqual([2.355, 7.955]);
    expect(axlesOf("proc-vehicle-karosa-long", { variant: "b741" })).toEqual([2.29, 7.89, 14.16]);
    expect(axlesOf("proc-vehicle-karosa-long", { variant: "b961" })).toEqual([2.355, 7.955, 14.225]);
    expect(axlesOf("proc-vehicle-karosa-renault-citybus-12m")).toEqual([2.71, 8.83]);
    expect(axlesOf("proc-vehicle-karosa-renault-citybus-18m")).toEqual([2.71, 8.065, 14.64]);
    expect(axlesOf("proc-vehicle-mb-citaro")).toEqual([2.75, 8.595]);
    expect(axlesOf("proc-vehicle-mb-o345-g")).toEqual([2.69, 8.415, 14.83]);
    expect(axlesOf("proc-vehicle-solaris-urbino-15")).toEqual([2.7, 9.5, 11.19]);
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
    expect(ARTICULATED.map(([id]) => id)).toEqual(["proc-vehicle-karosa-long", "proc-vehicle-karosa-renault-citybus-18m", "proc-vehicle-mb-o345-g"]);
  });

  it.each(ARTICULATED)("%s: one joint per gap, hinged in its middle, its faces on the sections' ends", (id) => {
    const rig = BUS_DESIGNS.find((d) => d.id === id)!.build().rig!;
    const sections = rig.sections!;
    expect(rig.joints!.length).toBe(sections.length - 1);
    const tree = designTree(proceduralId(id));
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
    const { json, bin } = parseGlb(designGlb(proceduralId(id)));
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

/** A built bus's triangles in world space, with their material and the source-tree leaf they come from. */
function trianglesOf(m: MeshBuilder): Array<{ p: Tri; material: string; leaf: string }> {
  const tree = m.sourceTree("bus", "bus");
  const { json, bin } = parseGlb(m.toGlb("test", "vehicle"));
  const byMat = new Map<string, Tri[]>();
  for (const t of collectTriangles(json, bin)) {
    if (!byMat.has(t.material)) byMat.set(t.material, []);
    byMat.get(t.material)!.push(t.p as Tri);
  }
  return walk(tree.root).filter(isLeaf).flatMap((leaf) =>
    byMat.get(leaf.material)!.slice(leaf.tri[0], leaf.tri[0] + leaf.tri[1]).map((p) => ({ p, material: leaf.material, leaf: leaf.id })),
  );
}

/** The first triangle a ray from `origin` along `dir` meets, or undefined. */
function firstHit<T extends { p: Tri }>(tris: readonly T[], origin: V3, dir: V3): T | undefined {
  let best = Infinity;
  let hit: T | undefined;
  for (const t of tris) {
    const [p0, p1, p2] = t.p;
    const e1: V3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2: V3 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const h: V3 = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
    const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(det) < 1e-12) continue;
    const sv: V3 = [origin[0] - p0[0], origin[1] - p0[1], origin[2] - p0[2]];
    const u = (sv[0] * h[0] + sv[1] * h[1] + sv[2] * h[2]) / det;
    if (u < 0 || u > 1) continue;
    const q: V3 = [sv[1] * e1[2] - sv[2] * e1[1], sv[2] * e1[0] - sv[0] * e1[2], sv[0] * e1[1] - sv[1] * e1[0]];
    const v = (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]) / det;
    if (v < 0 || u + v > 1) continue;
    const t2 = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
    if (t2 > 0 && t2 < best) {
      best = t2;
      hit = t;
    }
  }
  return hit;
}

/** Whether `p` is inside the closed triangles `tris` (an odd number of crossings straight up, nudged off any edge). */
function inside(tris: readonly { p: Tri }[], p: V3): boolean {
  let n = 0;
  const dir: V3 = [0.0013, 1, 0.0009];
  let from = p;
  for (let k = 0; k < 64; k++) {
    const hit = firstHit(tris, from, dir);
    if (!hit) break;
    n++;
    // step just past this face
    const ys = hit.p.map((q) => q[1]);
    const [a, b, c] = hit.p;
    const nrm: V3 = [
      (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
      (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
    ];
    const t = ((a[0] - from[0]) * nrm[0] + (a[1] - from[1]) * nrm[1] + (a[2] - from[2]) * nrm[2]) / (dir[0] * nrm[0] + dir[1] * nrm[1] + dir[2] * nrm[2]);
    from = [from[0] + dir[0] * (t + 1e-5), from[1] + dir[1] * (t + 1e-5), from[2] + dir[2] * (t + 1e-5)];
    void ys;
  }
  return n % 2 === 1;
}

/** Every bus and Karosa variant, built. */
const BUILDS = BUS_DESIGNS.flatMap((d) => paramCombinations(d.params).map((params) => ({ id: d.id, params, label: params.variant ? `${d.id} ${params.variant}` : d.id, m: () => d.build(params) })));

describe("the bus bodies", () => {
  // three.js culls back faces: a ray from outside whose first face looks away has
  // come in through a gap, which shows as a see-through slit (the arch feet's were)
  it.each(BUS_DESIGNS.map((d) => [d.id] as const))("%s has no holes: no ray from outside meets the inside of a face", (id) => {
    const tris = trianglesOf(BUS_DESIGNS.find((d) => d.id === id)!.build()).map((t) => t.p);
    for (const dir of [[0, 0.4, 1], [0, 0.4, -1], [0.6, 0.4, 1], [-0.6, 0.4, -1], [0.6, 0.6, -1], [-0.6, 0.6, 1], [0, -0.3, 1], [0, 1, 0.2]] as V3[]) {
      const seen = insideSeen(tris, dir, 0.03);
      expect(seen.length, `along ${dir.join(",")}: ${seen.slice(0, 3).map((p) => p.map((v) => v.toFixed(2)).join(",")).join("; ")}`).toBe(0);
    }
  }, 60_000);

  it.each(BUILDS.map((b) => [b.label, b] as const))("%s hangs each mirror on an arm that reaches into the body", (_, b) => {
    const tris = trianglesOf(b.m());
    const shell = tris.filter((t) => /(^|\/)shell\//.test(t.leaf));
    const mirrors = tris.filter((t) => /(^|\/)mirrors\//.test(t.leaf));
    for (const s of [1, -1]) {
      // the mirror's pieces on this side, joined into one by touching boxes
      const leaves = [...new Set(mirrors.filter((t) => t.p[0][2] * s > 0).map((t) => t.leaf))];
      const box = (leaf: string): { lo: V3; hi: V3 } => {
        const ps = mirrors.filter((t) => t.leaf === leaf).flatMap((t) => t.p);
        return { lo: [0, 1, 2].map((k) => Math.min(...ps.map((p) => p[k]!))) as V3, hi: [0, 1, 2].map((k) => Math.max(...ps.map((p) => p[k]!))) as V3 };
      };
      const boxes = leaves.map(box);
      const joined = new Set([0]);
      for (let grew = true; grew; ) {
        grew = false;
        boxes.forEach((bx, i) => {
          if (joined.has(i)) return;
          if ([...joined].some((j) => [0, 1, 2].every((k) => bx.lo[k]! <= boxes[j]!.hi[k]! + 1e-6 && boxes[j]!.lo[k]! <= bx.hi[k]! + 1e-6))) {
            joined.add(i);
            grew = true;
          }
        });
      }
      expect(joined.size, `side ${s}: ${leaves.join(", ")}`).toBe(leaves.length);
      // and some corner of it is inside the body
      expect(boxes.flatMap((bx) => [bx.lo, bx.hi, [bx.lo[0], bx.hi[1], bx.lo[2]] as V3, [bx.lo[0], bx.lo[1], bx.hi[2]] as V3]).some((p) => inside(shell, p)), `side ${s}`).toBe(true);
    }
  }, 30_000);

  it.each(BUILDS.map((b) => [b.label, b] as const))("%s has double doors (the LC 735's rear one single)", (label, b) => {
    const tree = b.m().sourceTree(b.id, b.label);
    // the leaves: tall, thin and not glass; a door's leaves stand 2 cm apart, doors further
    const leaves = walk(tree.root)
      .filter((n): n is ScopeNode => !isLeaf(n) && /(^|\/)right-doors(-\d+)?$/.test(n.id))
      .flatMap((d) => walk(d).filter(isLeaf))
      .filter((l) => l.material !== "glass" && l.max![1] - l.min![1] > 1.8 && l.max![2] - l.min![2] < 0.02)
      .sort((a, c) => c.max![0] - a.max![0]);
    const doors: number[] = [];
    leaves.forEach((l, i) => {
      if (i > 0 && leaves[i - 1]!.min![0] - l.max![0] < 0.1) doors[doors.length - 1]!++;
      else doors.push(1);
    });
    const want = doors.map((_, i) => (label.endsWith("lc735") && i === doors.length - 1 ? 1 : 2));
    expect(doors.length).toBeGreaterThan(0);
    expect(doors).toEqual(want);
  });

  // through the gap between each tyre's top and its arch's crown a ray from the side
  // meets only wheels, the crown and the underside -- no paint or fitting laid over
  // the opening (Bus 1's sweep, fan-drawn from a concave outline, once covered one)
  it.each(BUS_DESIGNS.map((d) => [d.id] as const))("%s leaves its wheel arches open", (id) => {
    const tris = trianglesOf(BUS_DESIGNS.find((d) => d.id === id)!.build());
    const tyres = tris.filter((t) => t.material === "rubber");
    const nodes = walk(BUS_DESIGNS.find((d) => d.id === id)!.build().sourceTree(id, "x").root);
    const axles = nodes.filter((n) => !isLeaf(n) && /(^|\/)(front-axle|axle-\d+)$/.test(n.id)).map((n) => (n.min![0] + n.max![0]) / 2);
    expect(axles.length).toBeGreaterThan(1);
    for (const x of axles) {
      const top = Math.max(...tyres.flatMap((t) => t.p).filter((p) => Math.abs(p[0] - x) < 0.3).map((p) => p[1]));
      for (const [z, dz] of [[30, -1], [-30, 1]] as const) {
        const hit = firstHit(tris, [x, top + 0.02, z], [0, 0, dz]);
        expect(["rubber", "rim", "hub", "under", undefined], `axle at ${x.toFixed(2)}, from ${z > 0 ? "+" : "-"}z: ${hit?.leaf}`).toContain(hit?.material);
      }
    }
  });

  it("lays its slabs across the shell's corners without sinking: a Karosa door's surround, the O 345 G's and Bus 1's plates", () => {
    const karosa = trianglesOf(BUS_DESIGNS.find((d) => d.id === "proc-vehicle-karosa-short")!.build({ variant: "b731" }));
    const door = karosa.filter((t) => /right-doors/.test(t.leaf)).flatMap((t) => t.p);
    const x0 = Math.min(...door.map((p) => p[0]));
    // the surround's strip beside the leaves, at every height across the belt corner
    for (const y of [0.6, 1.2, 1.45, 1.55, 2.0, 2.5]) expect(firstHit(karosa, [x0 + 0.015, y, 5], [0, 0, -1])?.material, `y ${y}`).toBe("frame");
    for (const [id, end, y] of [["proc-vehicle-mb-o345-g", 1, 0.51], ["proc-vehicle-bus-1", 1, 0.48], ["proc-vehicle-bus-1", -1, 0.63]] as const) {
      const tris = trianglesOf(BUS_DESIGNS.find((d) => d.id === id)!.build());
      expect(firstHit(tris, [end * 30, y, 0.1], [-end, 0, 0])?.material, `${id} ${end}`).toBe("plate");
    }
  });

  it("paints what the native files show: grilles behind the last door, the B 931's grey bumpers, the B 941 E's grey roof, the Citaro's and Bus 1's tails", () => {
    for (const b of BUILDS.filter((x) => x.id === "proc-vehicle-karosa-short" || x.id === "proc-vehicle-karosa-long")) {
      const nodes = walk(b.m().sourceTree(b.id, b.label).root);
      const grille = nodes.find((n) => /(^|\/)engine-grille$/.test(n.id))!;
      const doors = nodes.filter((n) => !isLeaf(n) && /(^|\/)right-doors(-\d+)?$/.test(n.id));
      expect(grille.max![0], b.label).toBeLessThan(Math.min(...doors.map((d) => d.min![0])));
      const mats = new Set(walk(b.m().sourceTree(b.id, b.label).root).filter(isLeaf).map((l) => l.material));
      expect(mats.has("bumperGrey"), b.label).toBe(b.params.variant === "b931");
      expect(mats.has("roofGrey"), b.label).toBe(b.params.variant === "b941e");
    }
    const citaro = trianglesOf(BUS_DESIGNS.find((d) => d.id === "proc-vehicle-mb-citaro")!.build());
    expect(firstHit(citaro, [-30, 0.85, 0.3], [1, 0, 0])?.material).toBe("body");
    expect(firstHit(citaro, [-30, 2.55, 0.9], [1, 0, 0])?.material).toBe("body");
    const bus1 = trianglesOf(BUS_DESIGNS.find((d) => d.id === "proc-vehicle-bus-1")!.build());
    expect(firstHit(bus1, [-30, 2.2, 0.3], [1, 0, 0])?.material).toBe("mint");
  });
});
