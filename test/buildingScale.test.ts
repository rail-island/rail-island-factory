// Human-scale details of the buildings: doors, steps and storeys that keep the
// same metre scale as the village and street houses (3-3.3 m storeys, 2.2-2.5 m
// doors). Each case was once out of scale -- a 6.2 m village-church door on
// 30 cm risers, Prague station wing windows 0.4 m apart from one storey to the
// next, a 1.7 m upper storey on the station pavilion, a 4 m door in a small
// stone tower, 55 cm risers up to St Basil's terrace and 1.7 m gallery arches
// under it, one window panel per two storeys on the brick high-rise, St Nicholas'
// dome 5 m under its towers instead of 1 m.

import { describe, expect, it } from "vitest";
import { baroqueChurch } from "../generator/churches";
import { stBasilsCathedral, stNicholasChurch } from "../generator/cathedrals";
import { brickResidential } from "../generator/skyscrapers";
import { pragueMainStation, stationBuilding } from "../generator/stations";
import { stoneTower, watchTower } from "../generator/towers";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import type { MeshBuilder } from "../generator/meshBuilder";

function tris(m: MeshBuilder, material: string, keep: (p: number[]) => boolean): Tri[] {
  const { json, bin } = parseGlb(m.toGlb("test"));
  return collectTriangles(json, bin).filter((t) => t.material === material && t.p.every(keep));
}

const ys = (ts: Tri[]): number[] => ts.flatMap((t) => t.p.map((p) => p[1]));

/** The vertical spans of the triangles, merged where they overlap: one per row of windows. */
function rows(ts: Tri[]): Array<[number, number]> {
  const spans = ts.map((t) => [Math.min(...t.p.map((p) => p[1])), Math.max(...t.p.map((p) => p[1]))] as [number, number]).sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && s[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], s[1]);
    else out.push([...s]);
  }
  return out;
}

describe("building scale", () => {
  it("the baroque church has a door of about 4 m and stair risers of 15 cm", () => {
    const m = baroqueChurch();
    const door = ys(tris(m, "slate", ([, y, z]) => z! > 9 && y! < 12));
    expect(Math.max(...door) - Math.min(...door)).toBeLessThanOrEqual(4.5);
    const treads = tris(m, "stone", ([x, , z]) => z! > 11.6 && Math.abs(x!) <= 3.21).filter((t) => t.n[0][1] > 0.99);
    const levels = [...new Set(ys(treads).map((y) => Math.round(y * 1000) / 1000))].sort((a, b) => a - b);
    // from the street (0) up to the 3 m terrace
    const steps = [0, ...levels, 3];
    for (let i = 1; i < steps.length; i++) expect(steps[i]! - steps[i - 1]!).toBeLessThanOrEqual(0.2);
  });

  it("the Prague main station wings keep a floor slab and a sill zone between window rows", () => {
    const glass = tris(pragueMainStation(), "glazing", ([x, y, z]) => Math.abs(x!) > 20 && z! > 6.8 && y! > 3 && y! < 16);
    const r = rows(glass);
    expect(r.length).toBe(3);
    for (let i = 1; i < r.length; i++) expect(r[i]![0] - r[i - 1]![1]).toBeGreaterThanOrEqual(1);
  });

  it("the station building's pavilion has a full upper storey", () => {
    const m = stationBuilding();
    const eaves = Math.min(...ys(tris(m, "tile", ([x, y, z]) => x! > -4.1 && x! < 3.5 && z! > -5.7 && z! < 3.4 && y! > 6)));
    expect(eaves - 4.01).toBeGreaterThanOrEqual(2.5);
    const upper = ys(tris(m, "glass", ([x, y, z]) => x! > -3.4 && x! < 2.8 && z! > 2.7 && y! > 4.02 && y! < eaves));
    expect(Math.max(...upper) - Math.min(...upper)).toBeGreaterThanOrEqual(1.3);
  });

  it.each([["stone", stoneTower], ["watch", watchTower]] as const)("the %s tower's ground door is at most 3 m tall", (_, build) => {
    const door = ys(tris(build(), "dark", ([, y]) => y! < 5));
    expect(Math.max(...door) - Math.min(...door)).toBeLessThanOrEqual(3);
  });

  it("St Basil's front stair has risers under 20 cm and the gallery arches are about 2 m tall", () => {
    const m = stBasilsCathedral();
    const treads = tris(m, "stone", ([x, , z]) => z! > 11.2 && Math.abs(x!) <= 3.11).filter((t) => t.n[0][1] > 0.99);
    const levels = [...new Set(ys(treads).map((y) => Math.round(y * 1000) / 1000))].sort((a, b) => a - b);
    const steps = [0, ...levels, 3.94];
    for (let i = 1; i < steps.length; i++) expect(steps[i]! - steps[i - 1]!).toBeLessThanOrEqual(0.2);
    const arches = rows(tris(m, "window", ([, y]) => y! < 3.5));
    expect(arches.length).toBe(1);
    expect(arches[0]![1] - arches[0]![0]).toBeGreaterThanOrEqual(1.9);
  });

  it("the brick high-rise has a window panel on every storey, facing out", () => {
    const panels = tris(brickResidential(), "glass", ([, y]) => y! > 7);
    const r = rows(panels);
    for (let i = 1; i < r.length; i++) expect(r[i]![0] - r[i - 1]![0]).toBeCloseTo(3.2, 3);
    for (const t of panels) {
      const cx = (t.p[0][0] + t.p[1][0] + t.p[2][0]) / 3;
      const cz = (t.p[0][2] + t.p[1][2] + t.p[2][2]) / 3;
      expect(t.n[0][0] * cx + t.n[0][2] * cz).toBeGreaterThan(0);
    }
  });

  it("St Nicholas' dome stands about 1 m under the towers, as on the real church", () => {
    const gilt = tris(stNicholasChurch(), "gilt", () => true);
    const near = (x: number) => ys(gilt.filter((t) => t.p.every((p) => Math.abs(p[0]! - x) < 1 && Math.abs(p[2]!) < 1)));
    const dome = Math.max(...near(2.27));
    const towers = Math.max(...ys(gilt));
    expect(towers - dome).toBeGreaterThan(0.5);
    expect(towers - dome).toBeLessThan(1.5);
  });
});
