// The triangle budget of a model's dedicated low level of detail (docs/models/lod.md).
// Every design supplies its own `buildLod`, most of them through the shared
// vehicle kit (lodKit.ts) or a family's adapter; there is no generic fallback.
import type { ProceduralDesign } from './design.ts';

const sectionCounts = new WeakMap<ProceduralDesign, number>();
export function lodBudget(design: ProceduralDesign): number {
  if (design.lodTriangles) return design.lodTriangles;
  // an articulated vehicle or trainset: 100 per section, at most 300
  if (design.id.startsWith('proc-vehicle-') || design.id.startsWith('veh-')) {
    let n = sectionCounts.get(design);
    if (n === undefined) { n = design.build().rig?.sections?.length ?? 1; sectionCounts.set(design, n); }
    if (n > 1) return Math.min(300, 100 * n);
  }
  if (/^(proc-building-)?sky-/.test(design.id) || /prague-main-station$/.test(design.id)) return 500;
  if (design.catalog?.category === 'Aircraft') return 200;
  if (['Historical', 'Towers'].includes(design.catalog?.category ?? '')) return 500;
  return 100;
}
