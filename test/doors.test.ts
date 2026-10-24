// Passenger doors that open (generator/doors.ts): the leaves' motions, `openable`
// turning a door drawn at any opening into moving leaf parts of its side's `door`
// clip with the shut pose at rest, and the trams, coaches and units that have
// them. See docs/models/doors.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import type { MeshCore, Vec3 } from "../generator/meshCore.ts";
import { DOOR_FOLD_ANGLE, DOOR_PLUG_OUT, DOOR_SAMPLES, doorLeaves, openable, type DoorMotion } from "../generator/doors.ts";
import { liftable } from "../generator/liftable.ts";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { parseGlb } from "../generator/glbParse.ts";
import { glbStats } from "../generator/glbStats.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { buildLodModel } from "../generator/lodModel.ts";
import { variantsUnderTest } from "./catalogCache";
import { Coach, type Volume } from "../generator/csdCoachParts.ts";

const PALETTE = { body: { color: "#808080" }, leaf: { color: "#c03030" }, arm: { color: "#303030" } };

/** A box car 1 m either side of x = 0 with a 1.2 m door on side s, drawn at opening o. */
function car(m: MeshCore, s: number, o: number, motion: DoorMotion): void {
  for (const l of doorLeaves(-0.6, 0.6, s, motion)) m.moved(l.move(o, s * 1.01), () => m.box("leaf", (l.x0 + l.x1) / 2, s * 1.01, l.x1 - l.x0, 0.01, 0.2, 2));
}

function built<T extends MeshBuilder | ThreeMeshBuilder>(m: T, motion: DoorMotion, sides = [1]): T {
  m.box("body", 0, 0, 4, 2, 0, 2.5);
  for (const s of sides) openable(m, (mm, o) => car(mm, s, o, motion));
  return m;
}

/** Every triangle corner of a built group, world space. */
function corners(root: THREE.Object3D): THREE.Vector3[] {
  root.updateMatrixWorld(true);
  const out: THREE.Vector3[] = [];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  return out;
}

/** Whether two groups draw the same corners, each within 0.1 mm of one of the other's. */
function samePose(a: THREE.Object3D, b: THREE.Object3D): boolean {
  const [p, q] = [corners(a), corners(b)];
  const near = (u: THREE.Vector3[], v: THREE.Vector3[]) => u.every((x) => v.some((y) => x.distanceTo(y) < 1e-4));
  return p.length === q.length && near(p, q) && near(q, p);
}

function plain(o: number, motion: DoorMotion, sides = [1]): THREE.Group {
  const m = new ThreeMeshBuilder(PALETTE);
  m.box("body", 0, 0, 4, 2, 0, 2.5);
  for (const s of sides) car(m, s, o, motion);
  return m.toGroup(THREE);
}

describe("door leaves", () => {
  const motions: DoorMotion[] = [
    { kind: "fold", leaves: 2 },
    { kind: "fold", leaves: 3, from: "high" },
    { kind: "fold", leaves: 4 },
    { kind: "swing", leaves: 1, from: "high" },
    { kind: "swing", leaves: 2 },
    { kind: "plug", leaves: 1, toward: "high" },
    { kind: "plug", leaves: 2 },
  ];
  for (const motion of motions) {
    it(`${JSON.stringify(motion)}: fill the door, stand still shut`, () => {
      const leaves = doorLeaves(0, 1.2, 1, motion);
      expect(leaves).toHaveLength(motion.leaves);
      expect(leaves[0]!.x0).toBe(0);
      expect(leaves[leaves.length - 1]!.x1).toBeCloseTo(1.2, 9);
      for (const l of leaves) {
        const p: Vec3 = [l.x0, 1, 1];
        l.move(0, 1)(p).forEach((v, k) => expect(v).toBeCloseTo(p[k]!, 9));
      }
    });
  }

  it("fold inward, the second leaf's free edge kept on the door line", () => {
    const [a, b] = doorLeaves(0, 1, 1, { kind: "fold", leaves: 2 });
    const hz = 1;
    // the first leaf's free edge turns inward (toward -z on the +z side) about the jamb
    const tipA = a!.move(1, hz)([a!.x1, 1, hz]);
    expect(tipA[2]).toBeCloseTo(hz - a!.x1 * Math.sin(DOOR_FOLD_ANGLE), 9);
    // the second leaf's hinge edge meets it there, its free edge stays at z = hz
    const hingeB = b!.move(1, hz)([b!.x0, 1, hz]);
    const freeB = b!.move(1, hz)([b!.x1, 1, hz]);
    expect(hingeB[0]).toBeCloseTo(b!.x0 * Math.cos(DOOR_FOLD_ANGLE), 9);
    expect(freeB[2]).toBeCloseTo(hz - (b!.x0 - a!.x1) * Math.sin(DOOR_FOLD_ANGLE), 9);
    expect(freeB[0]).toBeLessThan(b!.x1);
  });

  it("plug: step out, then slide apart by a leaf's width", () => {
    const [a, b] = doorLeaves(0, 1.2, -1, { kind: "plug", leaves: 2 });
    const p: Vec3 = [0.3, 1, -1];
    expect(a!.move(0.25, -1)(p)).toEqual([0.3, 1, -1 - DOOR_PLUG_OUT]);
    const open = a!.move(1, -1)(p);
    expect(open[0]).toBeCloseTo(0.3 - (a!.x1 - a!.x0) - 0.012, 9);
    expect(open[2]).toBeCloseTo(-1 - DOOR_PLUG_OUT, 9);
    expect(b!.move(1, -1)([0.9, 1, -1])[0]).toBeGreaterThan(1.2);
  });
});

describe("openable doors", () => {
  const fold: DoorMotion = { kind: "fold", leaves: 4 };

  it("draw the shut pose at rest, the leaves as parts", () => {
    const g = built(new ThreeMeshBuilder(PALETTE), fold).toGroup(THREE);
    expect(samePose(g, plain(0, fold))).toBe(true);
    expect(g.children.filter((c) => !(c instanceof THREE.Mesh)).map((c) => c.name)).toEqual(["door1-1", "door1-2", "door1-3", "door1-4"]);
  });

  it("carry a door clip per side, from shut at 0 to open at 1", () => {
    const g = built(new ThreeMeshBuilder(PALETTE), fold, [1, -1]).toGroup(THREE);
    expect(g.userData.clipDrives).toEqual({ "doors-right": { drive: "door", side: "right" }, "doors-left": { drive: "door", side: "left" } });
    const mixer = new THREE.AnimationMixer(g);
    for (const clip of g.animations) {
      expect(clip.tracks[0]!.times.length).toBe(DOOR_SAMPLES + 1);
      mixer.clipAction(clip).play();
    }
    for (const o of [0, 0.5, 1]) {
      for (const a of g.animations) mixer.clipAction(a).time = o;
      mixer.update(0);
      expect(samePose(g, plain(o, fold, [1, -1]))).toBe(true);
    }
  });

  it("join every door of a side into one clip, numbered apart from the pantographs", () => {
    const m = new MeshBuilder(PALETTE);
    m.box("body", 0, 0, 4, 2, 0, 2.5);
    liftable(m, "pantograph", (mm, lift) => mm.rod("arm", [0, 2.5, 0], [Math.cos(lift), 2.5 + Math.sin(lift), 0], 0.03));
    for (const x of [-1, 1]) openable(m, (mm, o) => mm.moved(([px, py, pz]) => [px + x, py, pz + o * 0.1], () => mm.box("leaf", 0, 1.01, 0.5, 0.01, 0.2, 2)));
    const { json } = parseGlb(m.toGlb("t", "t"));
    const j = json as unknown as { nodes: Array<{ name: string }>; animations: Array<{ name: string; channels: unknown[] }> };
    expect(j.nodes.map((n) => n.name)).toEqual(["t", "pantograph1-1", "door1-1", "door2-1"]);
    expect(j.animations.map((a) => [a.name, a.channels.length])).toEqual([["pantograph1", 2], ["doors-right", 4]]);
  });

  it("refuse a door drive without a side", () => {
    const m = new MeshBuilder(PALETTE);
    m.part("p", [0, 0, 0], () => m.box("body", 0, 0, 1, 1, 0, 1));
    const track = { node: "p", path: "translation" as const, values: [0, 0, 0, 0, 0, 0] };
    expect(() => m.animate({ name: "d", times: [0, 1], tracks: [track], drive: { drive: "door" } as never })).toThrow(/bad drive/);
  });
});

describe("doorways", () => {
  // a box body 10 m long, 2.8 m wide, from 0.5 to 3.5 m, in two bands
  const volume = (openings?: Volume["openings"]): Volume => ({
    name: "body",
    section: [[1.4, 0.5], [1.4, 3.5], [-1.4, 3.5], [-1.4, 0.5]],
    plan: [[0, 1.4], [10, 1.4]],
    bands: [[0.5, 2, "red"], [2, 3.5, "roof"]],
    ...(openings ? { openings } : {}),
  });
  /** How many triangles of `mat` lie in the plane z = `z` over the point (x, y). */
  const over = (c: Coach, mat: string, z: number, x: number, y: number): number => {
    const pos = (c.m as unknown as { groups: Map<string, { pos: number[] }> }).groups.get(mat)?.pos ?? [];
    let n = 0;
    for (let t = 0; t < pos.length; t += 9) {
      const [xs, ys, zs] = [0, 1, 2].map((k) => [pos[t + k]!, pos[t + 3 + k]!, pos[t + 6 + k]!]);
      if (zs!.every((v) => Math.abs(v - z) < 1e-6) && Math.min(...xs!) <= x && x <= Math.max(...xs!) && Math.min(...ys!) <= y && y <= Math.max(...ys!)) n++;
    }
    return n;
  };

  it("leave the shell open over an inward-opening door, a dark vestibule behind it", () => {
    const c = new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5);
    const door = { x0: 4, y0: 0.6, x1: 5.2, y1: 2.8 };
    const v = volume([c.doorOpening(1, door)]);
    c.volume(v);
    c.door(v, 1, door, "red", { opens: { kind: "fold", leaves: 2 } });
    // the skin (z = 1.4) is gone over the doorway, still there beside it
    expect(over(c, "red", 1.4, -0.4, 1.6)).toBe(0);
    expect(over(c, "red", 1.4, -3, 1.6)).toBeGreaterThan(0);
    // the vestibule's back wall stands 0.6 m inside the skin, behind the doorway
    expect(over(c, "seam", 0.8, -0.4, 1.6)).toBeGreaterThan(0);
  });

  it("change nothing on a body without doorways", () => {
    const [a, b] = [new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5), new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5)];
    a.volume(volume());
    b.volume(volume([]));
    expect(Buffer.from(a.m.toGlb("t")).equals(Buffer.from(b.m.toGlb("t")))).toBe(true);
  });
});

/** The designs whose leaves fold or swing inward, and how many such doors: each opens through a doorway into a vestibule. */
const INWARD: Record<string, number> = {
  "proc-vehicle-tatra-t3": 3,
  "proc-vehicle-tatra-kt4": 4,
  "proc-vehicle-tatra-kt8": 10,
  "proc-vehicle-kvag-gt4": 3,
  "proc-vehicle-csd-bdmtee": 4,
  "proc-vehicle-cd-y-coach": 4,
  "proc-vehicle-cd-810": 4,
};

describe("inward-opening doors", () => {
  for (const [id, count] of Object.entries(INWARD)) {
    it(`${id} opens each of its ${count} inward doors into a vestibule`, () => {
      const d = ALL_VEHICLES.find((v) => v.id === id)!;
      const ids: string[] = [];
      const walk = (n: { id: string; children?: unknown[] }) => {
        if (/(^|\/)vestibule-\d+$/.test(n.id)) ids.push(n.id);
        for (const k of (n.children ?? []) as Array<{ id: string; children?: unknown[] }>) walk(k);
      };
      walk(d.build().sourceTree(d.id, d.title).root);
      expect(ids).toHaveLength(count);
    });
  }
});

/** The groups of passenger vehicles: every one opens its passenger doors. */
const PASSENGER_GROUPS = new Set(["coach", "unit", "tram", "metro", "bus"]);
/** Passenger-group designs with no door to open: a luggage van, a steam railcar whose van body draws none. */
const NO_DOORS = new Set(["proc-vehicle-csd-dsk", "proc-vehicle-csd-m112"]);
/** Doors on the right only: the single-ended trams and every bus (the kerb side). */
const RIGHT_ONLY = (id: string, group: string) => group === "bus" || ["proc-vehicle-tatra-t3", "proc-vehicle-tatra-t6", "proc-vehicle-tatra-kt4", "proc-vehicle-kvag-gt4"].includes(id);

const groupOf = (d: (typeof ALL_VEHICLES)[number]) => d.catalog?.group ?? "";
const PASSENGER = ALL_VEHICLES.filter((d) => PASSENGER_GROUPS.has(groupOf(d)) && !NO_DOORS.has(d.id));

describe("vehicle doors", () => {
  it("open on every passenger vehicle, and on nothing else", () => {
    // a design opens doors when one of its variants does (a set's power car opens none)
    const opens = (d: (typeof ALL_VEHICLES)[number]) => variantsUnderTest(d).some((p) => d.build(p).animations().some((c) => c.drive.drive === "door"));
    const withDoors = ALL_VEHICLES.filter(opens).map((d) => d.id);
    expect(withDoors.sort()).toEqual(PASSENGER.map((d) => d.id).sort());
    expect(PASSENGER.length).toBeGreaterThan(40);
  });

  for (const d of PASSENGER) {
    const sides = RIGHT_ONLY(d.id, groupOf(d)) ? ["right"] : ["left", "right"];
    for (const params of variantsUnderTest(d)) {
      it(`${d.id} ${JSON.stringify(params)} opens its passenger doors on each side, shut at rest`, () => {
        const m = d.build(params);
        const glb = m.toGlb(d.title, d.id);
        const doors = m.animations().map((c, i) => ({ c, i })).filter(({ c }) => c.drive.drive === "door");
        // a variant may have none to open (a luggage van, a power car with crew doors only)
        if (doors.length) expect(new Set(doors.map(({ c }) => (c.drive as { side: string }).side))).toEqual(new Set(sides));
        for (const { c, i } of doors) {
          expect(c.name).toMatch(/^doors-(left|right)(-.+)?$/);
          expect(sampleCount(glb, i)).toBe(DOOR_SAMPLES + 1);
          const [shut, rest] = [glbStats(poseGlb(glb, 0, i)), glbStats(glb)];
          for (const k of [0, 1, 2]) {
            expect(shut.min[k]).toBeCloseTo(rest.min[k]!, 5);
            expect(shut.max[k]).toBeCloseTo(rest.max[k]!, 5);
          }
        }
        // half open and open, with every door at once, nothing z-fights
        for (const k of [DOOR_SAMPLES / 2, DOOR_SAMPLES]) {
          let posed = glb;
          for (const { i } of doors) posed = poseGlb(posed, k, i);
          expect(findCoplanarOverlaps(posed)).toEqual([]);
        }
        // the low level of detail stays shut and still
        expect(buildLodModel(d, params).animations().filter((c) => c.drive.drive === "door")).toHaveLength(0);
      });
    }
  }
});

/** Relative luminance of a palette colour "#rrggbb", 0..1. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

describe("bus doorways", () => {
  // Looking in through a bus's open door: the first thing behind each leaf, along a
  // ray from outside at the leaf's middle, must be a dark doorway, not the body's
  // paint (the shell is not cut there; the doorway is a dark slab on it).
  for (const d of ALL_VEHICLES.filter((v) => groupOf(v) === "bus")) {
    it(`${d.id} shows a dark doorway behind every door leaf`, () => {
      const m = d.build() as unknown as {
        groups: Map<string, { pos: number[]; part: number[] }>;
        parts: Array<{ name: string }>;
        palette: Record<string, { color?: string }>;
      };
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
      expect(leaves.size).toBeGreaterThan(0);
      for (const box of leaves.values()) {
        const [x, y] = [(box.min[0]! + box.max[0]!) / 2, (box.min[1]! + box.max[1]!) * 0.4];
        const s = Math.sign(box.min[2]! + box.max[2]!);
        // the nearest still triangle a ray along -s z through (x, y) meets
        let hit: { z: number; mat: string } | null = null;
        for (const [mat, g] of m.groups)
          for (let t = 0; t < g.part.length; t++) {
            if (isLeaf(g.part[t]!)) continue;
            const p = g.pos.slice(t * 9, t * 9 + 9);
            const [ax, ay, az, bx, by, bz, cx, cy, cz] = p as [number, number, number, number, number, number, number, number, number];
            const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
            if (Math.abs(den) < 1e-12) continue;
            const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den;
            const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den;
            if (u < 0 || v < 0 || u + v > 1) continue;
            const z = u * az + v * bz + (1 - u - v) * cz;
            if (z * s > 0 && (!hit || z * s > hit.z * s)) hit = { z, mat };
          }
        expect(hit, `nothing behind the leaf at x ${x.toFixed(2)}`).not.toBeNull();
        expect(luminance(m.palette[hit!.mat]!.color ?? "#ffffff"), `${hit!.mat} behind the leaf at x ${x.toFixed(2)}`).toBeLessThan(0.25);
      }
    });
  }
});
