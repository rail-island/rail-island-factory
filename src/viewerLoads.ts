// The 3D preview's freight loads, apart from the viewer so the tests can drive
// them without a WebGL context (docs/models/loads.md). A freight vehicle lists
// its load parts and the commodities each stands for (userData.loads); the build
// hands them over hidden. The preview's Load select shows the parts of one
// commodity -- as the game shows what a vehicle carries -- or none (Empty), with
// the fill as the game shows it: a stepped load (discrete items) its first
// ceil(fill * steps) steps, a heap scaled in y from the bed it is pivoted on.

import type { Object3D } from "three";

/** One load part of a built model: its group, the commodities it stands for and a stepped load's step groups in fill order. */
export interface Load {
  group: Object3D;
  commodities: readonly string[];
  /** A stepped load's `step-<i>` children, step 0 first; null for a heap. */
  steps: Object3D[] | null;
}

/** The load parts of a built model (userData.loads); empty without any. */
export function loadsOf(root: Object3D): Load[] {
  const table = root.userData.loads as Array<{ part: string; commodities: string[]; steps?: number }> | undefined;
  const out: Load[] = [];
  for (const l of table ?? []) {
    const group = root.getObjectByName(l.part);
    if (!group) continue;
    const steps = l.steps ? Array.from({ length: l.steps }, (_, i) => group.children.find((c) => c.name === `step-${i}`)) : null;
    out.push({ group, commodities: l.commodities, steps: steps && steps.every((s) => s) ? (steps as Object3D[]) : null });
  }
  return out;
}

/** The commodities a model's loads can show, each once, in the order its parts list them. */
export function loadChoices(loads: readonly Load[]): string[] {
  return [...new Set(loads.flatMap((l) => l.commodities))];
}

/** The `load` address value (catalogQuery.ts ViewState.load) that asks for no load. */
export const EMPTY_LOAD = "empty";

/**
 * The load a model opens with: the one the address names (`?load=`, a Chains card's
 * commodity) when its parts stand for it, none for `empty`, else the first, as the
 * thumbnail (docs/models/loads.md).
 */
export function initialLoad(choices: readonly string[], wanted: string | null | undefined): string | null {
  if (wanted === EMPTY_LOAD) return null;
  if (wanted && choices.includes(wanted)) return wanted;
  return choices[0] ?? null;
}

/** A commodity id as the Load select names it: "iron-ore" -> "Iron ore". */
export function commodityTitle(id: string): string {
  const words = id.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** How many of a stepped load's `steps` the game shows at `fill` (0..1): ceil(fill * steps). */
export function shownSteps(steps: number, fill: number): number {
  return Math.ceil(Math.min(1, Math.max(0, fill)) * steps - 1e-9);
}

/**
 * Shows the load parts standing for `commodity` `fill` (0..1) full and hides the
 * rest, as the game does (docs/models/loads.md): a stepped load its first
 * ceil(fill * steps) steps at full size, a heap scaled in y to `fill` from its
 * pivot on the bed. Null (Empty) or a fill of 0 hides every one.
 */
export function applyLoads(loads: readonly Load[], commodity: string | null, fill: number): void {
  const f = Math.min(1, Math.max(0, fill));
  for (const l of loads) {
    l.group.visible = commodity !== null && f > 0 && l.commodities.includes(commodity);
    if (l.steps) {
      l.group.scale.y = 1;
      const shown = shownSteps(l.steps.length, f);
      l.steps.forEach((s, i) => (s.visible = i < shown));
    } else l.group.scale.y = f > 0 ? f : 1;
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
