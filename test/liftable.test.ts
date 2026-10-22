// A mechanism that moves between two poses (MeshCore.liftable): sampled, split into
// rigid pieces, each moving piece its own part, and a `state` clip from the folded
// pose at time 0 to the raised one at time 1. The `rod` primitive it relies on, and
// the lamps a palette marks (MeshCore.lamps). See docs/models/animation.md and
// docs/models/lamps.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import type { MeshCore, Vec3 } from "../generator/meshCore.ts";
import { LIFT_SAMPLES, liftable } from "../generator/liftable.ts";
import { parseGlb } from "../generator/glbParse.ts";

const PALETTE = { base: { color: "#808080" }, arm: { color: "#303030" }, head: { color: "#202020" } };

/** A one-arm hinge: a static base, an arm turning about z at (0, 1, 0), a head riding the arm's tip. */
function hinge(m: MeshCore, lift: number): void {
  m.box("base", 0, 0, 1, 1, 0.9, 1);
  const angle = (lift * Math.PI) / 3;
  const tip: Vec3 = [1.5 * Math.cos(angle), 1 + 1.5 * Math.sin(angle), 0];
  m.rod("arm", [0, 1, 0.2], tip, 0.03);
  m.box("head", tip[0], 0, 0.2, 1, tip[1], tip[1] + 0.05);
}

function lifted<T extends MeshBuilder | ThreeMeshBuilder>(m: T): T {
  liftable(m, "mech", (mm, lift) => hinge(mm, lift));
  return m;
}

/** Every triangle corner of a built group, world space, rounded and sorted (pose comparison). */
function sortedCorners(root: THREE.Object3D): string[] {
  root.updateMatrixWorld(true);
  const out: string[] = [];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      out.push([v.x, v.y, v.z].map((x) => (Math.round(x * 500) / 500 + 0).toFixed(3)).join(","));
    }
  });
  return out.sort();
}

function plain(lift: number): THREE.Group {
  const m = new ThreeMeshBuilder(PALETTE);
  hinge(m, lift);
  return m.toGroup(THREE);
}

describe("liftable mechanisms", () => {
  it("draw the raised pose at rest, the moving pieces as parts, the still ones in place", () => {
    const g = lifted(new ThreeMeshBuilder(PALETTE)).toGroup(THREE);
    expect(sortedCorners(g)).toEqual(sortedCorners(plain(1)));
    // the base stays on the root; the arm and the head each move their own way
    expect(g.children.filter((c) => c instanceof THREE.Mesh).map((c) => c.name)).toEqual(["base"]);
    expect(g.children.filter((c) => !(c instanceof THREE.Mesh)).map((c) => c.name)).toEqual(["mech1-1", "mech1-2"]);
  });

  it("pivot a turning piece on its hinge", () => {
    const g = lifted(new ThreeMeshBuilder(PALETTE)).toGroup(THREE);
    const arm = g.getObjectByName("mech1-1")!;
    expect(arm.position.x).toBeCloseTo(0, 3);
    expect(arm.position.y).toBeCloseTo(1, 3);
  });

  it("carry a state clip from the folded pose at 0 to the raised one at 1", () => {
    const g = lifted(new ThreeMeshBuilder(PALETTE)).toGroup(THREE);
    expect(g.userData.clipDrives).toEqual({ mech1: { drive: "state" } });
    const clip = g.animations[0]!;
    expect(clip.name).toBe("mech1");
    expect(clip.duration).toBe(1);
    expect(clip.tracks[0]!.times.length).toBe(LIFT_SAMPLES + 1);
    const mixer = new THREE.AnimationMixer(g);
    const action = mixer.clipAction(clip);
    action.play();
    for (const lift of [0, 0.5, 1]) {
      action.time = lift;
      mixer.update(0);
      // a sample lift matches the plain build exactly; between samples the arm keeps its length
      expect(sortedCorners(g)).toEqual(sortedCorners(plain(lift)));
    }
  });

  it("write the same parts and clip into the GLB", () => {
    const { json } = parseGlb(lifted(new MeshBuilder(PALETTE)).toGlb("t", "t"));
    const j = json as unknown as { nodes: Array<{ name: string }>; animations: Array<{ name: string; channels: unknown[] }>; scenes: Array<{ extras?: { clipDrives?: unknown } }> };
    expect(j.nodes.map((n) => n.name)).toEqual(["t", "mech1-1", "mech1-2"]);
    expect(j.animations.map((a) => [a.name, a.channels.length])).toEqual([["mech1", 4]]);
    expect(j.scenes[0]!.extras?.clipDrives).toEqual({ mech1: { drive: "state" } });
  });

  it("refuse a piece that stretches as it lifts", () => {
    const m = new ThreeMeshBuilder(PALETTE);
    expect(() => liftable(m, "bad", (mm, lift) => mm.rod("arm", [0, 0, 0], [1 + lift, 0, 0], 0.05))).toThrow(/stretches/);
  });

  it("move with the turned frame of the car they are drawn in", () => {
    const m = new ThreeMeshBuilder(PALETTE);
    m.turned(0, () => liftable(m, "mech", (mm, lift) => hinge(mm, lift)));
    const ref = new ThreeMeshBuilder(PALETTE);
    ref.turned(0, () => hinge(ref, 1));
    expect(sortedCorners(m.toGroup(THREE))).toEqual(sortedCorners(ref.toGroup(THREE)));
  });
});

describe("rods", () => {
  it("are closed and wound outward", () => {
    const m = new ThreeMeshBuilder(PALETTE);
    m.rod("arm", [0, 0, 0], [1, 2, 0.5], 0.1, 8);
    const g = m.toGroup(THREE);
    const pos = (g.children[0] as THREE.Mesh).geometry.getAttribute("position");
    // every face's normal points away from the axis or out of the ends
    const axis = new THREE.Vector3(1, 2, 0.5).normalize();
    const mid = new THREE.Vector3(0.5, 1, 0.25);
    for (let i = 0; i < pos.count; i += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, i + k));
      const n = new THREE.Vector3().subVectors(b!, a!).cross(new THREE.Vector3().subVectors(c!, a!));
      const centre = new THREE.Vector3().add(a!).add(b!).add(c!).multiplyScalar(1 / 3);
      expect(n.dot(centre.sub(mid))).toBeGreaterThan(0);
    }
    expect(axis.length()).toBeCloseTo(1);
  });
});

describe("lamps", () => {
  const LAMPS = {
    body: { color: "#808080" },
    lampHead: { color: "#f3f5f6", lamp: { role: "head" as const } },
    lampRed: { color: "#c8202c", lamp: { role: "tail" as const, lit: "#ff0000", intensity: 1 } },
  };
  const car = <T extends MeshBuilder | ThreeMeshBuilder>(m: T): T => {
    m.box("body", 1, 0, 10, 2, 0, 2);
    for (const x of [-4, 6]) m.box("lampHead", x, 0.6, 0.1, 0.2, 0.5, 0.7);
    m.box("lampRed", -4, -0.6, 0.1, 0.2, 0.5, 0.7);
    return m;
  };

  it("name each lamp material's role and lit look, and the middle of the model's length", () => {
    const g = car(new ThreeMeshBuilder(LAMPS)).toGroup(THREE);
    expect(g.userData.lamps).toEqual({
      midX: 1,
      materials: {
        lampHead: { role: "head", lit: "#fff6e0", intensity: 1.6 },
        lampRed: { role: "tail", lit: "#ff0000", intensity: 1 },
      },
    });
    const { json } = parseGlb(car(new MeshBuilder(LAMPS)).toGlb("t"));
    expect((json as { scenes: Array<{ extras?: { lamps?: unknown } }> }).scenes[0]!.extras?.lamps).toEqual(g.userData.lamps);
  });

  it("are absent from a model without a lamp material", () => {
    const m = new ThreeMeshBuilder(LAMPS);
    m.box("body", 0, 0, 1, 1, 0, 1);
    expect(m.toGroup(THREE).userData.lamps).toBeUndefined();
  });
});
