// The vehicle rig (generator/rig.ts): the steered wheels, the hinged chain of an
// articulated vehicle's sections, and the joint drawn between them -- on the JS
// module's group, which is what the game and the site pose.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { DESIGNS, designGlb } from "../generator/generate";
import { parseGlb } from "../generator/glbTriangles";
import { bundleDesign } from "../generator/jsModel";
import { jointTriangles, pose, steerAngles, steerLock, type JointRig, type SectionRig, type SteerRig, type VehicleRig } from "../generator/rig";
import { VEHICLES } from "../generator/vehicles";
import { poseControls, poseOf, steerLockDeg, type CatalogRecord } from "../src/catalogQuery";

const DEG = Math.PI / 180;
const STEER: SteerRig = { nodes: ["l", "r"], maxAngleDeg: 45, wheelbase: 5.5, track: 2.1 };

describe("steerAngles", () => {
  it("turns both wheels toward one centre on the rear axle's line, the inner one tighter", () => {
    for (const steer of [5, 20, 35].map((d) => d * DEG)) {
      const [left, right] = steerAngles(STEER, steer);
      expect(left).toBeGreaterThan(steer); // turning left: the left wheel is inside
      expect(right).toBeLessThan(steer);
      // both wheels' axes meet the rear axle's line at one point
      const centre = STEER.wheelbase / Math.tan(steer);
      expect(STEER.wheelbase / Math.tan(left) + STEER.track / 2).toBeCloseTo(centre, 9);
      expect(STEER.wheelbase / Math.tan(right) - STEER.track / 2).toBeCloseTo(centre, 9);
      // and a right turn mirrors it
      expect(steerAngles(STEER, -steer)).toEqual([-right, -left]);
    }
    expect(steerAngles(STEER, 0)).toEqual([0, 0]);
  });

  it("locks the inner wheel at the rig's maximum", () => {
    const lock = steerLock(STEER);
    expect(steerAngles(STEER, lock)[0]).toBeCloseTo(45 * DEG, 9);
    // the site computes the same limit without importing the generator
    expect(steerLockDeg(STEER)).toBeCloseTo(lock / DEG, 9);
  });
});

/** A bellows between two sections hinged half way across the gap. */
function articulated(): VehicleRig {
  const sections: SectionRig[] = [{ node: "a", pivot: [0, 0, 0] }, { node: "b", pivot: [-1, 0.5, 0] }];
  const joint: JointRig = {
    node: "j", sections: [0, 1], front: -0.5, rear: -1.5, folds: 4, depth: 0.05, material: "bellows",
    profile: [[-1, 0.3], [1, 0.3], [1, 2.6], [0, 2.8], [-1, 2.6]],
  };
  return { sections, joints: [joint], maxBendDeg: 45 };
}

describe("jointTriangles", () => {
  it("keeps the bellows sealed to both sections, however they are posed", () => {
    const rig = articulated();
    const j = rig.joints![0]!;
    const sections = rig.sections!;
    const a = new THREE.Matrix4().makeRotationY(0.2).setPosition(0.3, 0, 0.1);
    const b = new THREE.Matrix4().makeRotationY(-0.6).multiply(new THREE.Matrix4().makeRotationX(0.05)).setPosition(-1.2, 0.5, 0.4);
    const rest = jointTriangles(j, sections);
    const posed = jointTriangles(j, sections, a.elements, b.elements);
    expect(posed.length).toBe(rest.length);
    let front = 0;
    let rear = 0;
    rest.forEach((p, i) => {
      const q = new THREE.Vector3(...posed[i]!);
      if (Math.abs(p[0] - j.front) < 1e-9) {
        front++;
        const want = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(a);
        expect(q.distanceTo(want)).toBeLessThan(1e-9);
      }
      if (Math.abs(p[0] - j.rear) < 1e-9) {
        rear++;
        const want = new THREE.Vector3(p[0] + 1, p[1] - 0.5, p[2]).applyMatrix4(b);
        expect(q.distanceTo(want)).toBeLessThan(1e-9);
      }
    });
    expect(front).toBeGreaterThan(0);
    expect(rear).toBeGreaterThan(0);
  });

  it("winds the bellows outward", () => {
    const rig = articulated();
    const t = jointTriangles(rig.joints![0]!, rig.sections!);
    for (let i = 0; i < t.length; i += 3) {
      const [p, q, r] = [t[i]!, t[i + 1]!, t[i + 2]!].map((v) => new THREE.Vector3(...v));
      const n = new THREE.Vector3().subVectors(q!, p!).cross(new THREE.Vector3().subVectors(r!, p!));
      const c = new THREE.Vector3().add(p!).add(q!).add(r!).divideScalar(3);
      // out from the bellows' axis (z = 0, y = 1.55)
      expect(n.dot(new THREE.Vector3(0, c.y - 1.55, c.z))).toBeGreaterThan(0);
    }
  });
});

type Module = {
  default: (three: typeof THREE, params?: Record<string, string>) => THREE.Group;
  pose: typeof pose;
};
const MODULES = new Map<string, Module>();
async function moduleOf(id: string): Promise<Module> {
  if (!MODULES.has(id)) {
    const text = await bundleDesign(DESIGNS.get(id)!, "vehicles.ts");
    MODULES.set(id, (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`)) as Module);
  }
  return MODULES.get(id)!;
}

const RIGGED = VEHICLES.filter((d) => d.build().rig !== null).map((d) => [d.id] as const);

describe("the rigged vehicles", () => {
  it("are every road vehicle", () => {
    const road = VEHICLES.filter((d) => (d.catalog?.category ?? "Road vehicles") === "Road vehicles").map((d) => d.id);
    expect(RIGGED.map(([id]) => id)).toEqual(road);
    expect(road).toContain("veh-american-truck");
  });

  it.each(RIGGED)("%s: its steered wheels are child nodes of the front body, pivoting at their centres", (id) => {
    const rig = DESIGNS.get(id)!.build().rig!;
    const { json } = parseGlb(designGlb(id));
    const nodes = json.nodes as Array<{ name: string; children?: number[]; translation?: number[] }>;
    const front = rig.sections?.[0]?.node ?? nodes[0]!.name;
    const parent = nodes.find((n) => n.name === front)!;
    for (const name of rig.steer!.nodes) {
      const i = nodes.findIndex((n) => n.name === name);
      expect(parent.children).toContain(i);
    }
    // left at -z, right at +z, mirror images
    const [l, r] = rig.steer!.nodes.map((n) => nodes.find((x) => x.name === n)!.translation!);
    expect(l![2]).toBeLessThan(0);
    expect(r![2]).toBeCloseTo(-l![2]!, 6);
    expect(r![0]).toBeCloseTo(l![0]!, 6);
    expect(rig.steer!.track).toBeCloseTo(r![2]! - l![2]!, 6);
  });

  it.each(RIGGED)("%s: pose() turns the wheels and lays the sections out as a hinged chain", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const hinges = Math.max(0, (rig.sections?.length ?? 0) - 1);
    const bend = Array.from({ length: hinges }, (_, i) => (i % 2 ? -1 : 1) * 0.4);
    mod.pose(group, { steer: 0.3, bend });
    const [left, right] = steerAngles(rig.steer!, 0.3);
    expect(group.getObjectByName(rig.steer!.nodes[0])!.rotation.y).toBeCloseTo(left, 9);
    expect(group.getObjectByName(rig.steer!.nodes[1])!.rotation.y).toBeCloseTo(right, 9);
    group.updateMatrixWorld(true);
    const sections = rig.sections ?? [];
    for (let i = 1; i < sections.length; i++) {
      // the hinge is where both the section ahead and this one put it
      const ahead = group.getObjectByName(sections[i - 1]!.node)!;
      const self = group.getObjectByName(sections[i]!.node)!;
      const p = sections[i]!.pivot;
      const q = sections[i - 1]!.pivot;
      const fromAhead = new THREE.Vector3(p[0] - q[0], p[1] - q[1], p[2] - q[2]).applyMatrix4(ahead.matrixWorld);
      const fromSelf = new THREE.Vector3(0, 0, 0).applyMatrix4(self.matrixWorld);
      expect(fromAhead.distanceTo(fromSelf)).toBeLessThan(1e-9);
      expect(self.rotation.y - ahead.rotation.y).toBeCloseTo(bend[i - 1]!, 9);
    }
    // back to rest: the GLB's geometry again
    mod.pose(group, {});
    for (const n of rig.steer!.nodes) expect(group.getObjectByName(n)!.rotation.y).toBe(0);
  }, 30_000);
});

describe("the site's pose sliders", () => {
  it("offer the steering and a slider per hinge, in the model's units", () => {
    const rig: VehicleRig = { steer: STEER, sections: [{ node: "truck", pivot: [0, 0, 0] }, { node: "trailer", pivot: [1, 1, 0] }], maxBendDeg: 75 };
    const r = { rig } as CatalogRecord;
    expect(poseControls(r)).toEqual([
      { key: "steer", label: "Steering", max: Math.floor(steerLockDeg(STEER)) },
      { key: "bend0", label: "Trailer", max: 75 },
    ]);
    const p = poseOf(r, { steer: 10, bend0: -30 });
    expect(p.steer).toBeCloseTo(10 * DEG, 12);
    expect(p.bend[0]).toBeCloseTo(-30 * DEG, 12);
    expect(poseControls({} as CatalogRecord)).toEqual([]);
  });
});
