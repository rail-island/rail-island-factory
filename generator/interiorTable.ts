// Which door clips reveal each interior part of a vehicle (interior.ts,
// docs/models/interiors.md), and the JS model's half of it: its interior Groups
// built hidden, the table on the group's userData. An interior part is a child
// part named `interior` or `interior-<car>[-<n>]`; its car's door clips are
// `doors-<side>-<car>` (`doors-<side>` outside any part). jsModel.ts swaps this
// module for a no-op in the bundle of a design that draws no interior, so only
// the designs with one carry the code.

import type { AnimationClipSpec, Vec3 } from "./meshCore.ts";

type Part = { name: string; pivot: Vec3; parent: number };

/** Whether a part is an interior, by its name. */
export const isInteriorName = (name: string): boolean => /^interior(-|$)/.test(name);

/**
 * The door clips that reveal each interior part, by part name; null for a model
 * without an interior. Throws for an interior no door clip of its car reveals.
 */
export function interiorsOf(parts: readonly Part[], clips: readonly AnimationClipSpec[]): Record<string, string[]> | null {
  const out: Record<string, string[]> = {};
  for (const p of parts) {
    if (!isInteriorName(p.name)) continue;
    const car = p.parent >= 0 ? `-${parts[p.parent]!.name}` : "";
    const names = clips.filter((c) => c.drive.drive === "door" && c.name === `doors-${c.drive.side}${car}`).map((c) => c.name).sort();
    if (!names.length) throw new Error(`${p.name}: no door clip of its car reveals it`);
    out[p.name] = names;
  }
  return Object.keys(out).length ? out : null;
}

/** The JS model's interiors: each interior Group hidden, the table on `root.userData.interiors`. */
export function interiorTable(root: { userData: Record<string, unknown>; getObjectByName: (name: string) => { visible: boolean } | undefined }, parts: readonly Part[], clips: readonly AnimationClipSpec[]): void {
  const table = interiorsOf(parts, clips);
  if (!table) return;
  for (const name of Object.keys(table)) root.getObjectByName(name)!.visible = false;
  root.userData.interiors = table;
}
