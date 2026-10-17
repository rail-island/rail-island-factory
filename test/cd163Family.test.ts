// The liveries of the CD 150, CD 163 / 363 and CD 263 / 371 / 372 designs: the
// running numbers, the paint bands against the native vlakosimdb side BMPs kept
// in assets/, the 263's own machine room, and the budget of every variant.

import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CD150_LIVERIES, CD150_NUMBER, cd150 } from "../generator/cd150";
import { CD163_GREEN, bandAt, runningNumber, type Band } from "../generator/cd163";
import { CD163_LIVERIES, CD263_LIVERIES, cd163, cd163Lod, cd263, cd263Lod } from "../generator/cd163Family";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MaterialSpec, MeshBuilder } from "../generator/meshBuilder";

/** The pixels of an uncompressed bottom-up 8 or 24 bit BMP, as [r, g, b]. */
function readBmp(file: URL): { w: number; h: number; px: (x: number, y: number) => number[] } {
  const b = fs.readFileSync(file);
  const off = b.readUInt32LE(10);
  const w = b.readInt32LE(18);
  const h = b.readInt32LE(22);
  const bpp = b.readUInt16LE(28);
  const row = Math.ceil((w * bpp) / 32) * 4;
  return {
    w,
    h,
    px: (x, y) => {
      const o = off + (h - 1 - y) * row;
      if (bpp === 24) return [b[o + x * 3 + 2]!, b[o + x * 3 + 1]!, b[o + x * 3]!];
      const p = 14 + b.readUInt32LE(14) + b[o + x]! * 4;
      return [b[p + 2]!, b[p + 1]!, b[p]!];
    },
  };
}

const rgb = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);

/** An independent check digit: from the right, weights 2, 1, 2, ...; digit sums; to the next ten. */
function checkDigit(six: string): number {
  const sum = [...six].reverse().reduce((a, ch, i) => {
    const p = Number(ch) * (i % 2 === 0 ? 2 : 1);
    return a + Math.floor(p / 10) + (p % 10);
  }, 0);
  return (10 - (sum % 10)) % 10;
}

interface Case {
  key: string;
  bands: readonly Band[];
  cabBands?: readonly Band[];
  palette: Record<string, MaterialSpec>;
  bmp: URL;
  /** A machine-room column clear of portholes, grilles and windows, and the rows to sample. */
  column: number;
  rows: [number, number];
  /** The canvas: its size in pixels and the height it maps to (the XML colorize's texy2). */
  canvas: [number, number, number];
}

const assets = new URL("../assets/", import.meta.url);
const palette = (m: MeshBuilder): Record<string, MaterialSpec> => {
  const t = m.sourceTree("t", "t");
  return Object.fromEntries(t.materials.map((name, i) => [name, { color: t.colors[i]! }]));
};

const CASES: Case[] = [
  ...Object.entries(CD163_LIVERIES).map(([key, l]): Case => ({
    key, ...l.livery, palette: palette(cd163({ livery: key })),
    bmp: new URL(key === "cd163" ? "cd-163/native/z_dec.bmp" : `cd-163/native/liveries/${l.source}/z_dec.bmp`, assets),
    // cd_163.022 maps a 169 x 57 BMP onto 16.9 x 6.1 m; the others 170 x 60 onto 17 x 6 m
    ...(key === "cd163No022" ? { column: 60, rows: [25, 44], canvas: [169, 57, 6.1] } : { column: 60, rows: [27, 46], canvas: [170, 60, 6] }),
  })),
  ...Object.entries(CD263_LIVERIES).map(([key, l]): Case => ({
    key, ...l.livery, palette: palette(cd263({ livery: key })),
    bmp: new URL(`cd-263/native/${l.source}/z_inc.bmp`, assets),
    column: 60, rows: [27, 46], canvas: [170, 60, 6],
  })),
  ...Object.entries(CD150_LIVERIES).map(([key, l]): Case => ({
    key, bands: l.bands, ...("cabBands" in l ? { cabBands: l.cabBands } : {}), palette: palette(cd150({ livery: key })),
    bmp: new URL(key === "cd150" ? "cd-150/native/z_dec.bmp" : `cd-150/native/liveries/${l.source}/z_dec.bmp`, assets),
    column: 62, rows: [25, 46], canvas: [170, 60, 6],
  })),
];

describe("CD 163 family and CD 150 liveries", () => {
  it("compute valid running numbers, and every livery shows one", () => {
    expect(runningNumber("163", "244")).toBe(CD163_GREEN.number);
    expect(runningNumber("150", "222")).toBe(CD150_NUMBER);
    expect(() => runningNumber("16", "244")).toThrow();
    const numbers = [
      ...Object.values(CD163_LIVERIES).map((l) => l.livery.number),
      ...Object.values(CD263_LIVERIES).map((l) => l.livery.number),
      ...Object.values(CD150_LIVERIES).map((l) => l.number),
    ];
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const n of numbers) {
      const m = /^(\d{3}) (\d{3})-(\d)$/.exec(n);
      expect(m, n).not.toBeNull();
      expect(Number(m![3]), n).toBe(checkDigit(m![1]! + m![2]!));
    }
  });

  it("keep the shipped defaults: the green 163 244-7, the cream and green 150 222-8, the red 263", () => {
    expect(CD163_LIVERIES.cd163.livery).toBe(CD163_GREEN);
    expect(CD150_LIVERIES.cd150.number).toBe(CD150_NUMBER);
    expect(Buffer.from(cd163().toGlb("t")).equals(Buffer.from(cd163({ livery: "cd163" }).toGlb("t")))).toBe(true);
    expect(Buffer.from(cd263().toGlb("t")).equals(Buffer.from(cd263({ livery: "cd263" }).toGlb("t")))).toBe(true);
  });

  for (const c of CASES) {
    it(`${c.key}: paints its bands where the native side BMP has them`, () => {
      const bmp = readBmp(c.bmp);
      const [w, h, metres] = c.canvas;
      expect([bmp.w, bmp.h]).toEqual([w, h]);
      const mats = [...new Set([...c.bands, ...(c.cabBands ?? [])].map((b) => b[2]))];
      let wrong = 0;
      const total = c.rows[1] - c.rows[0] + 1;
      for (let row = c.rows[0]; row <= c.rows[1]; row++) {
        const px = bmp.px(c.column, row);
        // the band material whose colour is nearest to the native pixel
        const nearest = mats.reduce((a, b) => (dist(rgb(c.palette[b]!.color), px) < dist(rgb(c.palette[a]!.color), px) ? b : a));
        const y = metres * (1 - (row + 0.5) / h); // the pixel's centre, metres above the rail
        if (nearest !== bandAt(c.bands, y)[2]) wrong++;
      }
      // one row may straddle an edge: cd_163.022's 0.107 m rows, a shaded rib under a band edge
      expect(wrong, `${wrong} of ${total} rows`).toBeLessThanOrEqual(1);
    });

    if (c.cabBands) it(`${c.key}: paints its cab bands where the native side BMP has them`, () => {
      const bmp = readBmp(c.bmp);
      const mats = [...new Set(c.cabBands!.map((b) => b[2]))];
      // the cab section, under the side window: column 8 (x = -7.65 m) or 10 on the 150
      const column = c.column === 62 ? 10 : 8;
      let wrong = 0;
      for (let row = 36; row <= 46; row++) {
        const px = bmp.px(column, row);
        const nearest = mats.reduce((a, b) => (dist(rgb(c.palette[b]!.color), px) < dist(rgb(c.palette[a]!.color), px) ? b : a));
        if (nearest !== bandAt(c.cabBands!, 6 - (row + 0.5) / 10)[2]) wrong++;
      }
      expect(wrong).toBeLessThanOrEqual(1);
    });
  }
});

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

describe("CD 263 / 371 / 372", () => {
  const nodes = leaves(cd263().sourceTree("proc-vehicle-cd-263", "CD 263").root);

  it("has grille banks on the right and windows on the left, and no 163 portholes or shutters", () => {
    expect(nodes.some((n) => n.id.includes("portholes") || n.id.includes("intake"))).toBe(false);
    const grilles = nodes.filter((n) => n.id.startsWith("body/grille-banks/"));
    const windows = nodes.filter((n) => n.id.startsWith("body/machine-room-windows/"));
    for (const n of grilles) expect(n.min![2]).toBeGreaterThan(1.4);
    for (const n of windows) expect(n.max![2]).toBeLessThan(-1.4);
    // native cd_263 z_dec: the banks span x = -5.6..-2.5 and 2.4..5.5, y = 1.9..3.3 (0.1 m pixels)
    const xs = grilles.flatMap((n) => [n.min![0], n.max![0]]);
    const ys = grilles.flatMap((n) => [n.min![1], n.max![1]]);
    expect(Math.min(...xs)).toBeCloseTo(-5.6, 1);
    expect(Math.max(...xs)).toBeCloseTo(5.5, 1);
    expect(Math.min(...ys)).toBeCloseTo(1.9, 1);
    expect(Math.max(...ys)).toBeCloseTo(3.3, 1);
    // z_inc: two square windows and two divided ones, 2.5 to 3.2 m
    const glass = windows.filter((n) => n.material === "glass");
    expect(glass).toHaveLength(6);
    expect(Math.min(...glass.map((n) => n.min![1]))).toBeCloseTo(2.5, 2);
    expect(Math.max(...glass.map((n) => n.max![1]))).toBeCloseTo(3.2, 2);
  });

  it("gives the 371 005 four equal windows", () => {
    const glass = leaves(cd263({ livery: "cd371No005" }).sourceTree("t", "t").root)
      .filter((n) => n.id.startsWith("body/machine-room-windows/") && n.material === "glass");
    expect(glass).toHaveLength(4);
    const widths = glass.map((n) => n.max![0] - n.min![0]);
    for (const w of widths) expect(w).toBeCloseTo(0.8, 2);
  });

  it("keeps every livery of the three designs within the rail budget", () => {
    const builds = [
      ...Object.keys(CD163_LIVERIES).map((l) => cd163({ livery: l })),
      ...Object.keys(CD263_LIVERIES).map((l) => cd263({ livery: l })),
      ...Object.keys(CD150_LIVERIES).map((l) => cd150({ livery: l })),
    ];
    for (const m of builds) expect(glbStats(m.toGlb("t")).triangles).toBeLessThanOrEqual(16_000);
  });
});

describe("CD 163 family low level of detail", () => {
  const lods = [
    ...Object.keys(CD163_LIVERIES).map((l) => [l, cd163Lod({ livery: l })] as const),
    ...Object.keys(CD263_LIVERIES).map((l) => [l, cd263Lod({ livery: l })] as const),
  ];
  /** The material of the LOD face whose centre is nearest (x, y, z) among those facing n. */
  function faceAt(m: MeshBuilder, x: number, y: number, z: number, n: [number, number, number]): string {
    const { json, bin } = parseGlb(m.toGlb("t"));
    let best = { d: Infinity, mat: "" };
    for (const f of collectTriangles(json, bin)) {
      const [a, b, c] = f.p;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const fn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
      const l = Math.hypot(...fn);
      if (fn[0]! * n[0] + fn[1]! * n[1] + fn[2]! * n[2] < 0.95 * l) continue;
      // the face must contain the point's projection: test the barycentric coordinates in its plane
      const w = [x - a[0], y - a[1], z - a[2]];
      const dot = (p: number[], q: number[]) => p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!;
      const [uu, uv, vv, wu, wv] = [dot(u, u), dot(u, v), dot(v, v), dot(w, u), dot(w, v)];
      const den = uu * vv - uv * uv;
      const s = (vv * wu - uv * wv) / den;
      const t = (uu * wv - uv * wu) / den;
      if (s < -1e-6 || t < -1e-6 || s + t > 1 + 1e-6) continue;
      const d = Math.abs(dot(w, fn) / l);
      if (d < best.d) best = { d, mat: f.material };
    }
    return best.mat;
  }

  it("fits every livery into 100 triangles, standing on its bogies with the rear collector raised", () => {
    for (const [livery, m] of lods) {
      const s = glbStats(m.toGlb("t"));
      expect(s.triangles, livery).toBeLessThanOrEqual(100);
      expect(s.triangles, livery).toBeGreaterThan(80);
      // the running gear reaches down to the rail instead of the body floating 1 m above it
      expect(s.min[1], livery).toBeLessThan(0.1);
      expect(s.max[1], livery).toBeCloseTo(5.74, 1);
      expect(s.max[2], livery).toBeCloseTo(1.51, 2);
      expect(s.max[0], livery).toBeLessThanOrEqual(7.9 + 1e-6);
      expect(findCoplanarOverlaps(m.toGlb("t")), livery).toEqual([]);
    }
  });

  it("paints the livery's bands, not one body colour", () => {
    const green = cd163Lod();
    for (const s of [-1, 1]) {
      expect(faceAt(green, 0, 1.4, s * 1.47, [0, 0, s])).toBe("green");
      expect(faceAt(green, 0, 2.0, s * 1.47, [0, 0, s])).toBe("yellow");
      expect(faceAt(green, 0, 3.0, s * 1.47, [0, 0, s])).toBe("green");
      expect(faceAt(green, 0, 3.6, s * 1.47, [0, 0, s])).toBe("roof"); // the grey side apron
    }
    for (const e of [-1, 1]) expect(faceAt(green, e * 7.85, 2.0, 0, [e, 0, 0])).toBe("yellow");
    // the 371 002 keeps its thin yellow line between the cream and the red
    expect(faceAt(cd263Lod({ livery: "cd371No002" }), 0, 2.1, 1.47, [0, 0, 1])).toBe("yellow");
  });

  it("keeps the 363 009's red cabs against the charcoal machine-room band", () => {
    const m = cd163Lod({ livery: "cd363No009" });
    expect(faceAt(m, 0, 2.8, 1.47, [0, 0, 1])).toBe("charcoal");
    expect(faceAt(m, 7.0, 2.8, 1.47, [0, 0, 1])).toBe("red");
    expect(faceAt(m, 7.8, 2.8, 0, [1, 0, 0])).toBe("red");
    expect(faceAt(m, 0, 1.1, -1.47, [0, 0, -1])).toBe("charcoal");
  });
});
