// The vehicle rig (generator/rig.ts): the steered wheels, the hinged chain of an
// articulated vehicle's sections, and the joint drawn between them -- on the JS
// module's group, which is what the game and the site pose.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ALL_VEHICLES, DESIGNS, designGlb, designSource } from "../generator/generate";
import { parseGlb } from "../generator/glbTriangles";
import { bundleDesign } from "../generator/jsModel";
import { MeshBuilder } from "../generator/meshBuilder";
import { drawJoint, jointTriangles, pose, steerAngles, steerLock, type JointRig, type SectionRig, type SteerRig, type VehicleRig } from "../generator/rig";
import { block } from "../generator/vehicleParts";
import { pageKey, poseControls, poseOf, posePreview, previewKey, steerLockDeg, type CatalogRecord } from "../src/catalogQuery";
import { intersectingPairs, worldTriangles, type Tri } from "./collision";

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
const ARTICULATED = RIGGED.filter(([id]) => (DESIGNS.get(id)!.build().rig!.joints ?? []).length > 0);

/** A joint's mesh: the joint node, or the child holding its material. */
function jointMesh(root: THREE.Object3D, j: JointRig): THREE.Mesh {
  let found: THREE.Mesh | undefined;
  root.getObjectByName(j.node)!.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && (mesh.material as THREE.Material).name === j.material) found = mesh;
  });
  return found!;
}

/**
 * Every joint of `root` is where the joint renderer puts it between its two
 * sections' current world matrices (world space, so any parent, wrapper or
 * importer's node transform is accounted for), as a plain triangle list.
 */
function expectSealed(root: THREE.Object3D, rig: VehicleRig, tolerance = 1e-4): void {
  root.updateMatrixWorld(true);
  for (const j of rig.joints ?? []) {
    const a = root.getObjectByName(rig.sections![j.sections[0]]!.node)!;
    const b = root.getObjectByName(rig.sections![j.sections[1]]!.node)!;
    const want = jointTriangles(j, rig.sections!, a.matrixWorld.elements, b.matrixWorld.elements);
    const mesh = jointMesh(root, j);
    const pos = mesh.geometry.getAttribute("position");
    expect(mesh.geometry.index).toBeNull();
    expect(pos.count).toBe(want.length);
    const v = new THREE.Vector3();
    let worst = 0;
    want.forEach((w, i) => {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      worst = Math.max(worst, v.distanceTo(new THREE.Vector3(...w)));
    });
    expect(worst, j.node).toBeLessThan(tolerance);
  }
}

/** The hinge of every section behind the first is where the section ahead carries it. */
function expectHinged(root: THREE.Object3D, rig: VehicleRig): void {
  root.updateMatrixWorld(true);
  const sections = rig.sections ?? [];
  for (let i = 1; i < sections.length; i++) {
    const ahead = root.getObjectByName(sections[i - 1]!.node)!;
    const self = root.getObjectByName(sections[i]!.node)!;
    const [p, q] = [sections[i]!.pivot, sections[i - 1]!.pivot];
    const fromAhead = new THREE.Vector3(p[0] - q[0], p[1] - q[1], p[2] - q[2]).applyMatrix4(ahead.matrixWorld);
    expect(fromAhead.distanceTo(new THREE.Vector3().setFromMatrixPosition(self.matrixWorld))).toBeLessThan(1e-6);
  }
}

/** A GLB's scene, the way the game loads it. */
async function loadGlb(bytes: Uint8Array): Promise<THREE.Group> {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return (await new GLTFLoader().parseAsync(buf as ArrayBuffer, "")).scene;
}

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
      // the -z wheel first, named for the factory frame's left on every road vehicle
      expect(axle.nodes[0]).toMatch(/^wheel-front(-\d+)?-left$/);
      expect(axle.nodes[1]).toBe(axle.nodes[0].replace(/-left$/, "-right"));
      // the pair mirrored across the centre line, track apart
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
    expectSealed(group, rig);
    // back to rest: the build's geometry again
    mod.pose(group, {});
    for (const a of rig.steer?.axles ?? []) for (const n of a.nodes) expect(group.getObjectByName(n)!.rotation.y).toBe(0);
    const fresh = mod.default(THREE);
    for (const s of sections) {
      const n = group.getObjectByName(s.node)!;
      expect(n.position.toArray()).toEqual(fresh.getObjectByName(s.node)!.position.toArray());
      expect(n.rotation.y).toBe(0);
    }
    for (const j of rig.joints ?? []) {
      const got = jointMesh(group, j).geometry.getAttribute("position").array;
      const want = jointMesh(fresh, j).geometry.getAttribute("position").array;
      expect(Math.max(...Array.from(got, (x, i) => Math.abs(x - want[i]!)))).toBeLessThan(1e-5);
    }
  }, 30_000);

  it.each(ARTICULATED)("%s: renderJoint draws the joint in world space, inside any parent", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const outer = new THREE.Group();
    outer.position.set(40, -3, 12);
    outer.rotation.set(0.1, 0.8, -0.05);
    outer.scale.set(0.3, 0.45, 0.3);
    outer.add(group);
    mod.pose(group, { steer: -0.2, bend: rig.joints!.map((_, i) => (i % 2 ? 0.3 : -0.6)) });
    expectHinged(group, rig);
    expectSealed(group, rig);
  }, 30_000);

  it.each(ARTICULATED)("%s: every copy of the model bends its own joint", async (id) => {
    const mod = await moduleOf(id);
    const template = mod.default(THREE);
    const rig = template.userData.rig as VehicleRig;
    // three's clone() shares geometry, as the game's copies of one loaded model do
    const [a, b] = [template.clone(true), template.clone(true)];
    expect(jointMesh(a, rig.joints![0]!).geometry).toBe(jointMesh(b, rig.joints![0]!).geometry);
    mod.pose(a, { bend: rig.joints!.map(() => 0.5) });
    mod.pose(b, { bend: rig.joints!.map(() => -0.5) });
    expectSealed(a, rig);
    expectSealed(b, rig);
    // again, now that each owns its joint
    mod.pose(a, { bend: rig.joints!.map(() => -0.3) });
    expectSealed(a, rig);
    expectSealed(b, rig);
  }, 30_000);

  it("re-draws a joint an importer welded and quantized onto a child node", async () => {
    // what the game's GLB encode does: a posable node's mesh moved onto a child,
    // its positions welded (indexed) and quantized to normalized int16, the
    // dequantization folded into that child's matrix
    const mod = await moduleOf("veh-karosa-long");
    const group = mod.default(THREE, { variant: "b961" });
    const rig = group.userData.rig as VehicleRig;
    const j = rig.joints![0]!;
    const mesh = jointMesh(group, j);
    const box = new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute("position") as THREE.BufferAttribute);
    const centre = box.getCenter(new THREE.Vector3());
    const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const welded = mergeVertices(mesh.geometry.clone().translate(-centre.x, -centre.y, -centre.z).scale(1 / half.x, 1 / half.y, 1 / half.z));
    const p = welded.getAttribute("position");
    welded.setAttribute("position", new THREE.BufferAttribute(Int16Array.from(p.array, (x) => Math.round(x * 32767)), 3, true));
    welded.deleteAttribute("normal");
    const child = new THREE.Mesh(welded, mesh.material);
    child.position.copy(centre);
    child.scale.copy(half);
    const holder = mesh.parent!;
    holder.remove(mesh);
    holder.add(child);
    expect(child.geometry.index).not.toBeNull();
    mod.pose(group, { bend: [0.6] });
    expectSealed(group, rig);
    expect(jointMesh(group, j).geometry.getAttribute("normal").count).toBe(jointTriangles(j, rig.sections!).length);
  }, 30_000);

  it.each(ARTICULATED)("%s: pose() lays the chain out from wherever the first section is", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const first = group.getObjectByName(rig.sections![0]!.node)!;
    first.position.set(2, 0.1, -1);
    first.rotation.set(0, 0.5, 0);
    mod.pose(group, { bend: rig.joints!.map(() => 0.2) });
    expectHinged(group, rig);
    expectSealed(group, rig);
    expect(group.getObjectByName(rig.sections![1]!.node)!.rotation.y).toBeCloseTo(0.7, 9);
  }, 30_000);
});

describe("a vehicle of three sections", () => {
  /** Three boxes hinged in the middle of the 1 m gaps between them, a joint across each gap. */
  function threeSections(): MeshBuilder {
    const m = new MeshBuilder({ body: { color: "#dddddd" }, bellows: { color: "#333333" } });
    const bodies: Array<[number, number]> = [[0.5, 4.5], [-4.5, -0.5], [-9.5, -5.5]];
    const sections: SectionRig[] = [{ node: "section0", pivot: [0, 0, 0] }, { node: "section1", pivot: [0, 0.6, 0] }, { node: "section2", pivot: [-5, 0.6, 0] }];
    sections.forEach((s, i) => m.part(s.node, s.pivot, () => block(m, "body", bodies[i]![0], bodies[i]![1], 0.3, 2.8, -1.2, 1.2)));
    const joints: JointRig[] = [0, 1].map((i) => ({
      node: `joint${i}`, sections: [i, i + 1], front: bodies[i]![0], rear: bodies[i + 1]![1], folds: 4, depth: 0.05, material: "bellows",
      profile: [[-1.1, 0.4], [1.1, 0.4], [1.1, 2.7], [-1.1, 2.7]],
    }));
    for (const j of joints) m.part(j.node, [0, 0, 0], () => drawJoint(m, j, sections));
    m.rig = { sections, joints, maxBendDeg: 40 };
    return m;
  }

  it("bends at both hinges, each joint sealed, from the GLB the game loads", async () => {
    const scene = await loadGlb(threeSections().toGlb("test", "three"));
    const rig = scene.userData.rig as VehicleRig;
    expect(rig.joints!.length).toBe(2);
    pose(scene, { bend: [0.5, -0.3] });
    expectHinged(scene, rig);
    expectSealed(scene, rig);
    expect(scene.getObjectByName("section1")!.rotation.y).toBeCloseTo(0.5, 9);
    expect(scene.getObjectByName("section2")!.rotation.y).toBeCloseTo(0.2, 9);
  });

  it("gets a slider per joint on the site", () => {
    const rig = threeSections().rig!;
    expect(poseControls({ rig } as CatalogRecord)).toEqual([
      { key: "bend0", label: "Joint 1", max: 40 },
      { key: "bend1", label: "Joint 2", max: 40 },
    ]);
    expect(poseOf({ rig } as CatalogRecord, { bend1: 10 }).bend).toEqual([0, 10 * DEG]);
  });
});

/** A posed model's triangles by rig node: every rig node, and the front body or the root. */
function ownedTriangles(group: THREE.Object3D, rig: VehicleRig): Array<{ t: Tri; owner: string }> {
  const nodes = new Set([...(rig.sections ?? []).map((s) => s.node), ...(rig.joints ?? []).map((j) => j.node), ...(rig.steer?.axles ?? []).flatMap((a) => a.nodes), group.name]);
  return worldTriangles(group, nodes);
}

/**
 * How many pairs of a triangle owned per `a` and one owned per `b` cut through
 * each other in the posed model but not at rest; a triangle `skip` accepts (an
 * axle beam's end, the king pin) never counts.
 */
function newClashes(rest: Array<{ t: Tri; owner: string }>, posed: Array<{ t: Tri; owner: string }>, a: (o: string) => boolean, b: (o: string) => boolean, skip: (t: Tri) => boolean = () => false): number {
  const pick = (all: Array<{ t: Tri; owner: string }>, f: (o: string) => boolean): Tri[] => all.filter((x) => f(x.owner)).map((x) => x.t);
  const before = intersectingPairs(pick(rest, a), pick(rest, b));
  const [pa, pb] = [pick(posed, a), pick(posed, b)];
  return [...intersectingPairs(pa, pb)].filter((key) => {
    if (before.has(key)) return false;
    const [i, j] = key.split(":").map(Number);
    return !skip(pa[i!]!) && !skip(pb[j!]!);
  }).length;
}

describe("the semi-trucks", () => {
  const SEMIS = RIGGED.filter(([id]) => DESIGNS.get(id)!.build().rig!.sections?.[1]?.node === "trailer");

  it("are the American truck and the two reproduced from the game", () => {
    expect(SEMIS.map(([id]) => id).sort()).toEqual(["veh-american-truck", "veh-cistern-semi-truck", "veh-reefer-semi-truck"]);
  });

  // nothing of the trailer cuts through the tractor or its wheels at any bend up to the rig's limit
  it.each(SEMIS)("%s swings its trailer clear of the tractor up to its bend limit", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const [px, , pz] = rig.sections![1]!.pivot;
    const rest = ownedTriangles(group, rig);
    // the king pin turns in the fifth wheel's slot: it is meant to be there
    const kingPin = (t: Tri): boolean => t.every((p) => Math.hypot(p[0] - px, p[2] - pz) < 0.12);
    const max = rig.maxBendDeg!;
    for (const deg of [max / 3, (2 * max) / 3, max, -max / 3, (-2 * max) / 3, -max]) {
      mod.pose(group, { bend: [deg * DEG] });
      const clashes = newClashes(rest, ownedTriangles(group, rig), (o) => o === "trailer", (o) => o !== "trailer", kingPin);
      expect(clashes, `bend ${deg.toFixed(0)} degrees`).toBe(0);
    }
  }, 60_000);
});

describe("the steered wheels", () => {
  // at the steering lock no tyre, disc or hub cuts into the body; the axle beam's
  // end, which reaches into the hub, turns with nothing
  it.each(STEERED)("%s clears the body at full lock", async (id) => {
    const mod = await moduleOf(id);
    const group = mod.default(THREE);
    const rig = group.userData.rig as VehicleRig;
    const wheels = new Set(rig.steer!.axles.flatMap((a) => a.nodes));
    group.updateMatrixWorld(true);
    const centres = [...wheels].map((n) => new THREE.Vector3().setFromMatrixPosition(group.getObjectByName(n)!.matrixWorld));
    const beam = (t: Tri): boolean => centres.some((c) => t.every((p) => Math.abs(p[0] - c.x) < 0.12 && Math.abs(p[1] - c.y) < 0.12));
    const rest = ownedTriangles(group, rig);
    for (const sign of [1, -1]) {
      mod.pose(group, { steer: sign * steerLock(rig.steer!) });
      const clashes = newClashes(rest, ownedTriangles(group, rig), (o) => wheels.has(o), (o) => !wheels.has(o), beam);
      expect(clashes, `steer ${sign > 0 ? "+" : "-"}lock`).toBe(0);
    }
  }, 60_000);
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

  it("pose a non-default build with its own rig, not the catalog record's default one", async () => {
    const mod = await moduleOf("veh-karosa-long");
    const record = { rig: DESIGNS.get("veh-karosa-long")!.build().rig } as CatalogRecord;
    const group = mod.default(THREE, { variant: "b941" });
    const own = group.userData.rig as VehicleRig;
    // the variant's hinge is not the default's, which is what the record holds
    expect(own.sections![1]!.pivot[0]).not.toBeCloseTo(record.rig!.sections![1]!.pivot[0], 2);
    expect(posePreview(mod, group, poseOf(record, { steer: 10 }))).toBe(true);
    expect(group.getObjectByName("section1")!.position.x).toBeCloseTo(own.sections![1]!.pivot[0], 9);
    expectSealed(group, own);
    expect(posePreview({}, group, poseOf(record, {}))).toBe(false);
  }, 30_000);

  it("know which model and values a preview was built for", () => {
    expect(previewKey("veh-a", { b: "2", a: "1" })).toBe(previewKey("veh-a", { a: "1", b: "2" }));
    expect(previewKey("veh-a", { a: "1" })).not.toBe(previewKey("veh-a", { a: "2" }));
    expect(previewKey("veh-a", {})).not.toBe(previewKey("veh-b", {}));
  });

  it("keep their arrow keys: the page steps only when no control has the focus", () => {
    expect(pageKey("ArrowRight", { tagName: "INPUT" })).toBeNull();
    expect(pageKey("ArrowLeft", { tagName: "select" })).toBeNull();
    expect(pageKey("ArrowLeft", { tagName: "DIV", isContentEditable: true })).toBeNull();
    expect(pageKey("ArrowLeft", { tagName: "BODY" })).toBe(-1);
    expect(pageKey("ArrowRight", null)).toBe(1);
    expect(pageKey("Escape", { tagName: "INPUT" })).toBe("close");
    expect(pageKey("a", { tagName: "BODY" })).toBeNull();
  });
});
