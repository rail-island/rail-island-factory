// Passenger doors that open (generator/doors.ts): the leaves' motions, `openable`
// turning a door drawn at any opening into moving leaf parts of its side's `door`
// clip with the shut pose at rest, and the trams, coaches and units that have
// them. See docs/models/doors.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import type { MeshCore, Vec3 } from "../generator/meshCore.ts";
import { DOOR_FOLD_ANGLE, DOOR_PLUG_OUT, DOOR_POCKET_IN, DOOR_SAMPLES, doorLeaves, openable, type DoorMotion } from "../generator/doors.ts";
import { liftable } from "../generator/liftable.ts";
import { parseGlb } from "../generator/glbParse.ts";
import { Coach, type Volume } from "../generator/csdCoachParts.ts";
import { CABIN_INSET } from "../generator/interior.ts";
import { vehicleDoorSuite } from "./doorsSuite";

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
    { kind: "pocket", leaves: 1, toward: "low" },
    { kind: "pocket", leaves: 2 },
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

  it("pocket: step in behind the skin, then slide apart into the wall", () => {
    // the 81-71 metro car's doors slide into the body side, never out over it
    for (const s of [1, -1]) {
      const [a, b] = doorLeaves(0, 1.2, s, { kind: "pocket", leaves: 2 });
      const p: Vec3 = [0.3, 1, s];
      expect(a!.move(0.25, s)(p)).toEqual([0.3, 1, s - s * DOOR_POCKET_IN]);
      const open = a!.move(1, s)(p);
      expect(open[0]).toBeCloseTo(0.3 - (a!.x1 - a!.x0) - 0.012, 9);
      expect(Math.abs(open[2])).toBeCloseTo(1 - DOOR_POCKET_IN, 9);
      expect(b!.move(1, s)([0.9, 1, s])[0]).toBeGreaterThan(1.2);
    }
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

  it("leave the shell open over a door, the car's cabin behind it", () => {
    for (const opens of [{ kind: "fold", leaves: 2 }, { kind: "plug", leaves: 2 }] as DoorMotion[]) {
      const c = new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5);
      const door = { x0: 4, y0: 0.6, x1: 5.2, y1: 2.8 };
      const v = volume([c.doorOpening(1, door)]);
      c.volume(v);
      c.door(v, 1, door, "red", { opens });
      // the skin (z = 1.4) is gone over the doorway, still there beside it
      expect(over(c, "red", 1.4, -0.4, 1.6)).toBe(0);
      expect(over(c, "red", 1.4, -3, 1.6)).toBeGreaterThan(0);
      // behind it the cabin's far side wall, inside the far skin, and none on the doorway's side
      expect(over(c, "interiorWall", -(1.4 - CABIN_INSET), -0.4, 1.6)).toBeGreaterThan(0);
      expect(over(c, "interiorWall", 1.4 - CABIN_INSET, -0.4, 1.6)).toBe(0);
      expect(c.m.interiors()).toEqual({ interior: ["doors-right"] });
    }
  });

  it("change nothing on a body without doorways", () => {
    const [a, b] = [new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5), new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5)];
    a.volume(volume());
    b.volume(volume([]));
    expect(Buffer.from(a.m.toGlb("t")).equals(Buffer.from(b.m.toGlb("t")))).toBe(true);
  });
});

// the per-vehicle checks: the first of four shards (doors-2..4.test.ts run the others)
vehicleDoorSuite(0, 4);
