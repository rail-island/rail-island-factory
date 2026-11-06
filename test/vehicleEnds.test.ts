// A rail vehicle's ends seen from the front, as the game draws them (back faces
// culled): no hole through a nose's tip or an inside-out part, and a windscreen
// laid on a nose that the body does not poke through. Rays along x hit the end;
// a first hit on a face turned away from the ray is a hole the game shows
// through. A fixed sample, one design or more per body kit:
// the series kit (shinkansen.ts) and the carbody kit (carbodyKit.ts) that left
// a blunt nose's tip open, the box locomotive kit (boxLocoKit.ts) whose frame and
// roof boxes were inside out, and the Czech locomotives with their own roof
// boxes. See docs/models/vehicles.md, "Closed ends".

import { describe, expect, it } from "vitest";
import { designGlb } from "../generator/generate.ts";
import { readTriangles } from "../generator/renderGlbThumb.ts";
import type { Tri } from "../generator/glbTriangles.ts";
import { findCoplanarTriangles } from "../generator/coplanar.ts";

/** The first triangle along the ray from x = +-infinity at (y, z) toward the vehicle, e the end (+1 the +X end). */
function firstHit(tris: readonly Tri[], e: number, y: number, z: number): Tri | null {
  let best = -Infinity, hit: Tri | null = null;
  for (const t of tris) {
    const [a, b, c] = t.p;
    const det = (b[1] - a[1]) * (c[2] - a[2]) - (c[1] - a[1]) * (b[2] - a[2]);
    if (Math.abs(det) < 1e-12) continue;
    const u = ((y - a[1]) * (c[2] - a[2]) - (c[1] - a[1]) * (z - a[2])) / det;
    const v = ((b[1] - a[1]) * (z - a[2]) - (y - a[1]) * (b[2] - a[2])) / det;
    if (u < 0 || v < 0 || u + v > 1) continue;
    const x = e * (a[0] + u * (b[0] - a[0]) + v * (c[0] - a[0]));
    if (x > best + 1e-6) [best, hit] = [x, t];
  }
  return hit;
}

/** Whether t faces away from a ray running along -e x (more than grazing it). */
function turnedAway(t: Tri, e: number): boolean {
  const [a, b, c] = t.p;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return n[0]! * e < -0.3 * Math.hypot(n[0]!, n[1]!, n[2]!);
}

/** The triangles binned by 25 cm cells of (y, z), so a ray tests only its own cell's. */
function bins(tris: readonly Tri[]): (y: number, z: number) => readonly Tri[] {
  const C = 0.25, map = new Map<string, Tri[]>();
  for (const t of tris) {
    const ys = t.p.map((p) => p[1]), zs = t.p.map((p) => p[2]);
    for (let i = Math.floor(Math.min(...ys) / C); i <= Math.floor(Math.max(...ys) / C); i++)
      for (let j = Math.floor(Math.min(...zs) / C); j <= Math.floor(Math.max(...zs) / C); j++) {
        const k = `${i},${j}`;
        const list = map.get(k);
        if (list) list.push(t);
        else map.set(k, [t]);
      }
  }
  return (y, z) => map.get(`${Math.floor(y / C)},${Math.floor(z / C)}`) ?? [];
}

/** Rays that see a hole at end e, on a 4 cm grid over the end. */
function holes(tris: readonly Tri[], e: number): string[] {
  const cell = bins(tris.filter((t) => !t.doubleSided));
  const out: string[] = [];
  for (let y = 0.3; y < 4.8; y += 0.04)
    for (let z = -1.7; z <= 1.7; z += 0.04) {
      const t = firstHit(cell(y, z), e, y, z);
      if (t && turnedAway(t, e)) out.push(`(${y.toFixed(2)}, ${z.toFixed(2)}) ${t.material}`);
    }
  return out;
}

/** The +X windscreen's glass triangles whose middle the body hides from straight ahead. */
function coveredGlass(tris: readonly Tri[]): number {
  const maxX = Math.max(...tris.flatMap((t) => t.p.map((p) => p[0])));
  const glass = tris.filter((t) => t.material === "cabGlass" && t.p.every((p) => p[0] > maxX - 8));
  const front = glass.filter((t) => !turnedAway(t, 1));
  const cell = bins(tris);
  expect(front.length).toBeGreaterThan(0);
  let covered = 0;
  for (const t of front) {
    const y = (t.p[0][1] + t.p[1][1] + t.p[2][1]) / 3, z = (t.p[0][2] + t.p[1][2] + t.p[2][2]) / 3;
    const h = firstHit(cell(y, z), 1, y, z);
    if (h && h.material !== "cabGlass" && h.material !== "rubber") covered++;
  }
  return covered;
}

const CLOSED = [
  "proc-vehicle-ns-icng", "proc-vehicle-ns-flirt", "proc-vehicle-shinkansen-700", "proc-vehicle-sbb-giruno",
  "proc-vehicle-amtrak-acela", "proc-vehicle-budd-rdc",
  "proc-vehicle-db-111", "proc-vehicle-br-class-37", "proc-vehicle-sncf-bb22200",
  "proc-vehicle-cd-130", "proc-vehicle-cd-140", "proc-vehicle-cd-169", "proc-vehicle-db-212", "proc-vehicle-cd-704", "proc-vehicle-cd-714",
];

describe("rail vehicle ends", () => {
  for (const id of CLOSED)
    it(`${id} has no hole at either end`, () => {
      const tris = readTriangles(designGlb(id));
      // a hole is hundreds of rays; a ray or two may graze a thin rod end-on
      for (const e of [1, -1]) expect(holes(tris, e).length, `${id} ${e > 0 ? "front" : "rear"}: ${holes(tris, e).slice(0, 3).join(", ")}`).toBeLessThanOrEqual(4);
    });

  for (const id of ["proc-vehicle-ns-icng", "proc-vehicle-ns-flirt", "proc-vehicle-shinkansen-700"])
    it(`${id}'s windscreen lies on its nose, not under it`, () => {
      expect(coveredGlass(readTriangles(designGlb(id)))).toBe(0);
    });
});

describe("the coplanar guard far from the origin", () => {
  // a window's rubber 5 mm off the 0 series' sloping roof 20 m out (a 2-car train):
  // the rounded normal and offset once put both in one plane
  const roof = { p: [[20.149999618530273, 2.879990339279175, 1.4540194272994995], [19.950000762939453, 3.0467305183410645, 1.3874092102050781], [19.950000762939453, 2.9460959434509277, 1.4540194272994995]] as [number, number, number][], mat: "roof", name: "roof" };
  const rubber = { p: [[20.050825119018555, 2.9155397415161133, 1.4594125747680664], [19.951454162597656, 3.0506224632263184, 1.3917380571365356], [19.95076560974121, 2.948472261428833, 1.4594752788543701]] as [number, number, number][], mat: "rubber", name: "rubber" };
  const tri = (t: typeof roof) => ({ ...t, p: t.p as [[number, number, number], [number, number, number], [number, number, number]] });
  it("does not report faces that only round to one plane", () => {
    expect(findCoplanarTriangles([tri(roof), tri(rubber)], 1e-4)).toEqual([]);
  });
  it("still reports faces in one plane", () => {
    expect(findCoplanarTriangles([tri(roof), tri({ ...roof, mat: "rubber", name: "rubber" })], 1e-4)).toHaveLength(1);
  });
});
