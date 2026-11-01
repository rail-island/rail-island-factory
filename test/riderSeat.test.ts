// The rider seat the build measures on every vehicle (generator/riderSeat.ts,
// docs/models/rider-seat.md): on the roof, in the head section, as near the front
// as the roof allows, clear of pantographs and roof equipment, never inside.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, catalogFields, vehicleSeat } from "../generator/generate.ts";
import { readTriangles } from "../generator/renderGlbThumb.ts";
import { gameYaw, heightMap, riderSeat, seatOnMap } from "../generator/riderSeat.ts";
import type { Tri, Vec3 } from "../generator/glbTriangles.ts";
import { exportVehicleMeta } from "../generator/catalog.ts";
import { glbOf } from "./catalogCache";

type T3 = readonly [Vec3, Vec3, Vec3];

/** An axis-aligned box's six faces as triangles. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): T3[] {
  const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
  const quad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3): T3[] => [[a, b, c], [a, c, d]];
  return [
    ...quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)), // top
    ...quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)), // bottom
    ...quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)),
    ...quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)),
    ...quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0)),
    ...quad(p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0)),
  ];
}

const asTris = (list: T3[]): Tri[] => list.map((p) => ({ p: [p[0], p[1], p[2]], n: [[0, 1, 0], [0, 1, 0], [0, 1, 0]], color: [1, 1, 1], material: "body" }));

describe("seatOnMap (the vehicle frame: nose at min X)", () => {
  it("sits at the front of a plain roof", () => {
    const seat = seatOnMap(heightMap(box(-10, 10, 0, 4, -1.5, 1.5)));
    expect(seat[0]).toBeLessThan(-8.5);
    expect(seat[1]).toBeCloseTo(4, 6);
    expect(seat[2]).toBe(0);
  });

  it("keeps clear of a pantograph over the front of the roof, sitting just behind it", () => {
    const seat = seatOnMap(heightMap([...box(-10, 10, 0, 4, -1.5, 1.5), ...box(-9.5, -6.5, 4, 5.5, -0.8, 0.8)]));
    expect(seat[0]).toBeGreaterThan(-6.5 + 0.3 + 0.4 - 1e-6);
    expect(seat[0]).toBeLessThan(-4);
    expect(seat[1]).toBeCloseTo(4, 6);
  });

  it("leaves a low buffer beam or bonnet for the roof", () => {
    const seat = seatOnMap(heightMap([...box(-12, -10, 0, 1.2, -1.5, 1.5), ...box(-10, 10, 0, 4, -1.5, 1.5)]));
    expect(seat[1]).toBeCloseTo(4, 6);
    expect(seat[0]).toBeGreaterThan(-10);
    expect(seat[0]).toBeLessThan(-8);
  });

  it("is not lifted by a tall fin: the roof is the centreline's typical height", () => {
    // a fuselage at 4 with a fin at the tail reaching 9
    const seat = seatOnMap(heightMap([...box(-15, 15, 0, 4, -2, 2), ...box(12, 15, 4, 9, -0.2, 0.2)]));
    expect(seat[1]).toBeCloseTo(4, 6);
    expect(seat[0]).toBeLessThan(-13);
  });
});

describe("riderSeat (the model's own frame)", () => {
  it("turns into the game's frame and back: a rail vehicle built nose-first along +X sits at its +X end", () => {
    const seat = riderSeat(asTris(box(-10, 10, 0, 4, -1.5, 1.5)), gameYaw("Rail vehicles", undefined));
    expect(seat[0]).toBeGreaterThan(8.5);
    expect(seat[1]).toBe(4);
  });

  it("takes an aircraft's or a ship's own yaw", () => {
    expect(gameYaw("Aircraft", 180)).toBe(180);
    expect(gameYaw("Ships", 0)).toBe(0);
    expect(gameYaw("Road vehicles", undefined)).toBe(180);
    const seat = riderSeat(asTris(box(-10, 10, 0, 4, -1.5, 1.5)), 0);
    expect(seat[0]).toBeLessThan(-8.5);
  });
});

describe("the measured seats", () => {
  // the pantograph cars, the head of the head section: a sample that keeps the suite fast
  const SAMPLE = ["proc-vehicle-cd-150", "proc-vehicle-tatra-t3", "proc-vehicle-karosa-short", "proc-vehicle-legacy-covered-wagon"];
  for (const id of SAMPLE) {
    it(`${id} sits on its roof in the front half, clear of its pantographs`, () => {
      const d = ALL_VEHICLES.find((v) => v.id === id)!;
      const glb = glbOf(id);
      const seat = vehicleSeat(d, glb);
      const tris = readTriangles(glb);
      let x0 = Infinity, x1 = -Infinity, top = -Infinity;
      for (const t of tris) for (const p of t.p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
      // nose-first along +X: the front half is the +X half
      expect(seat[0]).toBeGreaterThan((x0 + x1) / 2);
      // on the top surface there: nothing of the body above the seat under it
      for (const t of tris) {
        for (const p of t.p) if (Math.abs(p[0] - seat[0]) < 0.3 && Math.abs(p[2] - seat[2]) < 0.25) top = Math.max(top, p[1]);
      }
      expect(seat[1]).toBeGreaterThanOrEqual(top - 0.26);
      // no pantograph over the seat or right beside it
      for (const t of tris.filter((t) => /pantograph/i.test(t.material))) {
        for (const p of t.p) {
          const near = Math.abs(p[0] - seat[0]) < 0.4 + 0.3 && Math.abs(p[2] - seat[2]) < 0.3 + 0.2;
          if (near) expect(p[1]).toBeLessThanOrEqual(seat[1] + 0.15 + 1e-6);
        }
      }
    });
  }

  it("is exported on a vehicle's meta entry, in the model's frame", () => {
    const d = ALL_VEHICLES.find((v) => v.id === "proc-vehicle-cd-150")!;
    const seat = vehicleSeat(d, glbOf(d.id));
    const meta = exportVehicleMeta([d], new Map(), new Map(), new Map([[d.id, seat]]));
    expect(meta.vehicles[0]!.rider).toEqual(seat);
    expect(catalogFields(d).category).toBe("Rail vehicles");
  });
});
