// Shared checks of a posed vehicle rig (generator/rig.ts), for test/rig.test.ts
// and the catalog sweep (test/catalogSweep.ts).

import { expect } from "vitest";
import * as THREE from "three";
import { jointTriangles, type JointRig, type VehicleRig } from "../generator/rig";

/** A joint's mesh: the joint node, or the child holding its material. */
export function jointMesh(root: THREE.Object3D, j: JointRig): THREE.Mesh {
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
export function expectSealed(root: THREE.Object3D, rig: VehicleRig, tolerance = 1e-4): void {
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

