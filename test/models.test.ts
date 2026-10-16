// The procedurally authored models (generator/): the mesh builder's winding, each
// design's shape and budget, and the generator's output on disk.

import { describe, expect, it } from "vitest";
import { generateInSubprocess } from "./generateSubprocess";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MeshBuilder, ngon, rect } from "../generator/meshBuilder";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { VEHICLES } from "../generator/vehicles";
import { STEAM_LOCOS } from "../generator/steamLocos";
import { ALL_VEHICLES, BUILDINGS, DESIGNS, ZFightingError, designGlb, designTree, generateModels } from "../generator/generate";
import { VILLAGE_HOUSES } from "../generator/village";
import { isLeaf, type LeafNode, type ScopeNode, type TreeNode } from "../generator/sourceTree";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";

/** Every triangle of a GLB with its face normal (from the winding) and centroid. */
function faces(glb: Uint8Array): Array<{ n: [number, number, number]; c: [number, number, number] }> {
  const { json, bin } = parseGlb(glb);
  return collectTriangles(json, bin).map((t) => {
    const [a, b, c] = t.p;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: [number, number, number] = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    return { n, c: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3] };
  });
}

describe("MeshBuilder", () => {
  // three.js draws front faces only, so a wall wound the wrong way round is
  // invisible in the game and in the site's viewer -- while the offline
  // thumbnail, which does not cull, still looks right.
  it("winds a box's faces outward", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    m.box("a", 3, -2, 4, 6, 1, 9);
    const centre = [3, 5, -2];
    const tris = faces(m.toGlb("test"));
    expect(tris.length).toBe(10); // four walls and a top
    for (const { n, c } of tris) {
      const out = n[0] * (c[0] - centre[0]) + n[1] * (c[1] - centre[1]) + n[2] * (c[2] - centre[2]);
      expect(out).toBeGreaterThan(0);
    }
  });

  it("winds a frustum and a spire outward and up", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    m.loft("a", ngon(8, 5), 0, ngon(8, 3), 4);
    m.spire("a", rect(3, 3), 4, 10);
    for (const { n, c } of faces(m.toGlb("test"))) {
      const radial = n[0] * c[0] + n[2] * c[2];
      if (Math.abs(n[1]) > 1e-6 && Math.hypot(n[0], n[2]) < 1e-6) expect(n[1]).toBeGreaterThan(0); // the cap
      else expect(radial).toBeGreaterThan(0);
    }
  });

  // A sweep turns the loft on its side, so its winding is the easiest to get
  // wrong -- and a section may come in either winding.
  it.each([["x"], ["z"]] as const)("winds a sweep along %s outward, end caps included, whichever way its section winds", (axis) => {
    for (const reversed of [false, true]) {
      const m = new MeshBuilder({ a: { color: "#808080" } });
      const section = ngon(6, 1, 0, 2, 3);
      const s = reversed ? [...section].reverse() : section;
      m.sweep("a", axis, s, 5, s, 1); // a1 < a0 is fine too
      const centre = axis === "x" ? [3, 3, 2] : [2, 3, 3];
      const tris = faces(m.toGlb("test"));
      expect(tris.length).toBe(6 * 2 + 2 * 4); // six walls and two hexagonal caps
      for (const { n, c } of tris) {
        const out = n[0] * (c[0] - centre[0]) + n[1] * (c[1] - centre[1]) + n[2] * (c[2] - centre[2]);
        expect(out).toBeGreaterThan(0);
      }
    }
  });

  // A slab is laid on a slanted face: its outline may come in either winding and
  // its depth in any direction, and every face must still look out.
  it("winds a slab outward, whichever way its outline winds and its depth points", () => {
    const outline: Array<[number, number, number]> = [[0, 0, 0], [2, 0, 0.5], [2, 1, 0.5], [1, 1.5, 0.25], [0, 1, 0]];
    for (const reversed of [false, true]) {
      for (const depth of [[0.1, 0, -0.4], [-0.1, 0, 0.4]] as Array<[number, number, number]>) {
        const m = new MeshBuilder({ a: { color: "#808080" } });
        m.slab("a", reversed ? [...outline].reverse() : outline, depth);
        const tris = faces(m.toGlb("test"));
        expect(tris.length).toBe(2 * 3 + 5 * 2); // two pentagons and five walls
        const centre = [1 + depth[0] / 2, 0.7 + depth[1] / 2, 0.25 + depth[2] / 2];
        for (const { n, c } of tris) {
          expect(n[0] * (c[0] - centre[0]) + n[1] * (c[1] - centre[1]) + n[2] * (c[2] - centre[2])).toBeGreaterThan(0);
        }
      }
    }
  });

  it("turns every facet of a decal to face along its normal", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    m.facets("a", [[0, 0, 1], [1, 0, 1], [0, 1, 1], [0, 0, 1], [0, 1, 1], [-1, 0, 1]], [0, 0, -1]);
    const tris = faces(m.toGlb("test"));
    expect(tris.length).toBe(2);
    for (const { n } of tris) expect(n[2]).toBeLessThan(0);
  });

  it("writes a node per part, translated to its pivot, its positions local to it", () => {
    const m = new MeshBuilder({ a: { color: "#808080" }, b: { color: "#404040" } });
    m.part("front", [0, 0, 0], () => m.box("a", 0, 0, 2, 2, 0, 1));
    m.part("back", [-3, 1, 0], () => {
      m.box("a", -3, 0, 2, 2, 1, 2);
      m.box("b", -3, 0, 1, 1, 2, 3);
    });
    const glb = m.toGlb("test");
    const { json, bin } = parseGlb(glb);
    const j = json as { nodes: Array<{ name: string; mesh: number; translation: number[] }>; meshes: Array<{ primitives: unknown[] }> };
    expect(j.nodes.map((n) => [n.name, n.translation])).toEqual([["front", [0, 0, 0]], ["back", [-3, 1, 0]]]);
    expect(j.meshes.map((x) => x.primitives.length)).toEqual([1, 2]);
    // world positions are what was drawn
    const back = collectTriangles(json, bin).filter((t) => t.material === "b");
    expect(Math.min(...back.flatMap((t) => t.p.map((p) => p[1])))).toBeCloseTo(2);
    expect(glbStats(glb).max[1]).toBeCloseTo(3);
    // a part is a scope of the tree, and a material's ranges run across parts
    const tree = m.sourceTree("x", "X");
    expect(tree.root.children.map((c) => c.id)).toEqual(["front", "back"]);
    expect((((tree.root.children[1] as ScopeNode).children[0]) as LeafNode).tri).toEqual([10, 10]);
  });

  it("refuses a part inside a scope, a part drawn twice, and a triangle outside any part", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    expect(() => m.scope("s", () => m.part("p", [0, 0, 0], () => {}))).toThrow(/top level/);
    m.part("p", [0, 0, 0], () => m.box("a", 0, 0, 1, 1, 0, 1));
    expect(() => m.part("p", [0, 0, 0], () => {})).toThrow(/twice/);
    m.box("a", 5, 0, 1, 1, 0, 1);
    expect(() => m.toGlb("test")).toThrow(/outside any part/);
  });

  it("refuses a material missing from its palette", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    expect(() => m.box("b", 0, 0, 1, 1, 0, 1)).toThrow(/unknown material/);
  });
});

/** Every node of a tree, depth first. */
function walk(n: TreeNode, out: TreeNode[] = []): TreeNode[] {
  out.push(n);
  if (!isLeaf(n)) for (const c of n.children) walk(c, out);
  return out;
}

describe("MeshBuilder's source tree", () => {
  const palette = { a: { color: "#808080" }, b: { color: "#404040" } };

  it("records the outermost primitive call as a leaf, with its triangle range in its material", () => {
    const m = new MeshBuilder(palette);
    m.scope("base", () => {
      m.box("a", 0, 0, 4, 4, 0, 2);
      m.prism("b", ngon(6, 1), 2, 3);
      m.box("a", 0, 0, 2, 2, 2, 5, 0, false);
    });
    const t = m.sourceTree("sky-test", "Test");
    expect(t.materials).toEqual(["a", "b"]);
    expect(t.colors).toEqual(["#808080", "#404040"]);
    expect(t.triangles).toBe(m.triangleCount());
    const base = t.root.children[0] as ScopeNode;
    expect(base.id).toBe("base");
    // a box draws through prism, loft, quad, tri and cap -- still one leaf
    expect(base.children.map((c) => [c.id, (c as LeafNode).kind, (c as LeafNode).tri])).toEqual([
      ["base/box-1", "box", [0, 10]],
      ["base/prism-1", "prism", [0, 16]],
      ["base/box-2", "box", [10, 8]],
    ]);
    expect((base.children[0] as LeafNode).args).toEqual({ cx: 0, cz: 0, w: 4, d: 4, y0: 0, y1: 2, ry: 0, top: true });
    expect((base.children[1] as LeafNode).args).toEqual({ ring: 6, y0: 2, y1: 3, top: true });
    expect(base.triangles).toBe(34);
    expect(base.min).toEqual([-2, 0, -2]);
    expect(base.max).toEqual([2, 5, 2]);
  });

  it("makes sibling ids unique, nests paths and drops empty scopes", () => {
    const m = new MeshBuilder(palette);
    m.scope("Tier 1", () => m.scope("piers", () => m.box("a", 0, 0, 1, 1, 0, 1)));
    m.scope("tier 1", () => m.box("a", 0, 0, 1, 1, 1, 2));
    m.scope("nothing", () => {});
    const ids = walk(m.sourceTree("x", "X").root).map((n) => n.id);
    expect(ids).toEqual(["", "tier-1", "tier-1/piers", "tier-1/piers/box-1", "tier-1-2", "tier-1-2/box-1"]);
  });

  it("keeps a call whose every triangle was degenerate, with an empty range", () => {
    const m = new MeshBuilder(palette);
    m.scope("flat", () => m.tri("a", [0, 0, 0], [1, 0, 0], [2, 0, 0]));
    const leaf = (m.sourceTree("x", "X").root.children[0] as ScopeNode).children[0] as LeafNode;
    expect(leaf.tri).toEqual([0, 0]);
    expect(leaf.triangles).toBe(0);
    expect(leaf.min).toBeUndefined();
  });

  it("does not change the GLB", () => {
    const plain = new MeshBuilder(palette);
    plain.box("a", 0, 0, 4, 4, 0, 2);
    plain.spire("b", ngon(5, 2), 2, 6);
    const scoped = new MeshBuilder(palette);
    scoped.scope("one", () => scoped.box("a", 0, 0, 4, 4, 0, 2));
    scoped.scope("two", () => scoped.scope("deeper", () => scoped.spire("b", ngon(5, 2), 2, 6)));
    expect(Buffer.from(scoped.toGlb("t")).equals(Buffer.from(plain.toGlb("t")))).toBe(true);
  });
});

describe("findCoplanarOverlaps", () => {
  const palette = { a: { color: "#ff0000" }, b: { color: "#0000ff" } };

  it("finds two materials' roofs at one height, and only where they overlap", () => {
    const m = new MeshBuilder(palette);
    m.box("a", 0, 0, 10, 10, 0, 5);
    m.box("b", 4, 0, 4, 4, 2, 5); // pokes out of the side, roof flush with a's
    const found = findCoplanarOverlaps(m.toGlb("test"));
    expect(found.length).toBe(1);
    expect(found[0]!.normal[1]).toBeCloseTo(1);
    expect(found[0]!.offset).toBeCloseTo(5);
    expect(found[0]!.area).toBeCloseTo(12); // x 2..5 inside a, z -2..2
  });

  it("ignores faces that only touch, face away from each other or share a material", () => {
    const m = new MeshBuilder(palette);
    m.box("a", 0, 0, 2, 2, 0, 2);
    m.box("b", 2, 0, 2, 2, 0, 2); // walls touching back to back
    m.box("b", 10, 0, 2, 2, 0, 2);
    m.box("b", 10, 0, 2, 2, 0, 2); // same material on top of itself
    m.box("b", 0, 0, 2, 2, 2, 3); // sits on a's roof: b has no bottom cap
    expect(findCoplanarOverlaps(m.toGlb("test"))).toEqual([]);
  });

  it("finds a wall face shared by two materials, not only roofs", () => {
    const m = new MeshBuilder(palette);
    m.box("a", 0, 0, 4, 4, 0, 4);
    m.box("b", 0, 0.5, 4, 3, 1, 3); // its +x/-x walls lie in a's
    expect(findCoplanarOverlaps(m.toGlb("test")).length).toBeGreaterThan(0);
  });
});

/** Every design's id, skyscrapers and vehicles alike, for the checks they share. */
const ALL_IDS = [...DESIGNS.keys()].map((id) => [id] as const);

describe("the designs", () => {
  // Regression: the art deco tower's roofs flickered seen from above -- each
  // tier's dark core, its stone piers and its cornice all ended at one height.
  // The glass office, apartment, black slab and terraced towers had smaller cases.
  it.each(ALL_IDS)("%s has no z-fighting faces", (id) => {
    expect(findCoplanarOverlaps(designGlb(id))).toEqual([]);
  });

  it("include ten skyscrapers, with unique sky- ids", () => {
    expect(SKYSCRAPERS.length).toBe(10);
    const ids = SKYSCRAPERS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^sky-[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(SKYSCRAPERS.map((d) => [d.id] as const))("skyscraper %s stands on y = 0, is tall and stays in budget", (id) => {
    const glb = designGlb(id);
    const s = glbStats(glb);
    expect(s.min[1]).toBeCloseTo(0, 5);
    const h = s.max[1] - s.min[1];
    const w = Math.max(s.max[0] - s.min[0], s.max[2] - s.min[2]);
    expect(h).toBeGreaterThan(2 * w); // a skyscraper, not a block
    expect(s.triangles).toBeLessThanOrEqual(10_000);
    expect(faces(glb).length).toBe(s.triangles);
  });

  it.each(ALL_IDS)("%s generates deterministic GLB bytes for the game's LOD cache", (id) => {
    expect(Buffer.from(designGlb(id)).equals(Buffer.from(designGlb(id)))).toBe(true);
  });

  it("throws on an unknown id", () => {
    expect(() => designGlb("sky-nope")).toThrow(/no procedural model/);
    expect(() => designTree("sky-nope")).toThrow(/no procedural model/);
  });

  // The site's source tree is only readable when every primitive sits in a
  // named scope: a design must not draw straight under its root.
  it.each(ALL_IDS)("%s draws every primitive inside a named scope", (id) => {
    const tree = designTree(id);
    expect(tree.root.children.length).toBeGreaterThan(0);
    expect(tree.root.children.filter(isLeaf).map((l) => l.id)).toEqual([]);
    const ids = walk(tree.root).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The site highlights and picks through the leaves' triangle ranges, so they
  // must tile each material's GLB primitive exactly and point at the right faces.
  it.each(ALL_IDS)("%s has a tree whose triangle ranges match its GLB", (id) => {
    const tree = designTree(id);
    const { json, bin } = parseGlb(designGlb(id));
    const byMat = new Map<string, ReturnType<typeof collectTriangles>>();
    for (const t of collectTriangles(json, bin)) {
      if (!byMat.has(t.material)) byMat.set(t.material, []);
      byMat.get(t.material)!.push(t);
    }
    // a model with parts visits its materials node by node, so compare as sets
    expect(tree.materials).toEqual([...byMat.keys()].sort());
    expect(tree.triangles).toBe(glbStats(designGlb(id)).triangles);
    expect(tree.root.triangles).toBe(tree.triangles);
    const leaves = walk(tree.root).filter(isLeaf);
    for (const mat of tree.materials) {
      const ranges = leaves.filter((l) => l.material === mat).map((l) => l.tri).sort((a, b) => a[0] - b[0]);
      let next = 0;
      for (const [first, count] of ranges) {
        expect(first).toBe(next);
        next += count;
      }
      expect(next).toBe(byMat.get(mat)!.length);
    }
    for (const leaf of leaves) {
      if (leaf.tri[1] === 0) continue;
      const tris = byMat.get(leaf.material)!.slice(leaf.tri[0], leaf.tri[0] + leaf.tri[1]);
      for (let k = 0; k < 3; k++) {
        const lo = Math.min(...tris.flatMap((t) => t.p.map((p) => p[k]!)));
        const hi = Math.max(...tris.flatMap((t) => t.p.map((p) => p[k]!)));
        expect(Math.abs(lo - leaf.min![k]!)).toBeLessThan(0.002);
        expect(Math.abs(hi - leaf.max![k]!)).toBeLessThan(0.002);
      }
    }
  });

  it.each(ALL_IDS)("%s records the same source tree every time", (id) => {
    expect(JSON.stringify(designTree(id))).toBe(JSON.stringify(designTree(id)));
  });
});

describe("the vehicles", () => {
  it("have unique veh- ids that no building shares", () => {
    const ids = ALL_VEHICLES.map((d) => d.id);
    expect(ids).toContain("veh-american-truck");
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^veh-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const d of BUILDINGS) {
      if (d.catalog?.group === "industry") expect(d.id).toMatch(/^(ind|industry|chemical)-[a-z0-9]+(-[a-z0-9]+)*$/);
      else expect(d.id).toMatch(/^(sky|bld|comm|commercial|tower)-[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(DESIGNS.size).toBe(BUILDINGS.length + VILLAGE_HOUSES.length + ALL_VEHICLES.length);
  });

  it.each([...VEHICLES, ...STEAM_LOCOS].map((d) => [d.id] as const))("%s stands on its wheels, faces +x, fits its road or track and stays in budget", (id) => {
    // Repository rail envelope: 3.1 m wide, 4.7 m excluding pantographs.
    // An active collector may reach the separate 6.5 m operating limit.
    const rail = DESIGNS.get(id)!.catalog?.category === "Rail vehicles";
    const glb = designGlb(id);
    const s = glbStats(glb);
    expect(s.min[1]).toBeCloseTo(0, 5);
    const length = s.max[0] - s.min[0];
    const width = s.max[2] - s.min[2];
    expect(length).toBeGreaterThan(2 * width); // long along x
    expect(s.min[2]).toBeCloseTo(-s.max[2], 5); // centred across
    expect(width).toBeLessThanOrEqual(rail ? 3.1 : 2.7); // 2.6 m legal road width, mirrors aside
    expect(s.max[1]).toBeLessThanOrEqual(rail ? 6.5 : 4.115); // raised collector or road height
    if (rail) {
      const fixed = walk(designTree(id).root).filter((n) => isLeaf(n) && !n.id.startsWith("roof-equipment/pantographs/"));
      expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
    }
    // the road-vehicle budget (.agents/skills/road-vehicle); a rail vehicle,
    // much larger and seen closer along the track, aims at about 15k with
    // room for a small overflow (.agents/skills/railroad-vehicle)
    expect(s.triangles).toBeLessThanOrEqual(rail ? 16_000 : 10_000);
    expect(faces(glb).length).toBe(s.triangles);
    const { json } = parseGlb(glb);
    // flat normals are stored, not left to the loader: a pipeline step that
    // recomputes normals on shared vertices would smooth every hard edge
    const meshes = (json as { meshes: Array<{ primitives: Array<{ attributes: { NORMAL?: number }; indices?: number }> }> }).meshes;
    for (const p of meshes.flatMap((x) => x.primitives)) {
      expect(p.attributes.NORMAL).toBeDefined();
      expect(p.indices).toBeUndefined();
    }
    expect((json as { asset: { generator: string } }).asset.generator).toBe(`Rail Island procedural vehicle (${id})`);
  });

  it("ships the CD 163 as a rigid rail vehicle on standard gauge", () => {
    const d = VEHICLES.find((v) => v.id === "veh-cd-163")!;
    expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco" });
    const { json } = parseGlb(designGlb(d.id));
    expect((json as { nodes: Array<{ name: string }> }).nodes.map((n) => n.name)).toEqual(["vehicle"]);
    const s = glbStats(designGlb(d.id));
    expect(s.max[0] - s.min[0]).toBeCloseTo(16.8, 2); // over the buffers
    expect(s.max[0] + s.min[0]).toBeCloseTo(0, 5); // centred along x
    // the bogies: 8.30 m between the pivots, 3.20 m wheelbase, so the four
    // axles stand at +-2.55 and +-5.75 m
    const tree = designTree(d.id);
    // each wheelset's first primitive is its axle
    const axleLeaves = walk(tree.root).filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
    const axles = axleLeaves.map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b);
    expect(axles).toEqual([-5.75, -2.55, 2.55, 5.75]);
  });

  it("raises only the rear CD 163 pantograph with connected, constant-length arms and a level head", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    const { json, bin } = parseGlb(designGlb("veh-cd-163"));
    const triangles = collectTriangles(json, bin);
    const metal = triangles.filter((t) => t.material === "pantograph");
    const roots = nodes.filter((n) => /^roof-equipment\/pantographs\/(front|rear)-pantograph$/.test(n.id));
    expect(roots).toHaveLength(2);
    expect(roots.filter((n) => n.max![1] > 5)).toHaveLength(1);
    for (const end of ["front", "rear"]) {
      const prefix = `roof-equipment/pantographs/${end}-pantograph`;
      const head = nodes.find((n) => n.id === `${prefix}/head`)!;
      expect(head.max![1]).toBeCloseTo(end === "rear" ? 5.74 : 4.64, 3);
      const strips = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${prefix}/head/`) && n.material === "carbon");
      expect(strips).toHaveLength(2);
      for (const strip of strips) {
        expect(strip.max![1]).toBeCloseTo(head.max![1], 3);
        expect(strip.max![1] - strip.min![1]).toBeCloseTo(0.05, 3);
      }
      const joints: number[] = [];
      for (const [arm, length] of [["lower", Math.hypot(1.60, 0.11, 0.26)], ["upper", Math.hypot(1.20, 0.09, 0.28)]] as const) {
        const tubes = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${prefix}/arms/${arm}-arms/`));
        expect(tubes).toHaveLength(2);
        for (const tube of tubes) {
          const points = metal.slice(tube.tri[0], tube.tri[0] + tube.tri[1]).flatMap((t) => t.p);
          const xs = [Math.min(...points.map((p) => p[0])), Math.max(...points.map((p) => p[0]))];
          const centres = xs.map((x) => {
            const ring = points.filter((p) => Math.abs(p[0] - x) < 1e-6);
            return [x, ...[1, 2].map((axis) => (Math.min(...ring.map((p) => p[axis]!)) + Math.max(...ring.map((p) => p[axis]!))) / 2)];
          }).sort((a, b) => a[1]! - b[1]!);
          expect(Math.hypot(...centres[1]!.map((v, i) => v - centres[0]![i]!))).toBeCloseTo(length, 5);
          if (arm === "lower") {
            joints.push(centres[1]![1]!);
            // the hinge stands toward the middle, the knee points to the nearer cab end
            expect(Math.abs(centres[1]![0]!)).toBeGreaterThan(Math.abs(centres[0]![0]!) + 0.3);
          }
          else {
            expect(centres[0]![1]! - joints[0]!).toBeCloseTo(0.02, 5);
            expect(head.max![1] - centres[1]![1]!).toBeCloseTo(0.07, 4);
          }
        }
      }
    }
  });

  it("keeps the CD 163 windscreens wide, near the cab edges, and raked", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    for (const cab of ["front-cab", "rear-cab"]) {
      const panes = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/windscreen/`) && n.material === "glass");
      expect(panes).toHaveLength(2);
      for (const pane of panes) {
        const height = pane.max![1] - pane.min![1];
        const width = pane.max![2] - pane.min![2];
        // Wide rectangles near the outer cab edges, rather than near-square
        // panes surrounded by a broad green border.
        expect(height).toBeGreaterThan(0.69);
        expect(height).toBeLessThan(0.72);
        expect(width / height).toBeGreaterThan(1.69);
        expect(width / height).toBeLessThan(1.73);
        const outer = Math.max(Math.abs(pane.min![2]), Math.abs(pane.max![2]));
        expect(outer).toBeGreaterThan(1.26);
        expect(outer).toBeLessThan(1.31);
        // The reference upper profile recedes 0.20 m over the whole cab.
        expect(pane.max![0] - pane.min![0]).toBeGreaterThan(0.11);
        expect(pane.max![0] - pane.min![0]).toBeLessThan(0.20);
      }
      for (const side of ["left-side", "right-side"]) {
        const glass = (scope: string) => nodes.find((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/${side}/${scope}/`) && n.material === "glass")!;
        const window = glass("side-window");
        const door = glass("door");
        expect(window.max![1] - window.min![1]).toBeCloseTo(0.70, 2);
        expect(window.max![0] - window.min![0]).toBeCloseTo(0.60, 2);
        expect(door.max![1] - door.min![1]).toBeCloseTo(0.70, 2);
        expect(door.max![0] - door.min![0]).toBeCloseTo(0.50, 2);
        expect(Math.abs(window.max![1] - door.max![1])).toBeLessThan(0.06);
      }
    }
  });

  it("recedes above AND below the CD 163 nose and keeps its fittings on the sloped skin", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    const { json, bin } = parseGlb(designGlb("veh-cd-163"));
    const triangles = collectTriangles(json, bin);
    const materials = new Map([...new Set(triangles.map((t) => t.material))].map((mat) => [mat, triangles.filter((t) => t.material === mat)]));
    const scoped = (id: string) => nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(id + "/"))
      .flatMap((n) => materials.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1]));
    const shell = scoped("body/shell");
    for (const e of [-1, 1]) {
      const extentAt = (y: number) => Math.max(...shell.flatMap((t) => t.p)
        .filter((p) => Math.abs(p[1] - y) < 1e-5).map((p) => e * p[0]));
      // The original vlakosimdb alongz/base profile recedes 0.10 m below
      // the nose and 0.20 m above it. A vertical lower face must fail.
      const nose = extentAt(2.30);
      expect(nose - extentAt(1.20)).toBeCloseTo(0.10, 4);
      expect(nose - extentAt(3.70)).toBeCloseTo(0.20, 4);
      expect(extentAt(1.03)).toBeCloseTo(extentAt(1.20), 4);
      const lowerFaces = shell.filter((t) => t.n[0][0] * e > 0.9 && t.p.every((p) => p[1] >= 1.19999 && p[1] <= 2.30001));
      expect(lowerFaces.length).toBeGreaterThan(0);
      for (const t of lowerFaces) expect(t.n[0][1]).toBeLessThan(-0.07);

      const cab = e > 0 ? "front-cab" : "rear-cab";
      const lowerSlope = 0.10 / (2.30 - 1.20);
      const distance = (p: readonly number[]) => (e * p[0]! - nose - lowerSlope * (p[1]! - 2.30)) / Math.hypot(1, lowerSlope);
      const badge = scoped(`${cab}/front-markings/emblem`);
      expect(badge.length).toBeGreaterThan(0);
      for (const p of badge.flatMap((t) => t.p)) expect(distance(p)).toBeCloseTo(0.006, 4);
      const numbers = scoped(`${cab}/front-markings/number-plate`).filter((t) => t.material === "white");
      expect(numbers.length).toBeGreaterThan(0);
      for (const p of numbers.flatMap((t) => t.p)) expect(distance(p)).toBeCloseTo(0.028, 4);
      const markers = scoped(`${cab}/lamps`).filter((t) => t.material === "lampHead" && t.p.every((p) => p[1] < 2));
      expect(markers.length).toBeGreaterThan(0);
      for (const p of markers.flatMap((t) => t.p)) {
        expect(distance(p)).toBeGreaterThanOrEqual(-1e-5);
        expect(distance(p)).toBeLessThanOrEqual(0.03701);
      }
    }
  });

  it("gives the CD 163 substantial marker lamps, rounded buffer heads and an upright badge", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    for (const cab of ["front-cab", "rear-cab"]) {
      const markers = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/lamps/`) && n.material === "lampHead" && n.max![1] < 2);
      expect(markers).toHaveLength(2);
      for (const lens of markers) expect(lens.max![2] - lens.min![2]).toBeCloseTo(0.20, 2);
      const heads = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/buffer-beam/buffers/`) && n.kind === "slab");
      expect(heads).toHaveLength(2);
      for (const head of heads) {
        expect(head.max![2] - head.min![2]).toBeCloseTo(0.70, 2);
        expect(head.max![1] - head.min![1]).toBeCloseTo(0.40, 2);
      }
      const badge = nodes.find((n) => n.id === `${cab}/front-markings/emblem`)!;
      const aspect = (badge.max![2] - badge.min![2]) / (badge.max![1] - badge.min![1]);
      expect(aspect).toBeGreaterThan(1.2);
      expect(aspect).toBeLessThan(1.35);
      expect(badge.min![1]).toBeGreaterThan(1.79);
      expect(badge.max![1]).toBeLessThan(2.30); // contained in the yellow band
    }
  });

  it("keeps equal marker lamps clear of the yellow band and close above the buffers, with low tilted ploughs", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    const { json, bin } = parseGlb(designGlb("veh-cd-163"));
    const yellow = collectTriangles(json, bin).filter((t) => t.material === "yellow");
    for (const cab of ["front-cab", "rear-cab"]) {
      const lamps = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/lamps/`));
      const markers = lamps.filter((n) => ["lampHead", "lampRed"].includes(n.material) && n.max![1] < 2);
      expect(markers).toHaveLength(4);
      expect(markers.filter((n) => n.material === "lampRed")).toHaveLength(2);
      for (const lens of markers) {
        expect(lens.max![2] - lens.min![2]).toBeCloseTo(0.200, 3);
        expect(lens.max![1] - lens.min![1]).toBeCloseTo(markers[0]!.max![1] - markers[0]!.min![1], 3);
      }
      const buffers = nodes.find((n) => n.id === `${cab}/buffer-beam/buffers`)!;
      const numberPlate = nodes.find((n) => n.id === `${cab}/front-markings/number-plate`)!;
      expect(numberPlate.max![2] - numberPlate.min![2]).toBeCloseTo(1.04, 2);
      expect(numberPlate.max![1] - numberPlate.min![1]).toBeCloseTo(0.343, 2);
      const upperHousing = lamps.find((n) => n.material === "rubber" && n.min![1] > 2)!;
      expect(upperHousing.max![2] - upperHousing.min![2]).toBeCloseTo(0.60, 2);
      const rims = lamps.filter((n) => n.material === "rubber" && n.max![1] < 2);
      for (const side of [-1, 1]) {
        const onSide = rims.filter((n) => side * (n.min![2] + n.max![2]) > 0)
          .sort((a, b) => Math.abs(a.min![2] + a.max![2]) - Math.abs(b.min![2] + b.max![2]));
        expect(onSide).toHaveLength(2);
        const inner = onSide[0]!, outer = onSide[1]!;
        const innerEdge = Math.min(Math.abs(inner.min![2]), Math.abs(inner.max![2]));
        expect(innerEdge - Math.max(Math.abs(numberPlate.min![2]), Math.abs(numberPlate.max![2]))).toBeGreaterThan(0.17);
        const separation = Math.min(Math.abs(outer.min![2]), Math.abs(outer.max![2])) - Math.max(Math.abs(inner.min![2]), Math.abs(inner.max![2]));
        expect(separation).toBeGreaterThan(0.015);
      }
      for (const lamp of lamps) {
        if (lamp.max![1] < 2) {
          expect(lamp.max![1]).toBeLessThan(1.70 - 0.04);
          if (lamp.material === "rubber") {
            const gap = lamp.min![1] - buffers.max![1];
            expect(gap).toBeGreaterThan(0.14);
            expect(gap).toBeLessThan(0.16);
          }
        } else {
          expect(lamp.min![1]).toBeGreaterThan(2.30 + 0.04);
        }
      }
      const plates = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith(`${cab}/track-clearers/`) && n.material === "yellow");
      expect(plates).toHaveLength(2);
      for (const plate of plates) {
        expect(plate.min![1]).toBeCloseTo(0.10, 3);
        expect(plate.max![1]).toBeCloseTo(0.50, 3);
        const vertices = yellow.slice(plate.tri[0], plate.tri[0] + plate.tri[1]).flatMap((t) => t.p);
        const e = cab === "front-cab" ? 1 : -1;
        const reach = (y: number) => Math.max(...vertices.filter((p) => Math.abs(p[1] - y) < 1e-5).map((p) => e * p[0]));
        expect(reach(0.10) - reach(0.50)).toBeCloseTo(0.17, 4);
      }
    }
  });

  it("distinguishes the CD 163 porthole side from the opposite intake shutters", () => {
    const nodes = walk(designTree("veh-cd-163").root);
    const panes = nodes.filter((n): n is LeafNode => isLeaf(n) && n.id.startsWith("body/portholes/") && n.material === "glass");
    expect(panes).toHaveLength(4);
    for (const pane of panes) {
      expect(pane.min![2]).toBeGreaterThan(1.4);
      expect(pane.max![1] - pane.min![1]).toBeGreaterThan(0.6);
    }
    const intake = nodes.find((n) => n.id === "body/machine-room-intake")!;
    expect(intake.max![2]).toBeLessThan(-1.4);
    expect(intake.max![0] - intake.min![0]).toBeGreaterThan(11);
    expect(intake.min![1]).toBeGreaterThan(2.30); // clear of the livery band
  });

  it("matches native CD 163 bitmap landmarks in orthographic projection", () => {
    // Original 30x60 / 170x60 BMP annotations, independent of generator values.
    // One native pixel is 0.10 m. Wider tolerances cover ambiguous buffer and
    // door outlines, and the painted band's extent beyond the body silhouette.
    const reference = JSON.parse(fs.readFileSync(new URL("../assets/cd-163/native/landmarks.json", import.meta.url), "utf8")) as {
      annotations: Array<{ id: string; view: string; box: number[]; nodes: string[]; tolerancePixels: number }>;
    };
    const nodes = walk(designTree("veh-cd-163").root).filter(isLeaf);
    const { json, bin } = parseGlb(designGlb("veh-cd-163"));
    const triangles = collectTriangles(json, bin);
    const materials = new Map([...new Set(triangles.map((t) => t.material))].map((mat) => [mat, triangles.filter((t) => t.material === mat)]));
    expect(reference.annotations).toHaveLength(50);
    for (const row of reference.annotations) {
      // Check both ends against x_both in the same texture-coordinate basis.
      for (const rear of row.view === "x_both" ? [false, true] : [false]) {
        const ids = row.nodes.map((id) => rear ? id.replace("front-cab/", "rear-cab/") : id);
        const selected = nodes.filter((n) => ids.some((id) => n.id === id || n.id.startsWith(id + "/")));
        expect(selected.length, row.id).toBeGreaterThan(0);
        const points = selected.flatMap((n) => materials.get(n.material)!.slice(n.tri[0], n.tri[0] + n.tri[1])).flatMap((t) => t.p);
        const u = points.map((p) => row.view === "x_both" ? 10 * (1.5 - p[2]) : 10 * (p[0] + 8.5));
        const v = points.map((p) => 10 * (6 - p[1]));
        const actual = [Math.min(...u), Math.min(...v), Math.max(...u), Math.max(...v)];
        // Compare left/top AND width/height, so matching only the centre fails.
        const dimensions = (b: number[]) => [b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!];
        const expected = dimensions(row.box);
        dimensions(actual).forEach((value, i) => {
          expect(Math.abs(value - expected[i]!), `${row.id} ${rear ? "rear" : "front/side"} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
        });
      }
    }
    const heads = nodes.filter((n) => n.id.startsWith("front-cab/buffer-beam/buffers/") && n.kind === "slab");
    const centres = heads.map((n) => (n.min![2] + n.max![2]) / 2).sort((a, b) => a - b);
    // Preserve the mechanical spacing despite the coarse buffer silhouettes.
    expect(centres[1]! - centres[0]!).toBeCloseTo(1.75, 3);
  });

  it("puts the truck's grille at the +x end, ahead of the front axle", () => {
    const tree = designTree("veh-american-truck");
    const byId = new Map(walk(tree.root).map((n) => [n.id, n]));
    const grille = byId.get("truck/grille")!;
    const axle = byId.get("truck/front-axle")!;
    const sleeper = byId.get("truck/sleeper")!;
    expect(grille.max![0]).toBeGreaterThan(axle.max![0]);
    expect(sleeper.max![0]).toBeLessThan(axle.min![0]);
  });

  // An articulated vehicle is two named parts divided at the rotation point:
  // the game turns the trailer by rotating its node about the node's origin.
  it("splits the articulated truck into a truck and a trailer node, the trailer's at the king pin", () => {
    const { json } = parseGlb(designGlb("veh-american-truck"));
    const nodes = (json as { nodes: Array<{ name: string; translation?: number[]; children?: number[] }> }).nodes;
    // the steered front wheels are children of the truck's node
    expect(nodes.map((n) => n.name)).toEqual(["truck", "wheel-front-left", "wheel-front-right", "trailer"]);
    expect((json as { scenes: Array<{ nodes: number[] }> }).scenes[0]!.nodes).toEqual([0, 3]);
    expect(nodes[0]!.children).toEqual([1, 2]);
    expect(nodes[0]!.translation).toEqual([0, 0, 0]);
    const pivot = nodes[3]!.translation!;
    expect(pivot[2]).toBe(0); // on the centre line
    const tree = designTree("veh-american-truck");
    expect(tree.root.children.map((c) => c.id)).toEqual(["truck", "wheel-front-left", "wheel-front-right", "trailer"]);
    const byId = new Map(walk(tree.root).map((n) => [n.id, n]));
    // the king pin rides on the fifth wheel's top, within its plate
    const fifth = byId.get("truck/chassis/fifth-wheel")!;
    expect(pivot[1]).toBeCloseTo(fifth.max![1] - 0.01, 5);
    expect(pivot[0]).toBeGreaterThan(fifth.min![0]);
    expect(pivot[0]).toBeLessThan(fifth.max![0]);
  });

  it("lets the trailer swing clear of the sleeper", () => {
    const tree = designTree("veh-american-truck");
    const byId = new Map(walk(tree.root).map((n) => [n.id, n]));
    const { json } = parseGlb(designGlb("veh-american-truck"));
    const pivot = (json as { nodes: Array<{ name: string; translation?: number[] }> }).nodes.find((n) => n.name === "trailer")!.translation!;
    const body = byId.get("trailer/body")!;
    const sleeper = byId.get("truck/sleeper")!;
    // the trailer front's corners sweep a circle about the pivot
    const reach = Math.hypot(body.max![0] - pivot[0]!, body.max![2]!);
    expect(pivot[0]! + reach + 0.1).toBeLessThanOrEqual(sleeper.min![0]!);
    // and the landing gear stands behind the tractor's rear wheels
    expect(byId.get("trailer/landing-gear")!.max![0]).toBeLessThan(byId.get("truck/drive-axle-1")!.min![0]!);
  });
});

describe("generateModels", () => {
  // The systematic guard: the deploy does not wait for the tests, so the build
  // itself refuses a design that would flicker -- and writes nothing.
  it("refuses a z-fighting design and writes nothing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-zfight-"));
    try {
      const flicker = {
        id: "sky-flicker",
        title: "Flicker",
        build: () => {
          const m = new MeshBuilder({ a: { color: "#ff0000" }, b: { color: "#0000ff" } });
          m.box("a", 0, 0, 10, 10, 0, 50);
          m.box("b", 0, 0, 4, 4, 20, 50); // roof flush with a's
          return m;
        },
      };
      let thrown: unknown;
      try {
        generateModels(dir, [SKYSCRAPERS[0]!, flicker]);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(ZFightingError);
      expect((thrown as ZFightingError).found.has("sky-flicker")).toBe(true);
      expect((thrown as Error).message).toMatch(/sky-flicker/);
      expect(fs.readdirSync(dir)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes a GLB and a thumbnail per design, skips an unchanged one, and prunes a dropped one", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-"));
    try {
      fs.mkdirSync(path.join(dir, "glb"));
      fs.mkdirSync(path.join(dir, "thumbs"));
      fs.writeFileSync(path.join(dir, "glb", "sky-retired.glb"), "stale");
      fs.writeFileSync(path.join(dir, "thumbs", "sky-retired.png"), "stale");
      fs.mkdirSync(path.join(dir, "tree"));
      fs.writeFileSync(path.join(dir, "tree", "sky-retired.json"), "stale");
      const first = await generateInSubprocess(dir, "models");
      expect(first.map((b) => b.id).sort()).toEqual([...DESIGNS.keys()].sort());
      for (const b of first) {
        expect(b.changed).toBe(true);
        expect(fs.readFileSync(b.thumb).subarray(1, 4).toString()).toBe("PNG");
        expect(JSON.parse(fs.readFileSync(b.tree, "utf8"))).toEqual(designTree(b.id));
      }
      expect(fs.existsSync(path.join(dir, "tree", "sky-retired.json"))).toBe(false);
      expect(fs.existsSync(path.join(dir, "glb", "sky-retired.glb"))).toBe(false);
      expect(fs.existsSync(path.join(dir, "thumbs", "sky-retired.png"))).toBe(false);
      // a second run finds nothing to rewrite, and leaves the thumbnails alone;
      // each run is long, so let vitest's RPC replies in between (test/setup.ts)
      const mtime = fs.statSync(first[0]!.thumb).mtimeMs;
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(generateModels(dir).every((b) => !b.changed)).toBe(true);
      expect(fs.statSync(first[0]!.thumb).mtimeMs).toBe(mtime);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 900_000); // builds the whole export, which grows with every design
});
