// The procedurally authored models (generator/): the mesh builder's winding, each
// design's shape and budget, and the generator's output on disk.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MeshBuilder, ngon, rect } from "../generator/meshBuilder";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { designGlb, generateModels } from "../generator/generate";
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

describe("the skyscrapers", () => {
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
