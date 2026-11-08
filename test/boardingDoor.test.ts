// The boarding door the build measures on every aeroplane (generator/boardingDoor.ts,
// docs/models/boarding-door.md): the forward left main-deck door, where the game's
// jet bridge docks.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, aircraftDoor, catalogFields, measuresDoor } from "../generator/generate.ts";
import { boardingDoor, doorOfPanels, leftDoorPanels } from "../generator/boardingDoor.ts";
import { gameYaw } from "../generator/riderSeat.ts";
import { exportVehicleMeta } from "../generator/catalog.ts";
import { BUILD_CACHE_DIR, type DesignFacts } from "../generator/buildCache.ts";

/** A design's committed build facts (build-cache/facts/<id>.json). */
const factsOf = (id: string): DesignFacts =>
  (JSON.parse(fs.readFileSync(path.join(BUILD_CACHE_DIR, "facts", `${id}.json`), "utf8")) as { facts: DesignFacts }).facts;
import type { Tri, Vec3 } from "../generator/glbTriangles.ts";
import { glbOf } from "./catalogCache";

type T3 = readonly [Vec3, Vec3, Vec3];

/** A flat panel on the side plane z = `z`, as two triangles. */
function panel(x0: number, x1: number, y0: number, y1: number, z: number): T3[] {
  return [[[x0, y0, z], [x1, y0, z], [x1, y1, z]], [[x0, y0, z], [x1, y1, z], [x0, y1, z]]];
}
const asTris = (list: T3[], material = "door"): Tri[] =>
  list.map((p) => ({ p: [p[0], p[1], p[2]], n: [[0, 0, 1], [0, 0, 1], [0, 0, 1]], color: [1, 1, 1], material }));

describe("doorOfPanels (the vehicle frame: nose at min X, left at +Z)", () => {
  it("takes the front-most left door, at the middle of its sill on the skin", () => {
    const door = doorOfPanels(leftDoorPanels([...panel(-14, -13, 2.4, 4.3, 1.9), ...panel(11, 12, 2.4, 4.3, 1.9)]));
    expect(door).toEqual([-13.5, 2.4, 1.9]);
  });

  it("ignores the right side", () => {
    const door = doorOfPanels(leftDoorPanels([...panel(-14, -13, 2.4, 4.3, -1.9), ...panel(5, 6, 2.4, 4.3, 1.9)]));
    expect(door?.[0]).toBe(5.5);
  });

  it("leaves a landing gear's wide, low door for the passenger door behind it", () => {
    // gear doors ahead of the cabin door, lower and wide
    const door = doorOfPanels(leftDoorPanels([...panel(-20, -18.6, 1.4, 2.3, 2.5), ...panel(-10, -9, 4.6, 7, 3.2)]));
    expect(door).toEqual([-9.5, 4.6, 3.2]);
  });

  it("keeps to the main deck: an upper-deck door further forward does not win", () => {
    const door = doorOfPanels(leftDoorPanels([...panel(-18, -17, 7.3, 9.2, 2.6), ...panel(-25.5, -24.5, 4.75, 6.6, 3.4).map((t) => t), ...panel(-30, -29, 7.3, 9.2, 2.6)]));
    expect(door).toEqual([-25, 4.75, 3.4]);
  });

  it("is null without an upright panel", () => {
    expect(doorOfPanels(leftDoorPanels([]))).toBeNull();
    expect(doorOfPanels(leftDoorPanels(panel(-3, 0, 1, 1.8, 2)))).toBeNull();
  });
});

describe("boardingDoor (the model's own frame)", () => {
  it("reads only the door material, and turns into the game's frame and back", () => {
    // an aircraft built nose along +X, turned 180 by the game: its left is the model's -Z
    const tris = [...asTris(panel(13, 14, 2, 4, -1.9)), ...asTris(panel(-14, -13, 2, 4, -1.9), "glass")];
    expect(boardingDoor(tris, 180)).toEqual([13.5, 2, -1.9]);
    expect(boardingDoor(tris, 0)).toBeNull();
  });
});

describe("the measured doors", () => {
  const aircraft = ALL_VEHICLES.filter((d) => catalogFields(d).category === "Aircraft");

  it("are measured on the aeroplanes only", () => {
    expect(aircraft.filter(measuresDoor).length).toBeGreaterThan(90);
    for (const d of aircraft.filter((a) => a.game?.aircraftKind === "helicopter")) expect(measuresDoor(d)).toBe(false);
    expect(ALL_VEHICLES.filter((d) => !aircraft.includes(d)).some(measuresDoor)).toBe(false);
  });

  // a hand-built airliner with landing gear doors drawn in the same material, a kit airliner and a double-decker
  for (const id of ["proc-vehicle-boeing-747", "proc-vehicle-airbus-a320", "proc-vehicle-airbus-a380"]) {
    it(`${id}: the forward left door, ahead of a fifth of the body, on the skin`, () => {
      const d = ALL_VEHICLES.find((v) => v.id === id)!;
      const door = aircraftDoor(d, glbOf(id));
      expect(door).not.toBeNull();
      const f = catalogFields(d);
      // into the game's frame: nose at min X, left at +Z
      const r = (gameYaw(f.category, f.yaw) * Math.PI) / 180;
      const x = door![0] * Math.cos(r) + door![2] * Math.sin(r);
      const z = -door![0] * Math.sin(r) + door![2] * Math.cos(r);
      const facts = factsOf(id);
      expect(facts.door).toEqual(door);
      // the cached bounds are the model's own frame; the length is the larger plan extent
      const len = Math.max(facts.stats.max[0]! - facts.stats.min[0]!, facts.stats.max[2]! - facts.stats.min[2]!);
      const nose = -len / 2;
      expect((x - nose) / len).toBeGreaterThan(0.03);
      expect((x - nose) / len).toBeLessThan(0.2);
      expect(z).toBeGreaterThan(1);
      expect(door![1]).toBeGreaterThan(1.5);
    });
  }

  it("every aeroplane's cached door lies on its body's left side, inside its bounds", () => {
    for (const d of aircraft.filter(measuresDoor)) {
      const facts = factsOf(d.id);
      expect(facts.door, d.id).not.toBeUndefined();
      if (!facts.door) continue;
      for (let i = 0; i < 3; i++) {
        expect(facts.door[i]!, `${d.id} axis ${i}`).toBeGreaterThanOrEqual(facts.stats.min[i]! - 0.05);
        expect(facts.door[i]!, `${d.id} axis ${i}`).toBeLessThanOrEqual(facts.stats.max[i]! + 0.05);
      }
    }
  });

  it("is exported on an aeroplane's meta entry, in the model's frame", () => {
    const d = ALL_VEHICLES.find((v) => v.id === "proc-vehicle-airbus-a320")!;
    const door = aircraftDoor(d, glbOf(d.id))!;
    const meta = exportVehicleMeta([d], new Map(), new Map(), new Map(), new Map([[d.id, door]]));
    expect(meta.vehicles[0]!.door).toEqual(door);
  });
});
