// The lean MeshBuilder of a model's standalone JS file (jsModel.ts): MeshCore's
// geometry and a toGroup() that builds a three.js Group from it. A model's bundle
// swaps this module in for meshBuilder.ts, so the recorder and the GLB writer
// never reach the file. No imports of three.js: the caller hands the namespace in.

import { MeshCore } from "./meshCore.ts";

export { chamferedRect, grow, ngon, rect, scaleRing } from "./meshCore.ts";
export type { AnimationClipSpec, ClipDrive, AnimationTrack, Emitter, FountainWater, MaterialSpec, Ring, SweepAxis, WaterJet, WaterPool } from "./meshCore.ts";

/** The three.js namespace, or any object with the classes toGroup() uses. */
export type ThreeNamespace = typeof import("three");

export class MeshBuilder extends MeshCore {
  /**
   * The finished model as a `THREE.Group` named `name`: a Mesh per material in
   * material name order. Without parts the meshes are the group's children; with
   * parts (see `part`) each part is a Group named after it, positioned at its
   * pivot (a child part inside its parent's Group), its meshes' positions
   * relative to that pivot. A rigged model's group carries `userData.rig`, a model
   * that smokes `userData.emitters`, a fountain `userData.fountain`. Non-indexed
   * triangle soups with flat per-face normals, MeshStandardMaterial colours from
   * the palette's sRGB hex: the same data toGlb writes.
   */
  toGroup(THREE: ThreeNamespace, name = "model"): InstanceType<ThreeNamespace["Group"]> {
    const root = new THREE.Group();
    root.name = name;
    if (this.parts.length) {
      for (const g of this.groups.values()) {
        if (g.part.includes(-1)) throw new Error("a model with parts drew a triangle outside any part");
      }
    }
    const materials = [...this.groups.keys()].sort();
    const standard = materials.map((mat) => {
      const spec = this.palette[mat]!;
      const m = new THREE.MeshStandardMaterial({ color: spec.color, metalness: spec.metallic ?? 0, roughness: spec.roughness ?? 0.85 });
      m.name = mat;
      return m;
    });
    const units = this.parts.length
      ? this.parts.map((p, index) => ({ name: p.name, pivot: p.pivot, index }))
      : [{ name, pivot: [0, 0, 0] as [number, number, number], index: -1 }];
    const holders: Array<InstanceType<ThreeNamespace["Group"]>> = [];
    for (const unit of units) {
      const holder = unit.index >= 0 ? new THREE.Group() : root;
      if (unit.index >= 0) {
        const at = this.partOffset(unit.index);
        holder.name = unit.name;
        holder.position.set(at[0], at[1], at[2]);
        const parent = this.parts[unit.index]!.parent;
        (parent >= 0 ? holders[parent]! : root).add(holder);
        holders.push(holder);
      }
      materials.forEach((mat, m) => {
        const g = this.groups.get(mat)!;
        const pos: number[] = [];
        const nrm: number[] = [];
        for (let t = 0; t < g.part.length; t++) {
          if (unit.index >= 0 && g.part[t] !== unit.index) continue;
          for (let k = 0; k < 9; k++) {
            pos.push(g.pos[t * 9 + k]! - unit.pivot[k % 3]!);
            nrm.push(g.nrm[t * 9 + k]!);
          }
        }
        if (pos.length === 0) return;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
        geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nrm), 3));
        const mesh = new THREE.Mesh(geometry, standard[m]);
        mesh.name = mat;
        holder.add(mesh);
      });
    }
    root.animations = this.clips.map((clip) => new THREE.AnimationClip(
      clip.name,
      clip.times[clip.times.length - 1]!,
      clip.tracks.map((t) => t.path === "rotation"
        ? new THREE.QuaternionKeyframeTrack(`${t.node}.quaternion`, clip.times, t.values)
        : new THREE.VectorKeyframeTrack(`${t.node}.position`, clip.times, t.values)),
    ));
    // a deep copy, as GLTFLoader hands the GLB's scene extras over
    if (this.rig) root.userData.rig = JSON.parse(JSON.stringify(this.rig));
    // where the model smokes, steams or flares (MeshCore.emit), model coordinates
    if (this.emitterList.length) root.userData.emitters = JSON.parse(JSON.stringify(this.emitterList));
    // a fountain's water: its pools and jets (MeshCore.pool / jet), model coordinates
    if (this.water) root.userData.fountain = JSON.parse(JSON.stringify(this.water));
    // what plays each clip (MeshCore.clipDrives): a time loop or the distance travelled
    const drives = this.clipDrives();
    if (drives) root.userData.clipDrives = drives;
    return root;
  }
}
