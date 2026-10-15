// The vehicle rig (generator/rig.ts): the steered wheels, the hinged chain of an
// articulated vehicle's sections, and the joint drawn between them -- on the JS
// module's group, which is what the game and the site pose.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { ALL_VEHICLES, DESIGNS, designGlb, designSource } from "../generator/generate";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { bundleDesign } from "../generator/jsModel";
import { jointTriangles, pose, steerAngles, steerLock, type JointRig, type SectionRig, type SteerRig, type VehicleRig } from "../generator/rig";
import { poseControls, poseOf, steerLockDeg, type CatalogRecord } from "../src/catalogQuery";

const DEG = Math.PI / 180;
const STEER: SteerRig = { axles: [{ nodes: ["l", "r"], wheelbase: 5.5 }], maxAngleDeg: 45, track: 2.1 };
/** An 8x4 truck's: two steered axles 1.85 m apart. */
const STEER2: SteerRig = { axles: [{ nodes: ["l", "r"], wheelbase: 6.12 }, { nodes: ["l2", "r2"], wheelbase: 4.27 }], maxAngleDeg: 40, track: 2.1 };

describe("steerAngles", () => {
  it("turns both wheels toward one centre on the rear axle's line, the inner one tighter", () => {
    for (const steer of [5, 20, 35].map((d) => d * DEG)) {
      const [[left, right]] = steerAngles(STEER, steer) as [[number, number]];
      expect(left).toBeGreaterThan(steer); // turning toward -z: the -z wheel is inside
      expect(right).toBeLessThan(steer);
      // both wheels' axes meet the rear axle's line at one point
      const wheelbase = STEER.axles[0]!.wheelbase;
      const centre = wheelbase / Math.tan(steer);
      expect(wheelbase / Math.tan(left) + STEER.track / 2).toBeCloseTo(centre, 9);
      expect(wheelbase / Math.tan(right) - STEER.track / 2).toBeCloseTo(centre, 9);
      // and a turn the other way mirrors it
      expect(steerAngles(STEER, -steer)).toEqual([[-right, -left]]);
    }
    expect(steerAngles(STEER, 0)).toEqual([[0, 0]]);
  });

  it("aims a second steered axle at the same centre, turning it less", () => {
    const steer = 20 * DEG;
    const [[l1, r1], [l2, r2]] = steerAngles(STEER2, steer) as [[number, number], [number, number]];
    expect(l2).toBeLessThan(l1);
    expect(r2).toBeLessThan(r1);
    const centre = STEER2.axles[0]!.wheelbase / Math.tan(steer);
    expect(STEER2.axles[1]!.wheelbase / Math.tan(l2) + STEER2.track / 2).toBeCloseTo(centre, 9);
    expect(STEER2.axles[1]!.wheelbase / Math.tan(r2) - STEER2.track / 2).toBeCloseTo(centre, 9);
  });

  it("locks the inner wheel at the rig's maximum", () => {
    const lock = steerLock(STEER);
    expect(steerAngles(STEER, lock)[0]![0]).toBeCloseTo(45 * DEG, 9);
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
    const text = await bundleDesign(DESIGNS.get(id)!, designSource(id));
    MODULES.set(id, (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`)) as Module);
  }
  return MODULES.get(id)!;
}

const RIGGED = ALL_VEHICLES.filter((d) => d.build().rig !== null).map((d) => [d.id] as const);
/** The rigged vehicles with steered wheels: every road vehicle (an articulated tram has none). */
const STEERED = RIGGED.filter(([id]) => DESIGNS.get(id)!.build().rig!.steer !== undefined);

describe("the rigged vehicles", () => {
  it("are every road vehicle, steered, and the articulated rail vehicles, sections and joints only", () => {
    const road = ALL_VEHICLES.filter((d) => (d.catalog?.category ?? "Road vehicles") === "Road vehicles").map((d) => d.id);
    expect(STEERED.map(([id]) => id)).toEqual(road);
    expect(road).toContain("veh-american-truck");
    const rail = RIGGED.map(([id]) => id).filter((id) => !road.includes(id));
    expect(rail).toEqual(expect.arrayContaining(["veh-tatra-kt8", "veh-tatra-kt4", "veh-kvag-gt4"]));
    for (const id of rail) {
      const d = DESIGNS.get(id)!;
      const rig = d.build().rig!;
      expect(d.catalog?.category).toBe("Rail vehicles");
      expect(rig.steer).toBeUndefined();
      expect(rig.sections!.length).toBeGreaterThanOrEqual(2);
      expect(rig.joints).toHaveLength(rig.sections!.length - 1);
    }
  });

  it.each(STEERED)("%s: its steered wheels are child nodes of the front body, pivoting at their centres", (id) => {
    const rig = DESIGNS.get(id)!.build().rig!;
    const { json } = parseGlb(designGlb(id));
    const nodes = json.nodes as Array<{ name: string; children?: number[]; translation?: number[] }>;
    const front = rig.sections?.[0]?.node ?? nodes[0]!.name;
    const parent = nodes.find((n) => n.name === front)!;
    expect(rig.steer!.axles.length).toBeGreaterThan(0);
    let ahead = Infinity;
    for (const axle of rig.steer!.axles) {
      for (const name of axle.nodes) expect(parent.children).toContain(nodes.findIndex((n) => n.name === name));
      // the -z wheel first, the pair mirrored across the centre line, track apart
      const [l, r] = axle.nodes.map((n) => nodes.find((x) => x.name === n)!.translation!);
      expect(l![2]).toBeLessThan(0);
      expect(r![2]).toBeCloseTo(-l![2]!, 6);
      expect(r![0]).toBeCloseTo(l![0]!, 6);
      expect(rig.steer!.track).toBeCloseTo(r![2]! - l![2]!, 6);
      // axles front first, the wheelbases shrinking with them
      expect(l![0]).toBeLessThan(ahead);
      ahead = l![0]!;
    }
    const bases = rig.steer!.axles.map((a) => a.wheelbase);
    expect([...bases].sort((a, b) => b - a)).toEqual(bases);
  });

  it.each(RIGGED)("%s: pose() turns the wheels and lays the sections out as a hinged chain", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const hinges = Math.max(0, (rig.sections?.length ?? 0) - 1);
    const bend = Array.from({ length: hinges }, (_, i) => (i % 2 ? -1 : 1) * 0.4);
    mod.pose(group, { steer: 0.3, bend });
    if (rig.steer) {
      const angles = steerAngles(rig.steer, 0.3);
      rig.steer.axles.forEach((a, k) => a.nodes.forEach((n, i) => expect(group.getObjectByName(n)!.rotation.y).toBeCloseTo(angles[k]![i]!, 9)));
    }
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
    for (const a of rig.steer?.axles ?? []) for (const n of a.nodes) expect(group.getObjectByName(n)!.rotation.y).toBe(0);
    for (const sec of sections.slice(1)) expect(group.getObjectByName(sec.node)!.rotation.y).toBe(0);
  }, 30_000);
});

describe("the semi-trucks", () => {
  const SEMIS = RIGGED.filter(([id]) => DESIGNS.get(id)!.build().rig!.sections?.[1]?.node === "trailer");

  /** A part's world-space points: the GLB's triangles under that node alone. */
  function partPoints(glb: Uint8Array, name: string): Array<[number, number, number]> {
    const { json, bin } = parseGlb(glb);
    const nodes = (json.nodes as Array<{ name: string; children?: number[] }>).map((n) => ({ ...n, children: [] }));
    const only = { ...json, nodes, scene: 0, scenes: [{ nodes: [nodes.findIndex((n) => n.name === name)] }] };
    return collectTriangles(only as typeof json, bin).flatMap((t) => t.p);
  }

  it("are the American truck and the two reproduced from the game", () => {
    expect(SEMIS.map(([id]) => id).sort()).toEqual(["veh-american-truck", "veh-cistern-semi-truck", "veh-reefer-semi-truck"]);
  });

  // at any bend: everything of the trailer ahead of the king pin sweeps a circle
  // about it, which must stay inside everything of the tractor above the fifth wheel
  it.each(SEMIS)("%s swings its trailer clear of the tractor", (id) => {
    const rig = DESIGNS.get(id)!.build().rig!;
    const [px, py, pz] = rig.sections![1]!.pivot;
    const glb = designGlb(id);
    const flat = (p: [number, number, number]): number => Math.hypot(p[0] - px, p[2] - pz);
    const reach = Math.max(...partPoints(glb, "trailer").filter((p) => p[0] > px - 0.01 && p[1] > py).map(flat));
    const clear = Math.min(...partPoints(glb, "truck").filter((p) => p[1] > py + 0.02 && p[0] > px).map(flat));
    expect(reach + 0.1).toBeLessThan(clear);
  });
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
