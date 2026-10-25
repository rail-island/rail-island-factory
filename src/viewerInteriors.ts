// The 3D preview's vehicle interiors, apart from the viewer so the tests can drive
// them without a WebGL context (docs/models/interiors.md). A model names its
// interior groups and the door clips that reveal each (userData.interiors); the
// build hands them over hidden. The preview shows an interior while any of its
// doors stands open or opening -- as the game is to -- or, with the Interior
// toggle, always, the model cut away above the highest ceiling so the seats show
// from above.

import { Box3, type Object3D } from "three";

export type DoorSide = "left" | "right";

/** One interior group of a built model and the sides of the door clips that reveal it. */
export interface Interior {
  group: Object3D;
  sides: DoorSide[];
}

/** The interiors of a built model (userData.interiors, the clips' sides from userData.clipDrives); empty without any. */
export function interiorsOf(root: Object3D): Interior[] {
  const table = root.userData.interiors as Record<string, string[]> | undefined;
  if (!table) return [];
  const drives = (root.userData.clipDrives ?? {}) as Record<string, { drive?: string; side?: string }>;
  const out: Interior[] = [];
  for (const [name, clips] of Object.entries(table)) {
    const group = root.getObjectByName(name);
    if (!group) continue;
    const sides = [...new Set(clips.map((c) => drives[c]?.side).filter((s): s is DoorSide => s === "left" || s === "right"))];
    out.push({ group, sides });
  }
  return out;
}

/**
 * Shows each interior while a door that reveals it stands above shut (`doorAt`,
 * 0 shut .. 1 open, per side), or every one when `forced`; hides it otherwise.
 */
export function applyInteriors(interiors: readonly Interior[], doorAt: Readonly<Record<DoorSide, number>>, forced: boolean): void {
  for (const it of interiors) it.group.visible = forced || it.sides.some((s) => doorAt[s] > 0);
}

/** The height the Interior toggle cuts the model away above: just under the highest ceiling. */
export function cutHeight(interiors: readonly Interior[]): number {
  let top = -Infinity;
  for (const it of interiors) top = Math.max(top, new Box3().setFromObject(it.group).max.y);
  return top - 0.02;
}
