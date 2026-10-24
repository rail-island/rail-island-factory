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

/**
 * The designs whose passenger doors open, and the sides they have doors on. The
 * DB 628 design's n-Wagen coaches (its `unit` values other than the motor car)
 * keep shut doors: only the railcar itself opens.
 */
const DOOR_DESIGNS: Record<string, Array<"left" | "right">> = {
  "proc-vehicle-tatra-t3": ["right"],
  "proc-vehicle-tatra-t6": ["right"],
  "proc-vehicle-tatra-kt8": ["left", "right"],
  "proc-vehicle-tatra-kt4": ["right"],
  "proc-vehicle-kvag-gt4": ["right"],
  "proc-vehicle-cd-y-coach": ["left", "right"],
  "proc-vehicle-uic-z-coach": ["left", "right"],
  "proc-vehicle-bmo-double-deck-coach": ["left", "right"],
  "proc-vehicle-csd-bdmtee": ["left", "right"],
  "proc-vehicle-cd-471": ["left", "right"],
  "proc-vehicle-db-628": ["left", "right"],
  "proc-vehicle-cd-680": ["left", "right"],
  "proc-vehicle-cd-810": ["left", "right"],
};

describe("vehicle doors", () => {
  it("open on the chosen trams, coaches and units only", () => {
    const withDoors = ALL_VEHICLES.filter((d) => d.build().animations().some((c) => c.drive.drive === "door")).map((d) => d.id);
    expect(withDoors.sort()).toEqual(Object.keys(DOOR_DESIGNS).sort());
  });

  for (const [id, sides] of Object.entries(DOOR_DESIGNS)) {
    const d = ALL_VEHICLES.find((v) => v.id === id)!;
    for (const params of variantsUnderTest(d)) {
      if (id === "proc-vehicle-db-628" && (params.unit ?? "motorCar") !== "motorCar") {
        it(`${id} ${JSON.stringify(params)} keeps the n-Wagen's doors shut`, () => {
          expect(d.build(params).animations().filter((c) => c.drive.drive === "door")).toHaveLength(0);
        });
        continue;
      }
      it(`${id} ${JSON.stringify(params)} opens its passenger doors on each side, shut at rest`, () => {
        const m = d.build(params);
        const glb = m.toGlb(d.title, d.id);
        const doors = m.animations().map((c, i) => ({ c, i })).filter(({ c }) => c.drive.drive === "door");
        expect(new Set(doors.map(({ c }) => (c.drive as { side: string }).side))).toEqual(new Set(sides));
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
