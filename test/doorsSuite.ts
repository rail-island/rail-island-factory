// The per-vehicle door checks of test/doors.test.ts, as a suite a shard of the
// passenger vehicles runs (test/doors.test.ts runs the first quarter and the
// generic checks, doors-2..4.test.ts the others), so the workers share them.
// See docs/models/doors.md.

import { describe, expect, it } from "vitest";
import { DOOR_SAMPLES } from "../generator/doors.ts";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { glbStats } from "../generator/glbStats.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { buildLodModel } from "../generator/lodModel.ts";
import { swept, variantsUnderTest } from "./catalogCache";
import { isInteriorName } from "../generator/interiorTable.ts";
import { WORLD_TRAMS_RIGHT_ONLY, WORLD_TRAMS_WITHOUT_DOORS } from "../generator/worldTrams.ts";

/** The groups of passenger vehicles: every one opens its passenger doors. */
const PASSENGER_GROUPS = new Set(["coach", "unit", "tram", "metro", "bus"]);
/** Passenger-group designs with no door to open: a luggage van, a steam railcar whose van body draws none, the open-sided San Francisco cable car. */
const NO_DOORS = new Set(["proc-vehicle-csd-dsk", "proc-vehicle-csd-m112", "proc-vehicle-sf-cable-car", ...WORLD_TRAMS_WITHOUT_DOORS,
  // the jeepney and the songthaew board at their open rears; the camello's trailer is drawn without the kit's doors
  "proc-vehicle-jeepney", "proc-vehicle-songthaew", "proc-vehicle-havana-camello"]);
/** Doors on the right only: the single-ended trams and every bus (the kerb side). */
const RIGHT_ONLY = (id: string, group: string) => group === "bus" || WORLD_TRAMS_RIGHT_ONLY.has(id) || ["proc-vehicle-tatra-t3", "proc-vehicle-tatra-t6", "proc-vehicle-tatra-kt4", "proc-vehicle-kvag-gt4"].includes(id);

const groupOf = (d: (typeof ALL_VEHICLES)[number]) => d.catalog?.group ?? "";
const PASSENGER = swept(ALL_VEHICLES).filter((d) => PASSENGER_GROUPS.has(groupOf(d)) && !NO_DOORS.has(d.id));

/**
 * A passenger vehicle's default build, shared by the four checks that read it
 * (none changes it) and dropped after the last of them, "shows no gap through
 * its shut doors"; other designs and combinations are built afresh.
 */
const DEFAULT_BUILDS = new Map<string, ReturnType<(typeof ALL_VEHICLES)[number]["build"]>>();
function defaultBuild(d: (typeof ALL_VEHICLES)[number]): ReturnType<typeof d.build> {
  if (!PASSENGER.includes(d)) return d.build();
  let m = DEFAULT_BUILDS.get(d.id);
  if (!m) DEFAULT_BUILDS.set(d.id, (m = d.build()));
  return m;
}
const buildOf = (d: (typeof ALL_VEHICLES)[number], params: Record<string, string>, i: number) => (i === 0 ? defaultBuild(d) : d.build(params));

export function vehicleDoorSuite(index: number, count: number): void {
const mine = <T,>(list: readonly T[]): T[] => list.filter((_, i) => i % count === index);
describe("vehicle doors", () => {
  if (index === 0) it("open on every passenger vehicle, and on nothing else", () => {
    // a design opens doors when one of its variants does (a set's power car opens none)
    const opens = (d: (typeof ALL_VEHICLES)[number]) => variantsUnderTest(d).some((p, i) => buildOf(d, p, i).animations().some((c) => c.drive.drive === "door"));
    const withDoors = swept(ALL_VEHICLES).filter(opens).map((d) => d.id);
    expect(withDoors.sort()).toEqual(PASSENGER.map((d) => d.id).sort());
    expect(PASSENGER.length).toBeGreaterThan(40);
  });

  for (const d of mine(PASSENGER)) {
    const sides = RIGHT_ONLY(d.id, groupOf(d)) ? ["right"] : ["left", "right"];
    variantsUnderTest(d).forEach((params, i) => {
      it(`${d.id} ${JSON.stringify(params)} opens its passenger doors on each side, shut at rest`, () => {
        const m = buildOf(d, params, i);
        const glb = m.toGlb(d.title, d.id);
        const doors = m.animations().map((c, i) => ({ c, i })).filter(({ c }) => c.drive.drive === "door");
        // a variant may have none to open (a luggage van, a power car with crew doors only)
        if (doors.length) expect(new Set(doors.map(({ c }) => (c.drive as { side: string }).side))).toEqual(new Set(sides));
        for (const { c, i } of doors) {
          expect(c.name).toMatch(/^doors-(left|right)(-.+)?$/);
          expect(sampleCount(glb, i)).toBe(DOOR_SAMPLES + 1);
        }
        // every clip's first sample is the model at rest: posed shut all at once (one
        // measurement, not one per clip: a set has sixteen), it keeps the rest bounds
        if (doors.length) {
          let shutGlb = glb;
          for (const { i } of doors) shutGlb = poseGlb(shutGlb, 0, i);
          const [shut, rest] = [glbStats(shutGlb), glbStats(glb)];
          for (const k of [0, 1, 2]) {
            expect(shut.min[k]).toBeCloseTo(rest.min[k]!, 5);
            expect(shut.max[k]).toBeCloseTo(rest.max[k]!, 5);
          }
        }
        // half open and open, with every door at once and the interior shown, nothing z-fights
        for (const k of [DOOR_SAMPLES / 2, DOOR_SAMPLES]) {
          let posed = glb;
          for (const { i } of doors) posed = poseGlb(posed, k, i);
          expect(findCoplanarOverlaps(posed, undefined, { interiors: true })).toEqual([]);
        }
        // the low level of detail stays shut and still
        expect(buildLodModel(d, params).animations().filter((c) => c.drive.drive === "door")).toHaveLength(0);
      });
    });
  }
});

/**
 * The nearest triangle of `m` a ray along -s z through (x, y) meets from outside,
 * among those `keep` admits and facing the ray (as three.js culls back faces);
 * with `near`, only on the ray's own half of the car.
 */
function firstHit(m: { groups: Map<string, { pos: number[]; nrm: number[]; part: number[] }> }, x: number, y: number, s: number, keep: (part: number) => boolean, near = false): { z: number; mat: string; part: number } | null {
  let hit: { z: number; mat: string; part: number } | null = null;
  for (const [mat, g] of m.groups)
    for (let t = 0; t < g.part.length; t++) {
      if (!keep(g.part[t]!) || g.nrm[t * 9 + 2]! * s <= 0) continue;
      const p = g.pos.slice(t * 9, t * 9 + 9);
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = p as [number, number, number, number, number, number, number, number, number];
      const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(den) < 1e-12) continue;
      const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den;
      const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den;
      if (u < 0 || v < 0 || u + v > 1) continue;
      const z = u * az + v * bz + (1 - u - v) * cz;
      if ((!near || z * s > 0) && (!hit || z * s > hit.z * s)) hit = { z, mat, part: g.part[t]! };
    }
  return hit;
}

/** The triangles of `m` that reach into x0..x1 and span height y: what a ray across that span can meet. */
function slab(m: Internals, x0: number, x1: number, y: number): Pick<Internals, "groups"> {
  const groups = new Map<string, { pos: number[]; nrm: number[]; part: number[] }>();
  for (const [mat, g] of m.groups) {
    const out = { pos: [] as number[], nrm: [] as number[], part: [] as number[] };
    for (let t = 0; t < g.part.length; t++) {
      const xs = [0, 3, 6].map((c) => g.pos[t * 9 + c]!);
      const ys = [1, 4, 7].map((c) => g.pos[t * 9 + c]!);
      if (Math.max(...xs) < x0 || Math.min(...xs) > x1 || Math.max(...ys) < y || Math.min(...ys) > y) continue;
      out.pos.push(...g.pos.slice(t * 9, t * 9 + 9));
      out.nrm.push(...g.nrm.slice(t * 9, t * 9 + 9));
      out.part.push(g.part[t]!);
    }
    if (out.part.length) groups.set(mat, out);
  }
  return { groups };
}

/** A built model's internals, for the ray tests. */
type Internals = { groups: Map<string, { pos: number[]; nrm: number[]; part: number[] }>; parts: Array<{ name: string }>; palette: Record<string, { color?: string }> };

/** Each door leaf part's bounds at rest, by part index. */
function leafBoxes(m: Internals): Map<number, { min: number[]; max: number[] }> {
  const isLeaf = (part: number) => part >= 0 && /(^|\/)door\d+-\d+$/.test(m.parts[part]!.name);
  const leaves = new Map<number, { min: number[]; max: number[] }>();
  for (const g of m.groups.values())
    for (let t = 0; t < g.part.length; t++) {
      if (!isLeaf(g.part[t]!)) continue;
      const box = leaves.get(g.part[t]!) ?? { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      for (let c = 0; c < 3; c++)
        for (let k = 0; k < 3; k++) {
          box.min[k] = Math.min(box.min[k]!, g.pos[t * 9 + c * 3 + k]!);
          box.max[k] = Math.max(box.max[k]!, g.pos[t * 9 + c * 3 + k]!);
        }
      leaves.set(g.part[t]!, box);
    }
  return leaves;
}

describe("every doorway", () => {
  // Looking in through a door: the first face a ray from outside at the leaf's
  // middle meets, past the door's own leaves and as three.js draws it (back faces
  // culled), is the cabin's -- the shell is cut open behind the leaves
  // (docs/models/interiors.md), never the body's paint or a dark box -- or, where
  // a door faces it across the car, that door's shut leaf.
  for (const d of mine(PASSENGER)) {
    it(`${d.id} opens every door leaf onto its cabin`, () => {
      const m = defaultBuild(d) as unknown as Internals;
      const leaves = leafBoxes(m);
      const doorOf = (part: number) => m.parts[part]!.name.replace(/-\d+$/, "");
      for (const [part, box] of leaves) {
        const [x, y] = [(box.min[0]! + box.max[0]!) / 2, (box.min[1]! + box.max[1]!) * 0.4];
        const s = Math.sign(box.min[2]! + box.max[2]!);
        const hit = firstHit(m, x, y, s, (p) => !(leaves.has(p) && doorOf(p) === doorOf(part)));
        const name = hit && hit.part >= 0 ? m.parts[hit.part]!.name : "";
        const ok = !!hit && (isInteriorName(name) || (leaves.has(hit.part) && hit.z * s < 0));
        expect(ok, `${hit?.mat ?? "nothing"} (${name}) behind leaf ${m.parts[part]!.name}`).toBe(true);
      }
    });
  }
});

describe("shut doors over a doorway", () => {
  // Regression: with the shell cut open and the cabin hidden while the doors are
  // shut, the gap between two leaves looked straight through the car. A dark strip
  // riding on a leaf now covers it, as the dark vestibule or panel used to: rays
  // across each shut door, 5 mm apart, all meet the door on its own half of the car.
  for (const d of mine(swept(ALL_VEHICLES).filter((v) => PASSENGER_GROUPS.has(groupOf(v)) && !NO_DOORS.has(v.id)))) {
    it(`${d.id} shows no gap through its shut doors`, () => {
      const m = defaultBuild(d) as unknown as Internals;
      DEFAULT_BUILDS.delete(d.id);
      const doors = new Map<string, { min: number[]; max: number[] }>();
      for (const [part, box] of leafBoxes(m)) {
        const key = m.parts[part]!.name.replace(/-\d+$/, "");
        const u = doors.get(key) ?? { min: [...box.min], max: [...box.max] };
        for (let k = 0; k < 3; k++) [u.min[k], u.max[k]] = [Math.min(u.min[k]!, box.min[k]!), Math.max(u.max[k]!, box.max[k]!)];
        doors.set(key, u);
      }
      for (const [name, u] of doors) {
        const s = Math.sign(u.min[2]! + u.max[2]!);
        const y = (u.min[1]! + u.max[1]!) / 2;
        // only the triangles across this door's span and height can meet its rays
        const near = slab(m, u.min[0]!, u.max[0]!, y);
        for (let x = u.min[0]! + 0.003; x < u.max[0]! - 0.003; x += 0.005) {
          const hit = firstHit(near, x, y, s, (p) => !(p >= 0 && isInteriorName(m.parts[p]!.name)), true);
          expect(hit, `${name}: nothing at x ${x.toFixed(3)}`).not.toBeNull();
        }
      }
    });
  }
});
}
