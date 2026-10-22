// The 3D preview's Lights toggle, apart from the viewer so the tests can drive it
// without a WebGL context: every mesh whose material the model names as a lamp
// (userData.lamps, docs/models/lamps.md) gets a lit twin -- its lit colour as the
// emissive, at its intensity -- and switching the lights on swaps the twins in.
// Indicators blink. It shows what the game will light, to check a design's
// tagging by eye; it does not split the ends the way the game does, so a lamp
// shines at both ends at once here.

import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from "three";

/** What the model names as its lamps (the factory's Lamps). */
interface LampTable {
  midX: number;
  materials: Record<string, { role: string; lit: string; intensity: number }>;
}

/** One lamp mesh with its unlit and lit materials. */
export interface Lamp {
  mesh: Mesh;
  role: string;
  base: Material;
  lit: MeshStandardMaterial;
}

/** How long an indicator stays lit, then dark (s). */
export const BLINK_PERIOD = 0.8;

/** The lamp meshes of a built model; empty for a model without lamps. */
export function lampsOf(root: Object3D): Lamp[] {
  let table: LampTable | undefined;
  root.traverse((o) => {
    if (!table && o.userData.lamps) table = o.userData.lamps as LampTable;
  });
  if (!table) return [];
  const out: Lamp[] = [];
  const t = table;
  root.traverse((o) => {
    if (!(o instanceof Mesh) || Array.isArray(o.material)) return;
    const spec = t.materials[(o.material as Material).name];
    if (!spec) return;
    const base = o.material as MeshStandardMaterial;
    const lit = base.clone();
    lit.color = new Color(spec.lit);
    lit.emissive = new Color(spec.lit);
    lit.emissiveIntensity = spec.intensity;
    out.push({ mesh: o, role: spec.role, base, lit });
  });
  return out;
}

/** Whether an indicator is lit at `t` seconds into its blinking. */
export function blinkOn(t: number): boolean {
  return t % BLINK_PERIOD < BLINK_PERIOD / 2;
}

/** Shows every lamp lit (indicators by `t`), or -- with `on` false -- every lamp as built. */
export function applyLamps(lamps: readonly Lamp[], on: boolean, t = 0): void {
  for (const l of lamps) l.mesh.material = on && (l.role !== "indicator" || blinkOn(t)) ? l.lit : l.base;
}

/** Disposes the lit twins (the base materials belong to the model). */
export function disposeLamps(lamps: readonly Lamp[]): void {
  for (const l of lamps) l.lit.dispose();
}
