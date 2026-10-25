// The lean MeshBuilder of a model's standalone JS file (jsModel.ts): MeshCore's
// geometry and a toGroup() that builds a three.js Group from it. A model's bundle
// swaps this module in for meshBuilder.ts, so the recorder and the GLB writer
// never reach the file. No imports of three.js: the caller hands the namespace in.

import { MeshCore } from "./meshCore.ts";
import { surfaceTable, surfaceUvs } from "./surfaceUvs.ts";
import { interiorTable } from "./interiorTable.ts";

export { chamferedRect, grow, ngon, rect, scaleRing } from "./meshCore.ts";
export type { AnimationClipSpec, ClipDrive, AnimationTrack, Emitter, FountainWater, LampRole, LampSpec, Lamps, MaterialSpec, Ring, SweepAxis, WaterJet, WaterPool } from "./meshCore.ts";

/** The three.js namespace, or any object with the classes toGroup() uses. */
export type ThreeNamespace = typeof import("three");


export class MeshBuilder extends MeshCore {
  /**
   * The finished model as a `THREE.Group` named `name`: a Mesh per material in
   * material name order. Without parts the meshes are the group's children; with
   * parts (see `part`) each part is a Group named after it, positioned at its
   * pivot (a child part inside its parent's Group), its meshes' positions
   * relative to that pivot. A rigged model's group carries `userData.rig`, a model
   * that smokes `userData.emitters`, a fountain `userData.fountain`, a vehicle with
   * lamps `userData.lamps`, one with an interior `userData.interiors` (its interior
   * Groups built hidden). Non-indexed
   * triangle soups with flat per-face normals, MeshStandardMaterial colours from
   * the palette's sRGB hex: the same data toGlb writes.
   */
  toGroup(THREE: ThreeNamespace, name = "model"): InstanceType<ThreeNamespace["Group"]> {
    const root = new THREE.Group();
    root.name = name;
    const materials = [...this.groups.keys()].sort();
    const standard = materials.map((mat) => {
      const spec = this.palette[mat]!;
      const m = new THREE.MeshStandardMaterial({
        color: spec.color, metalness: spec.metallic ?? 0, roughness: spec.roughness ?? 0.85,
        ...(spec.doubleSided ? { side: THREE.DoubleSide } : {}),
        ...(this.groups.get(mat)!.col ? { vertexColors: true } : {}),
      });
      m.name = mat;
      return m;
    });
    // a rigid rail vehicle with bogies: its body's meshes on the root, a Group per bogie
    const units = this.outputUnits(name);
    const holders: Array<InstanceType<ThreeNamespace["Group"]>> = [];
    for (const unit of units) {
      const holder = unit.index >= 0 ? new THREE.Group() : root;
      if (unit.index >= 0) {
        const at = this.partOffset(unit.index);
        holder.name = unit.name;
        holder.position.set(at[0], at[1], at[2]);
        const parent = this.parts[unit.index]!.parent;
        (parent >= 0 ? holders[parent]! : root).add(holder);
        holders[unit.index] = holder;
      }
      materials.forEach((mat, m) => {
        const g = this.groups.get(mat)!;
        const pos: number[] = [];
        const nrm: number[] = [];
        const col: number[] = [];
        for (let t = 0; t < g.part.length; t++) {
          if (g.part[t] !== unit.index && (unit.index >= 0 || units.length > 1)) continue;
          for (let k = 0; k < 9; k++) {
            pos.push(g.pos[t * 9 + k]! - unit.pivot[k % 3]!);
            nrm.push(g.nrm[t * 9 + k]!);
            if (g.col) col.push(g.col[t * 9 + k]!);
          }
        }
        if (pos.length === 0) return;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
        geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nrm), 3));
        // baked corner colours (MeshCore.triShaded): linear multipliers of the material colour
        if (g.col) geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
        // a named surface: box-projected UVs in model units, per triangle (docs/models/surfaces.md)
        surfaceUvs(THREE, geometry, this.palette[mat]!, pos, unit.pivot);
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
    const data = root.userData;
    // a deep copy, as GLTFLoader hands the GLB's scene extras over
    const copy = (v: unknown): unknown => JSON.parse(JSON.stringify(v));
    if (this.rig) data.rig = copy(this.rig);
    // where the model smokes, steams or flares (MeshCore.emit), model coordinates
    if (this.emitterList.length) data.emitters = copy(this.emitterList);
    // a fountain's water: its pools and jets (MeshCore.pool / jet), model coordinates
    if (this.water) data.fountain = copy(this.water);
    // what plays each clip (MeshCore.clipDrives): a time loop, the distance travelled or a state
    const drives = this.clipDrives();
    if (drives) data.clipDrives = drives;
    // the lamp materials and where the model's ends meet (MeshCore.lamps)
    const lamps = this.lamps();
    if (lamps) data.lamps = lamps;
    // the materials that draw with a named surface, which the game binds a photo to
    surfaceTable(root, this.palette, materials);
    // a vehicle's interiors, hidden, and the door clips that reveal each (interiorTable.ts)
    interiorTable(root, this.parts, this.clips);
    return root;
  }
}

