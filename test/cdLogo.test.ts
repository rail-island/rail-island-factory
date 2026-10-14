// The CD emblem (generator/cdLogo.ts): its outlines and their triangulation.

import { describe, expect, it } from "vitest";
import { CD_EMBLEM, CD_EMBLEM_ASPECT, triangulate } from "../generator/cdLogo";

type P = readonly [number, number];

function area(poly: ReadonlyArray<P>): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

describe("the CD emblem", () => {
  it("is three counter-clockwise outlines, one unit high (to half a percent) and CD_EMBLEM_ASPECT wide", () => {
    expect(CD_EMBLEM.length).toBe(3);
    for (const poly of CD_EMBLEM) expect(area(poly)).toBeGreaterThan(0);
    const all = CD_EMBLEM.flat();
    expect(Math.min(...all.map((p) => p[1]))).toBeCloseTo(0, 2);
    expect(Math.max(...all.map((p) => p[1]))).toBeCloseTo(1, 2);
    expect(Math.min(...all.map((p) => p[0]))).toBeCloseTo(0, 2);
    expect(Math.max(...all.map((p) => p[0]))).toBeCloseTo(CD_EMBLEM_ASPECT, 4);
  });

  // ear clipping covers the outline exactly: n - 2 counter-clockwise triangles
  // whose areas add up to the polygon's
  it.each(CD_EMBLEM.map((poly, i) => [i, poly] as const))("triangulates outline %i exactly", (_, poly) => {
    const t = triangulate(poly);
    expect(t.length).toBe(3 * (poly.length - 2));
    let sum = 0;
    for (let i = 0; i < t.length; i += 3) {
      const tri = [poly[t[i]!]!, poly[t[i + 1]!]!, poly[t[i + 2]!]!];
      const a = area(tri);
      expect(a).toBeGreaterThanOrEqual(0);
      sum += a;
    }
    expect(sum).toBeCloseTo(area(poly), 9);
  });

  it("refuses a clockwise outline", () => {
    expect(() => triangulate([...CD_EMBLEM[0]!].reverse())).toThrow();
  });
});
