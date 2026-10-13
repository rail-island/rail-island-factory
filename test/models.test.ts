// The procedurally authored models (generator/): the mesh builder's winding, each
// design's shape and budget, and the generator's output on disk.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MeshBuilder, ngon, rect } from "../generator/meshBuilder";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { ZFightingError, designGlb, generateModels } from "../generator/generate";
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

  it("refuses a material missing from its palette", () => {
    const m = new MeshBuilder({ a: { color: "#808080" } });
    expect(() => m.box("b", 0, 0, 1, 1, 0, 1)).toThrow(/unknown material/);
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

describe("the skyscrapers", () => {
  // Regression: the art deco tower's roofs flickered seen from above -- each
  // tier's dark core, its stone piers and its cornice all ended at one height.
  // The glass office, apartment, black slab and terraced towers had smaller cases.
  it.each(SKYSCRAPERS.map((d) => [d.id] as const))("%s has no z-fighting faces", (id) => {
    expect(findCoplanarOverlaps(designGlb(id))).toEqual([]);
  });

  it("are ten, with unique sky- ids", () => {
    expect(SKYSCRAPERS.length).toBe(10);
    const ids = SKYSCRAPERS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^sky-[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(SKYSCRAPERS.map((d) => [d.id] as const))("%s stands on y = 0, is tall and stays in budget", (id) => {
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
    for (const d of SKYSCRAPERS) expect(Buffer.from(designGlb(d.id)).equals(Buffer.from(designGlb(d.id)))).toBe(true);
  });

  it("throws on an unknown id", () => {
    expect(() => designGlb("sky-nope")).toThrow(/no procedural model/);
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
      const first = generateModels(dir);
      expect(first.map((b) => b.id).sort()).toEqual(SKYSCRAPERS.map((d) => d.id).sort());
      for (const b of first) {
        expect(b.changed).toBe(true);
        expect(fs.readFileSync(b.thumb).subarray(1, 4).toString()).toBe("PNG");
      }
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
