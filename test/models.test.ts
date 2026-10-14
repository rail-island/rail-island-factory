// The procedurally authored models (generator/): the mesh builder's winding, each
// design's shape and budget, and the generator's output on disk.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MeshBuilder, ngon, rect } from "../generator/meshBuilder";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { VEHICLES } from "../generator/vehicles";
import { DESIGNS, ZFightingError, designGlb, designTree, generateModels } from "../generator/generate";
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
    expect(s.triangles).toBeLessThanOrEqual(4000);
    expect(faces(glb).length).toBe(s.triangles);
  });

  it("generate the same bytes every time, so the game's LOD cache can key on them", () => {
    for (const d of DESIGNS.values()) expect(Buffer.from(designGlb(d.id)).equals(Buffer.from(designGlb(d.id)))).toBe(true);
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

  it("record the same source tree every time", () => {
    for (const d of DESIGNS.values()) expect(JSON.stringify(designTree(d.id))).toBe(JSON.stringify(designTree(d.id)));
  });
});

describe("the vehicles", () => {
  it("have unique veh- ids that no skyscraper shares", () => {
    const ids = VEHICLES.map((d) => d.id);
    expect(ids).toContain("veh-american-truck");
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^veh-[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(DESIGNS.size).toBe(SKYSCRAPERS.length + VEHICLES.length);
  });

  it.each(VEHICLES.map((d) => [d.id] as const))("%s stands on its wheels, faces +x, fits a US road and stays in budget", (id) => {
    const glb = designGlb(id);
    const s = glbStats(glb);
    expect(s.min[1]).toBeCloseTo(0, 5);
    const length = s.max[0] - s.min[0];
    const width = s.max[2] - s.min[2];
    expect(length).toBeGreaterThan(2 * width); // long along x
    expect(s.min[2]).toBeCloseTo(-s.max[2], 5); // centred across
    expect(width).toBeLessThanOrEqual(2.7); // 2.6 m legal width, mirrors aside
    expect(s.max[1]).toBeLessThanOrEqual(4.115); // 13 ft 6 in
    // the road-vehicle budget (.claude/skills/road-vehicle)
    expect(s.triangles).toBeLessThanOrEqual(10_000);
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
    const nodes = (json as { nodes: Array<{ name: string; translation?: number[] }> }).nodes;
    expect(nodes.map((n) => n.name)).toEqual(["truck", "trailer"]);
    expect(nodes[0]!.translation).toEqual([0, 0, 0]);
    const pivot = nodes[1]!.translation!;
    expect(pivot[2]).toBe(0); // on the centre line
    const tree = designTree("veh-american-truck");
    expect(tree.root.children.map((c) => c.id)).toEqual(["truck", "trailer"]);
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
    const pivot = (json as { nodes: Array<{ translation?: number[] }> }).nodes[1]!.translation!;
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

  it("writes a GLB and a thumbnail per design, skips an unchanged one, and prunes a dropped one", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-"));
    try {
      fs.mkdirSync(path.join(dir, "glb"));
      fs.mkdirSync(path.join(dir, "thumbs"));
      fs.writeFileSync(path.join(dir, "glb", "sky-retired.glb"), "stale");
      fs.writeFileSync(path.join(dir, "thumbs", "sky-retired.png"), "stale");
      fs.mkdirSync(path.join(dir, "tree"));
      fs.writeFileSync(path.join(dir, "tree", "sky-retired.json"), "stale");
      const first = generateModels(dir);
      expect(first.map((b) => b.id).sort()).toEqual([...DESIGNS.keys()].sort());
      for (const b of first) {
        expect(b.changed).toBe(true);
        expect(fs.readFileSync(b.thumb).subarray(1, 4).toString()).toBe("PNG");
        expect(JSON.parse(fs.readFileSync(b.tree, "utf8"))).toEqual(designTree(b.id));
      }
      expect(fs.existsSync(path.join(dir, "tree", "sky-retired.json"))).toBe(false);
      expect(fs.existsSync(path.join(dir, "glb", "sky-retired.glb"))).toBe(false);
      expect(fs.existsSync(path.join(dir, "thumbs", "sky-retired.png"))).toBe(false);
      // a second run finds nothing to rewrite, and leaves the thumbnails alone
      const mtime = fs.statSync(first[0]!.thumb).mtimeMs;
      expect(generateModels(dir).every((b) => !b.changed)).toBe(true);
      expect(fs.statSync(first[0]!.thumb).mtimeMs).toBe(mtime);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
