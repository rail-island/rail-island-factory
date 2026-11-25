// The load part (docs/models/loads.md), apart from the mesh core so a model that
// carries no load bundles none of it: `loadPart` draws a freight vehicle's load
// as a hidden child part and lists it on the builder (`MeshCore.loadParts`), and
// `budgetTriangles` counts a model as its triangle budget does - the exterior and
// the largest load shown at once.

import type { MeshCore, Vec3 } from "./meshCore.ts";

/** What a builder keeps that this module reads (MeshCore's protected fields). */
type Inside = { parts: Array<{ name: string; parent: number }>; groups: Map<string, { part: number[] }> };

/**
 * Draws `fn` as a load: a child part of the part being drawn, named
 * `load-<first commodity>` (`load-<commodity>-<car>` inside a car part, `-2`,
 * `-3` for a second one there), pivoted at `floor` -- a point on the bed it rests
 * on, so a consumer can scale it in y from 0 (empty) to 1 (full). It stands for
 * every commodity in `commodities`; the JS model builds it hidden and lists it in
 * `userData.loads`.
 */
export function loadPart<T>(m: MeshCore, commodities: readonly string[], floor: Vec3, fn: () => T): T {
  if (!commodities.length) throw new Error("a load part stands for at least one commodity");
  const parts = (m as unknown as Inside).parts;
  const car = m.currentPartName();
  const base = `load-${commodities[0]}${car ? `-${car}` : ""}`;
  let name = base;
  for (let k = 2; parts.some((p) => p.name === name); k++) name = `${base}-${k}`;
  (m.loadParts ??= []).push({ part: name, commodities: [...commodities] });
  // the LOD fitting counts a model with loads as its budget does (lodKit.ts fitLod)
  m.loadBudget ??= () => budgetTriangles(m);
  // the JS model's half (threeBuilder.ts toGroup): its load Groups hidden, the list on its userData
  m.hideLoads ??= (root) => {
    for (const l of m.loadParts!) root.getObjectByName(l.part)!.visible = false;
    root.userData.loads = JSON.parse(JSON.stringify(m.loadParts)) as unknown;
  };
  return m.spin(name, floor, fn);
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
 * per car) together.
 */
export function budgetTriangles(m: MeshCore): number {
  const counts = loadTriangleCounts(m);
  const per = new Map<string, number>();
  (m.loadParts ?? []).forEach((l, k) => { for (const c of l.commodities) per.set(c, (per.get(c) ?? 0) + counts[k]!); });
  return m.triangleCount() - counts.reduce((a, b) => a + b, 0) + Math.max(0, ...per.values());
}
