// The load part (docs/models/loads.md), apart from the mesh core so a model that
// carries no load bundles none of it: `loadPart` draws a freight vehicle's load
// as a hidden child part and lists it on the builder (`MeshCore.loadParts`), and
// `budgetTriangles` counts a model as its triangle budget does - the exterior and
// the largest load shown at once. A load of discrete items (tubes, logs, bundles,
// pallets, containers, cars) is stepped: its items go into `step-<i>` child parts
// in fill order, and the game shows the first `ceil(fill * steps)` of them; a heap
// is not, and the game scales it in y with the fill.

import type { MeshCore, Vec3 } from "./meshCore.ts";

/** What a builder keeps that this module reads and writes (MeshCore's protected fields). */
type Inside = {
  parts: Array<{ name: string; pivot: Vec3; parent: number; moving?: boolean }>;
  groups: Map<string, { part: number[] }>;
  currentPart: number;
  drawing: boolean;
};

/** One load part as `MeshCore.loadParts`, `userData.loads` and the GLB's `extras.loads` list it. */
export interface LoadEntry {
  part: string;
  commodities: string[];
  /** A stepped load's step count (2 or more): its `step-0` .. `step-<steps-1>` children; absent for a heap. */
  steps?: number;
}

/** Draws `draw` into step `i` (0 the first loaded) of the stepped load being drawn. */
export type Step = (i: number, draw: () => void) => void;

/** The most steps a load part has: more items share a step. */
export const MAX_LOAD_STEPS = 16;

/** The name of a stepped load part's step `i` (a direct child of the load part). */
export const stepName = (i: number): string => `step-${i}`;

/**
 * How `count` items, listed in fill order, group into steps: at most
 * `MAX_LOAD_STEPS`, each step the same run of consecutive items (`per`), the last
 * perhaps fewer. `of(k)` is item k's step.
 */
export function itemSteps(count: number, max = MAX_LOAD_STEPS): { steps: number; of: (k: number) => number } {
  const per = Math.max(1, Math.ceil(count / max));
  return { steps: Math.ceil(count / per), of: (k) => Math.floor(k / per) };
}

/**
 * Draws `fn` as a load: a child part of the part being drawn, named
 * `load-<first commodity>` (`load-<commodity>-<car>` inside a car part, `-2`,
 * `-3` for a second one there), pivoted at `floor` -- a point on the bed it rests
 * on. It stands for every commodity in `commodities`; the JS model builds it
 * hidden and lists it in `userData.loads`.
 *
 * Without `steps` it is a heap: the game scales it in y from 0 (empty) to 1
 * (full), and `fn` draws straight into it. With `steps` (2 or more) it is stepped:
 * it gets `steps` child parts `step-0` .. in fill order, pivoted at `floor` too,
 * `fn` draws every triangle through `step(i, draw)`, and every step must get some.
 */
export function loadPart<T>(m: MeshCore, commodities: readonly string[], floor: Vec3, fn: (step: Step) => T, opts: { steps?: number } = {}): T {
  if (!commodities.length) throw new Error("a load part stands for at least one commodity");
  const steps = opts.steps;
  if (steps !== undefined && (!Number.isInteger(steps) || steps < 2 || steps > MAX_LOAD_STEPS)) throw new Error(`a stepped load has 2 to ${MAX_LOAD_STEPS} steps, not ${steps}`);
  const inside = m as unknown as Inside;
  const parts = inside.parts;
  const car = m.currentPartName();
  const base = `load-${commodities[0]}${car ? `-${car}` : ""}`;
  let name = base;
  for (let k = 2; parts.some((p) => p.name === name); k++) name = `${base}-${k}`;
  (m.loadParts ??= []).push({ part: name, commodities: [...commodities], ...(steps ? { steps } : {}) });
  // the LOD fitting counts a model with loads as its budget does (lodKit.ts fitLod)
  m.loadBudget ??= () => budgetTriangles(m);
  // the JS model's half (threeBuilder.ts toGroup): its load Groups hidden, the list on its userData
  m.hideLoads ??= (root) => {
    for (const l of m.loadParts!) root.getObjectByName(l.part)!.visible = false;
    root.userData.loads = JSON.parse(JSON.stringify(m.loadParts)) as unknown;
  };
  return m.spin(name, floor, () => {
    const load = inside.currentPart;
    if (!steps) return fn(() => { throw new Error(`${name}: step() in a load drawn without steps`); });
    // the steps: children of the load part in fill order, on its pivot (their names repeat across loads)
    const first = parts.length;
    for (let i = 0; i < steps; i++) parts.push({ name: stepName(i), pivot: [...floor], parent: load, moving: true });
    let open = true;
    const step: Step = (i, draw) => {
      if (!open) throw new Error(`${name}: step() after the load was drawn`);
      if (inside.drawing) throw new Error(`${name}: step() inside a primitive call`);
      if (!Number.isInteger(i) || i < 0 || i >= steps) throw new Error(`${name}: no step ${i} of ${steps}`);
      const outer = inside.currentPart;
      inside.currentPart = first + i;
      try {
        draw();
      } finally {
        inside.currentPart = outer;
      }
    };
    let out: T;
    try {
      out = fn(step);
    } finally {
      open = false;
    }
    {
      const counts = new Array<number>(steps + 1).fill(0);
      for (const g of inside.groups.values()) for (const p of g.part) if (p === load) counts[steps]!++; else if (p >= first && p < first + steps) counts[p - first]!++;
      if (counts[steps]) throw new Error(`${name}: ${counts[steps]} triangles drawn outside its steps`);
      const empty = counts.slice(0, steps).findIndex((n) => n === 0);
      if (empty >= 0) throw new Error(`${name}: step ${empty} of ${steps} draws nothing`);
    }
    return out;
  });
}

/**
 * A stepped load of `count` items (loadPart with steps): `fn` draws item k
 * through `item(k, draw)`, items numbered in fill order (the bottom layer first),
 * grouped into steps by `itemSteps`. One item, or `count` under 2, draws a load
 * without steps.
 */
export function itemLoadPart<T>(m: MeshCore, commodities: readonly string[], floor: Vec3, count: number, fn: (item: Step) => T): T {
  const { steps, of } = itemSteps(count);
  if (steps < 2) return loadPart(m, commodities, floor, () => fn((_, draw) => draw()));
  return loadPart(m, commodities, floor, (step) => fn((k, draw) => step(of(k), draw)), { steps });
}

/** Per load part (as `m.loadParts` lists them), how many triangles it holds, its child parts' included. */
export function loadTriangleCounts(m: MeshCore): number[] {
  const loads = m.loadParts ?? [];
  const { parts, groups } = m as unknown as Inside;
  const of = parts.map((_, i) => {
    for (let p = i; p >= 0; p = parts[p]!.parent) {
      const k = loads.findIndex((l) => l.part === parts[p]!.name);
      if (k >= 0) return k;
    }
    return -1;
  });
  const counts = loads.map(() => 0);
  for (const g of groups.values()) for (const part of g.part) if (part >= 0 && of[part]! >= 0) counts[of[part]!]!++;
  return counts;
}

/**
 * A model's triangles as its budget counts them: everything but its loads, and
 * the largest load shown at once -- per commodity the parts standing for it (one
 * per car) together, full.
 */
export function budgetTriangles(m: MeshCore): number {
  const counts = loadTriangleCounts(m);
  const per = new Map<string, number>();
  (m.loadParts ?? []).forEach((l, k) => { for (const c of l.commodities) per.set(c, (per.get(c) ?? 0) + counts[k]!); });
  return m.triangleCount() - counts.reduce((a, b) => a + b, 0) + Math.max(0, ...per.values());
}
