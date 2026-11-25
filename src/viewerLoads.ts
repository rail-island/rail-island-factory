// The 3D preview's freight loads, apart from the viewer so the tests can drive
// them without a WebGL context (docs/models/loads.md). A freight vehicle lists
// its load parts and the commodities each stands for (userData.loads); the build
// hands them over hidden. The preview's Load select shows the parts of one
// commodity -- as the game shows what a vehicle carries -- scaled in y with the
// fill from the bed they are pivoted on, or none (Empty).

import type { Object3D } from "three";

/** One load part of a built model: its group and the commodities it stands for. */
export interface Load {
  group: Object3D;
  commodities: readonly string[];
}

/** The load parts of a built model (userData.loads); empty without any. */
export function loadsOf(root: Object3D): Load[] {
  const table = root.userData.loads as Array<{ part: string; commodities: string[] }> | undefined;
  const out: Load[] = [];
  for (const l of table ?? []) {
    const group = root.getObjectByName(l.part);
    if (group) out.push({ group, commodities: l.commodities });
  }
  return out;
}

/** The commodities a model's loads can show, each once, in the order its parts list them. */
export function loadChoices(loads: readonly Load[]): string[] {
  return [...new Set(loads.flatMap((l) => l.commodities))];
}

/** A commodity id as the Load select names it: "iron-ore" -> "Iron ore". */
export function commodityTitle(id: string): string {
  const words = id.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Shows the load parts standing for `commodity` scaled in y to `fill` (0..1)
 * from their pivot on the bed, and hides the rest; null (Empty) or a fill of 0
 * hides every one.
 */
export function applyLoads(loads: readonly Load[], commodity: string | null, fill: number): void {
  const f = Math.min(1, Math.max(0, fill));
  for (const l of loads) {
    l.group.visible = commodity !== null && f > 0 && l.commodities.includes(commodity);
    l.group.scale.y = f > 0 ? f : 1;
  }
}

/**
 * Shows a built model loaded as its thumbnail is: the parts of its first load's
 * first commodity, full (docs/models/loads.md). The variant thumbnails and the
 * OpenTTD sprites draw a freight vehicle so.
 */
export function showFirstLoad(root: Object3D): void {
  const loads = loadsOf(root);
  applyLoads(loads, loadChoices(loads)[0] ?? null, 1);
}
