// The shared vehicle LOD kit (generator/lodKit.ts): its tables, window bands,
// painted shell and the order in which fitLod gives detail up.

import { describe, expect, it } from "vitest";
import { MeshBuilder } from "../generator/meshBuilder";
import { fitLod, fitParts, lodBands, lodShell, lodWheel, LOD_GLASS, LOD_PALETTE, mergeBand, simplifyTable, windowBands, type LodShell } from "../generator/lodKit";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";

const PALETTE = { ...LOD_PALETTE, red: { color: "#aa0000" }, white: { color: "#eeeeee" }, grey: { color: "#777777" }, dark: { color: "#222222" } };

const SHELL: LodShell = {
  y0: 1,
  tip: [[1, 8], [2.5, 8], [3.6, 7.8], [4.2, 7.2]],
  hw: [[1, 1.5], [3.6, 1.5], [4.2, 1.0]],
  side: [[1, 1.6, "red"], [1.6, 1.8, "white"], [1.8, 3.6, "red"], [3.6, 4.2, "grey"]],
  end: [[1, 1.6, "red"], [1.6, 1.8, "white"], [1.8, 3.6, "red"], [3.6, 4.2, "grey"]],
  roof: "grey",
  endWindows: [{ u: [-1.4, 1.4], y: [2.8, 3.4], mat: LOD_GLASS }],
};

function faces(m: MeshBuilder) {
  const { json, bin } = parseGlb(m.toGlb("t"));
  return collectTriangles(json, bin);
}

describe("LOD kit tables and bands", () => {
  it("drops profile points within the tolerance and keeps the ends", () => {
    const t = [[0, 0], [1, 0.01], [2, 0], [3, 1]] as const;
    expect(simplifyTable(t, 0)).toEqual(t);
    expect(simplifyTable(t, 0.05)).toEqual([[0, 0], [2, 0], [3, 1]]);
  });

  it("clips bands, joins neighbours of one colour and paints a band with its thicker neighbour", () => {
    expect(lodBands([[0, 1, "a"], [1, 2, "a"], [2, 3, "b"]], 0.5, 2.5)).toEqual([[0.5, 2, "a"], [2, 2.5, "b"]]);
    expect(mergeBand([[0, 1, "a"], [1, 1.1, "b"], [1.1, 3, "c"]], 1)).toEqual([[0, 1, "a"], [1, 3, "c"]]);
  });

  it("joins a split windscreen into one band but keeps distant windows apart", () => {
    expect(windowBands([{ u: [0.1, 1.3], y: [2.7, 3.4] }, { u: [-1.3, -0.1], y: [2.7, 3.4] }], 0.4)).toEqual([{ u: [-1.3, 1.3], y: [2.7, 3.4], mat: LOD_GLASS }]);
    expect(windowBands([{ u: [0, 1], y: [2, 3] }, { u: [3, 4], y: [2, 3] }], 0.4)).toHaveLength(2);
  });
});

describe("LOD kit shell", () => {
  it("paints the bands and the windscreen on a closed-sided body without coplanar overlaps", () => {
    const m = new MeshBuilder(PALETTE);
    lodShell(m, SHELL);
    const glb = m.toGlb("t");
    expect(findCoplanarOverlaps(glb)).toEqual([]);
    const s = glbStats(glb);
    expect(s.min).toEqual([-8, 1, -1.5]);
    expect(s.max).toEqual([8, expect.closeTo(4.2, 5), 1.5]);
    const mats = new Set(faces(m).map((f) => f.material));
    expect([...mats].sort()).toEqual(["grey", LOD_GLASS, "red", "white"].sort());
    // the windscreen within 0.2 m of the corners spans the whole end: one quad per end
    expect(faces(m).filter((f) => f.material === LOD_GLASS)).toHaveLength(4);
  });

  it("draws a vee nose where the corners are set back, and a flat end when told", () => {
    const vee = new MeshBuilder(PALETTE);
    lodShell(vee, { ...SHELL, setback: [[1, 0.8], [4.2, 0.8]] });
    const tipZ = faces(vee).flatMap((f) => f.p).filter((p) => p[0] > 7.99).map((p) => p[2]);
    expect(tipZ.every((z) => Math.abs(z) < 1e-6)).toBe(true);
    const flat = new MeshBuilder(PALETTE);
    lodShell(flat, { ...SHELL, setback: [[1, 0.8], [4.2, 0.8]] }, 0, true);
    expect(glbStats(flat.toGlb("t")).max[0]).toBeCloseTo(7.6, 5);
    expect(flat.triangleCount()).toBeLessThan(vee.triangleCount());
  });

  it("keeps a window whose edges are not round numbers", () => {
    const m = new MeshBuilder(PALETTE);
    lodShell(m, { ...SHELL, sideWindows: [{ u: [-5, 5], y: [2.6000004, 3.2999996], mat: LOD_GLASS }] });
    expect(faces(m).some((f) => f.material === LOD_GLASS && f.p.every((p) => Math.abs(p[2]) === 1.5))).toBe(true);
  });

  it("closes a vee-nosed shell to a ridge without NaN", () => {
    const m = new MeshBuilder(PALETTE);
    lodShell(m, { ...SHELL, hw: [[1, 1.5], [3.6, 1.5], [4.2, 0]], setback: [[1, 0.8], [4.2, 0.8]] });
    expect(faces(m).every((f) => f.p.flat().every(Number.isFinite))).toBe(true);
  });

  it("paints the cab sections in their own bands", () => {
    const m = new MeshBuilder(PALETTE);
    lodShell(m, { ...SHELL, cab: { x: 6, side: [[1, 3.6, "white"], [3.6, 4.2, "grey"]] } });
    expect(findCoplanarOverlaps(m.toGlb("t"))).toEqual([]);
    const side = faces(m).filter((f) => f.p.every((p) => Math.abs(p[2] - 1.5) < 1e-6) && f.p.every((p) => p[1] < 3.5 && p[1] > 2));
    expect(side.filter((f) => f.p.every((p) => p[0] >= 6 - 1e-6)).every((f) => f.material === "white")).toBe(true);
    expect(side.filter((f) => f.p.every((p) => Math.abs(p[0]) <= 6 + 1e-6)).every((f) => f.material === "red")).toBe(true);
  });
});

describe("LOD kit fitting", () => {
  const box = (m: MeshBuilder) => m.box("dark", 0, 0, 2, 2, 4.2, 4.6);
  it("gives up optional parts first, then the thinnest band, and windows last", () => {
    const spec = { palette: PALETTE, shells: [SHELL], parts: [{ optional: 0, draw: box }] };
    const all = fitLod(spec, 1000);
    const n = all.triangleCount();
    // one triangle short: the optional box goes, the white line and the windscreen stay
    const tight = fitLod(spec, n - 1);
    const mats = new Set(faces(tight).map((f) => f.material));
    expect(mats.has("dark")).toBe(false);
    expect(mats.has("white")).toBe(true);
    expect(mats.has(LOD_GLASS)).toBe(true);
    // tighter and tighter (the profile's kinks give way in between): the white line goes before the windscreen
    let budget = tight.triangleCount();
    let mats2 = mats;
    while (mats2.has("white")) {
      budget--;
      mats2 = new Set(faces(fitLod(spec, budget)).map((f) => f.material));
      expect(mats2.has(LOD_GLASS)).toBe(true);
    }
  });

  it("brings an optional part back once a band merge has made room, and is deterministic", () => {
    const spec = { palette: PALETTE, shells: [SHELL], parts: [{ optional: 0, draw: box }] };
    const n = fitLod(spec, 1000).triangleCount();
    const m = fitLod(spec, n - 4);
    expect(m.triangleCount()).toBeLessThanOrEqual(n - 4);
    expect(m.toGlb("t")).toEqual(fitLod(spec, n - 4).toGlb("t"));
    expect(() => fitLod({ palette: PALETTE, shells: [SHELL], parts: [] }, 4)).toThrow("does not fit");
  });
});

describe("LOD kit solids", () => {
  it("stands a road wheel on a flat side at y = 0", () => {
    for (const n of [5, 6, 8]) {
      const m = new MeshBuilder(PALETTE);
      lodWheel(m, "dark", 0, 0.5, 1.0, 1.3, n);
      const ys = faces(m).flatMap((f) => f.p.map((p) => p[1]));
      expect(Math.min(...ys)).toBeCloseTo(0, 9);
      expect(ys.filter((y) => Math.abs(y) < 1e-9).length).toBeGreaterThan(2);
    }
  });
});

describe("LOD kit parts-only fitting", () => {
  it("gives optional parts up lowest rank first and brings back what fits", () => {
    const box = (x: number) => (m: MeshBuilder) => m.box("dark", x, 0, 1, 1, 0, 1);
    const parts = [{ draw: box(0) }, { optional: 1, draw: box(3) }, { optional: 2, draw: box(6) }];
    const n = fitParts(PALETTE, [parts[0]!], 1000).triangleCount();
    expect(fitParts(PALETTE, parts, 3 * n).triangleCount()).toBe(3 * n);
    // room for two boxes: the rank-1 box goes first, the rank-2 box stays
    const m = fitParts(PALETTE, parts, 2 * n);
    expect(m.triangleCount()).toBe(2 * n);
    expect(glbStats(m.toGlb("t")).max[0]).toBeCloseTo(6.5, 5);
    expect(() => fitParts(PALETTE, parts, n - 1)).toThrow("does not fit");
  });
});

describe("LOD kit shells with two ends of their own", () => {
  const twoEnds: LodShell = {
    y0: 1, hw: [[1, 1.5], [3.6, 1.5], [4.2, 1.0]],
    front: { tip: [[1, 8], [4.2, 7.6]], setback: [[1, 0.8], [4.2, 0.8]], paint: [[1, 4.2, "white"]] },
    rear: { tip: [[1, -6], [4.2, -6]] },
    side: [[1, 3.6, "red"], [3.6, 4.2, "grey"]], roof: "grey",
    cabs: [{ x0: 5, x1: 1e3, side: [[1, 4.2, "white"]] }],
  };
  it("draws a vee nose at the front, a flat rear end, and cab paint over its x range", () => {
    const m = new MeshBuilder(PALETTE);
    lodShell(m, twoEnds);
    expect(findCoplanarOverlaps(m.toGlb("t"))).toEqual([]);
    const s = glbStats(m.toGlb("t"));
    expect(s.min[0]).toBeCloseTo(-6, 5);
    expect(s.max[0]).toBeCloseTo(8, 5);
    const f = faces(m);
    // the front's tip on the centre line, the rear end flat across
    expect(f.flatMap((t) => t.p).filter((p) => p[0] > 7.99).every((p) => Math.abs(p[2]) < 1e-6)).toBe(true);
    expect(f.filter((t) => t.p.every((p) => Math.abs(p[0] + 6) < 1e-6)).every((t) => t.material === "red" || t.material === "grey")).toBe(true);
    // the side is white beyond x = 5, red short of it
    const side = f.filter((t) => t.p.every((p) => Math.abs(p[2] - 1.5) < 1e-6 && p[1] > 1.5 && p[1] < 3.5));
    expect(side.filter((t) => t.p.every((p) => p[0] >= 5 - 1e-6)).every((t) => t.material === "white")).toBe(true);
    expect(side.filter((t) => t.p.every((p) => p[0] <= 5 + 1e-6)).every((t) => t.material === "red")).toBe(true);
  });

  it("gives a band up on every section of a set alike, but not on another shell of the same body", () => {
    const band: LodShell = { ...SHELL, endWindows: [] };
    const pair = (sections: [number, number]) => fitLod({
      palette: PALETTE, parts: [],
      shells: [{ ...band, xc: -9, section: sections[0] }, { ...band, xc: 9, section: sections[1] }],
      ...(sections[1] === 1 ? { sections: { pivots: [[0, 0, 0], [0, 1, 0]], joints: [], maxBendDeg: 10 } } : {}),
    }, 1000);
    const whites = (m: MeshBuilder) => [-9, 9].map((xc) => faces(m).some((t) => t.material === "white" && t.p.every((p) => Math.abs(p[0] - xc) <= 8 + 1e-6)));
    // tighten the budget until the white line first gives way, and see where it went
    const firstLoss = (sections: [number, number]) => {
      for (let budget = pair(sections).triangleCount(); ; budget--) {
        const w = whites(fitLodPair(sections, budget));
        if (!w.every(Boolean)) return w;
      }
    };
    const fitLodPair = (sections: [number, number], budget: number) => fitLod({
      palette: PALETTE, parts: [],
      shells: [{ ...band, xc: -9, section: sections[0] }, { ...band, xc: 9, section: sections[1] }],
      ...(sections[1] === 1 ? { sections: { pivots: [[0, 0, 0], [0, 1, 0]], joints: [], maxBendDeg: 10 } } : {}),
    }, budget);
    expect(whites(pair([0, 1]))).toEqual([true, true]);
    // two sections of a set give the line up together; two shells of one body one at a time
    expect(firstLoss([0, 1])).toEqual([false, false]);
    expect(firstLoss([0, 0]).filter(Boolean)).toHaveLength(1);
  });
});
