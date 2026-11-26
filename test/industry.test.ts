import { proceduralId } from "../generator/modelId.ts";
import { expect, it } from 'vitest';
import { buildingSpec, INDUSTRY } from '../generator/industry.ts';
import { CAGE_SINK, PRIMARY_INDUSTRY, WINDING_CLIP, WINDING_CYCLE, WIND_DEPTH, windingRun } from '../generator/primaryIndustry.ts';
import { poseGlb, sampleCount } from '../generator/glbPose.ts';
import { OIL_WELL } from '../generator/oilWell.ts';
import { bayLayout, FACES, faceLength, hallOpenings, PLINTH } from '../generator/industryHall.ts';
import { INDUSTRY_MIGRATION } from '../generator/industryMigration.ts';
import { paramCombinations, resolveParams } from '../generator/design.ts';
import { findCoplanarOverlaps } from '../generator/coplanar.ts';
import { glbStats } from '../generator/glbStats.ts';
import { measureHelipad } from '../generator/helipad.ts';
import { HELIPAD_D } from '../generator/design.ts';
import { PLATFORM_HELIDECK } from '../generator/offshorePlatform.ts';
import { parseGlb } from '../generator/glbTriangles.ts';
import { materialPositions } from '../generator/meshAudit.ts';
it('covers the 35 audited Industry entries with valid target parameters', () => {
  expect(INDUSTRY_MIGRATION).toHaveLength(35);
  expect(new Set(INDUSTRY_MIGRATION.map(e => e.sourceId)).size).toBe(35);
  expect(INDUSTRY_MIGRATION.filter(e => e.sourceGroup === 'industry')).toHaveLength(31);
  for (const entry of INDUSTRY_MIGRATION) {
    const d = [...INDUSTRY, ...OIL_WELL].find(d => proceduralId(d.id) === proceduralId(entry.designId))!;
    expect(d).toBeDefined();
    expect(() => resolveParams(d.params ?? [], entry.params)).not.toThrow();
  }
  const buildings = INDUSTRY_MIGRATION.filter(e => e.sourceId.startsWith('ind-building-'));
  expect(buildings).toHaveLength(20);
  expect(new Set(buildings.map(e => e.designId)).size).toBe(4);
});
for (const d of [...INDUSTRY, ...PRIMARY_INDUSTRY, ...OIL_WELL]) it(`${d.id}: all variants deterministic, grounded and under 10k triangles`, () => {
  const shapes = new Set<string>();
  for (const p of paramCombinations(d.params)) {
    const m = d.build(p), glb = m.toGlb('industry test');
    expect(m.triangleCount()).toBeLessThanOrEqual(10000);
    expect(m.triangleCount()).toBeGreaterThan(200);
    expect(Buffer.from(glb).equals(Buffer.from(d.build(p).toGlb('industry test')))).toBe(true);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
    const stats = glbStats(glb);
    expect(stats.min[1]).toBe(0);
    for (let i = 0; i < 3; i++) { expect(Number.isFinite(stats.max[i])).toBe(true); expect(stats.max[i]!).toBeGreaterThan(stats.min[i]!); }
    shapes.add(Buffer.from(glb).toString('base64'));
  }
  expect(shapes.size).toBe(paramCombinations(d.params).length);
});
it('exports a separate animated turbine rotor', () => {
  const d = INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-wind-turbine')!;
  const { json } = parseGlb(d.build().toGlb('wind'));
  const animated = json as unknown as { nodes: { name?: string }[]; animations: unknown[] };
  expect(animated.nodes.some(n => n.name === 'rotor')).toBe(true);
  expect(animated.animations).toHaveLength(1);
});
// Regression: dock doors were drawn in front of the ground-floor windows (the roller
// shutters read as ventilators over the glass). The hall kit now plans every opening
// and builds the wall around them, so no two may overlap or cut a pilaster.
it('plans hall openings that never overlap each other or a pilaster', () => {
  const specs = ['mill', 'hall', 'saw', 'warehouse'].flatMap(kind => ['compact', 'extended'].map(size => buildingSpec(kind, size)));
  specs.push({ w: 16, d: 12, h: 8, roof: 'gable', floors: [PLINTH] }, { w: 24, d: 14, h: 10, roof: 'saw', floors: [PLINTH] });
  for (const s of specs) {
    const openings = hallOpenings(s);
    expect(openings.filter(o => o.kind === 'dock').length).toBeGreaterThan(1);
    for (const face of FACES) {
      const mine = openings.filter(o => o.face === face), { centres, bay } = bayLayout(s, face);
      for (const [i, a] of mine.entries()) {
        expect(a.u0).toBeGreaterThan(-faceLength(s, face) / 2 + .5);
        expect(a.u1).toBeLessThan(faceLength(s, face) / 2 - .5);
        expect(a.y1).toBeLessThan(s.h);
        for (const c of centres.slice(1)) expect(a.u1 < c - bay / 2 - .3 || a.u0 > c - bay / 2 + .3).toBe(true);
        for (const b of mine.slice(i + 1)) expect(a.u1 <= b.u0 || b.u1 <= a.u0 || a.y1 <= b.y0 || b.y1 <= a.y0, `${face} ${JSON.stringify([a, b])}`).toBe(true);
      }
    }
  }
});
// The offshore platform stands in the sea and carries a large helideck (docs/models/industry.md,
// "Offshore platform"; docs/models/game-properties.md, "Helipads"): the jacket's legs stand on the
// waterline (y = 0), the export measures a level pad of at least HELIPAD_D.large on the helideck, and
// its flare burns at the tip of the boom.
it('stands the offshore platform on the waterline with a large helideck and a burning flare', () => {
  const d = INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-offshore-platform')!;
  const m = d.build();
  expect(glbStats(m.toGlb('platform')).min[1]).toBe(0);
  const pad = measureHelipad(d, d.game!.helipad!);
  expect(pad.pad).toBe('large');
  expect(pad.size).toBeGreaterThanOrEqual(HELIPAD_D.large);
  expect(pad.centre).toEqual([PLATFORM_HELIDECK.x, PLATFORM_HELIDECK.y1, PLATFORM_HELIDECK.z]);
  // above everything on the platform but the derrick, the crane's boom and the flare
  const tops = m.positions().filter((_, i) => i % 3 === 1);
  expect(Math.max(...tops)).toBeGreaterThan(pad.centre[1]);
  expect(m.emitters().map(e => e.kind)).toEqual(['flame']);
  // the low detail keeps the deck's silhouette, in the same material
  const low = d.buildLod();
  expect(low.triangleCount()).toBeLessThanOrEqual(500);
  const lp = materialPositions(low, 'helipad');
  const xs = lp.filter((_, i) => i % 3 === 0);
  expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(PLATFORM_HELIDECK.side, 5);
});

// The game blocks and grades only the jacket's base (docs/models/industry.md, "Offshore
// platform"): its block rect, a fraction of the plan, must hold everything the model stands
// on - every vertex below the cellar deck - and leave the flare and crane booms outside it.
it('blocks the offshore platform on its jacket alone and marks it offshore', () => {
  const d = INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-offshore-platform')!;
  expect(d.game!.offshore).toBe(true);
  const rects = d.game!.block!.rects;
  expect(rects).toHaveLength(1);
  const r = rects[0]!;
  const pos = d.build().positions();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    x0 = Math.min(x0, pos[i]!); x1 = Math.max(x1, pos[i]!); z0 = Math.min(z0, pos[i + 2]!); z1 = Math.max(z1, pos[i + 2]!);
  }
  const w = x1 - x0, dd = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const rx0 = cx + (r.x - r.w / 2) * w, rx1 = cx + (r.x + r.w / 2) * w;
  const rz0 = cz + (r.z - r.d / 2) * dd, rz1 = cz + (r.z + r.d / 2) * dd;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i + 1]! >= 20) continue;
    expect(pos[i]!).toBeGreaterThanOrEqual(rx0 - 1e-3);
    expect(pos[i]!).toBeLessThanOrEqual(rx1 + 1e-3);
    expect(pos[i + 2]!).toBeGreaterThanOrEqual(rz0 - 1e-3);
    expect(pos[i + 2]!).toBeLessThanOrEqual(rz1 + 1e-3);
  }
  // the booms overhang it: the rect is about half the plan, inside it
  expect(r.w * r.d).toBeLessThan(0.4);
  expect(Math.abs(r.x) + r.w / 2).toBeLessThanOrEqual(0.5);
  expect(Math.abs(r.z) + r.d / 2).toBeLessThanOrEqual(0.5);
});

// The primary industries of the supply chain (docs/models/industry.md, "Primary industries"):
// a farm, a mine head and a logging camp. Each stands within its site's
// plan, keeps a low detail of at most 500 triangles, and the mine's ore shows in its heap.
it('draws the farm, mine and logging camp on their plans, with their low detail', async () => {
  const { farmPlan, MINE, CAMP } = await import('../generator/primaryIndustry.ts');
  const plans: Record<string, (p: Record<string, string>) => { w: number; d: number }> = {
    'proc-building-industry-farm': p => farmPlan(p.size!), 'proc-building-industry-mine': () => MINE, 'proc-building-industry-logging-camp': () => CAMP,
  };
  for (const [id, plan] of Object.entries(plans)) {
    const d = PRIMARY_INDUSTRY.find(d => proceduralId(d.id) === id)!;
    expect(d, id).toBeDefined();
    expect(d.references).toBe(id.replace('proc-building-', ''));
    for (const p of paramCombinations(d.params)) {
      const { w, d: depth } = plan(p as Record<string, string>), stats = glbStats(d.build(p).toGlb('plan'));
      expect(stats.min[0]).toBeGreaterThanOrEqual(-w / 2 - 1e-6); expect(stats.max[0]).toBeLessThanOrEqual(w / 2 + 1e-6);
      expect(stats.min[2]).toBeGreaterThanOrEqual(-depth / 2 - 1e-6); expect(stats.max[2]).toBeLessThanOrEqual(depth / 2 + 1e-6);
      const low = d.buildLod(p);
      expect(low.triangleCount()).toBeLessThanOrEqual(d.lodTriangles!);
      expect(findCoplanarOverlaps(low.toGlb('low'))).toEqual([]);
    }
  }
  const mine = PRIMARY_INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-mine')!;
  expect(materialPositions(mine.build({ type: 'coal' }), 'coalSpoil').length).toBeGreaterThan(0);
  expect(materialPositions(mine.build({ type: 'iron' }), 'oreSpoil').length).toBeGreaterThan(0);
  expect(materialPositions(mine.build({ type: 'iron' }), 'coalSpoil')).toHaveLength(0);
});

// The mine head's winder (docs/models/animation.md, "The mine head's winder"): the two
// sheaves turn, the cage sinks into the shaft and back, on a closed time loop.
it("winds the mine head's cage down the shaft and back, the sheaves turning", () => {
  const mine = PRIMARY_INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-mine')!;
  expect(windingRun(0)).toBe(0); expect(windingRun(WINDING_CYCLE)).toBe(0); expect(windingRun(WINDING_CYCLE / 2)).toBe(WIND_DEPTH);
  for (const p of paramCombinations(mine.params)) {
    const glb = mine.build(p).toGlb('t');
    const g = parseGlb(glb).json as unknown as { nodes: Array<{ name: string }>; scenes: Array<{ extras?: { clipDrives?: unknown } }>; animations: Array<{ name: string; channels: Array<{ target: { node: number } }> }> };
    expect(g.animations.map(a => a.name)).toEqual([WINDING_CLIP]);
    expect(g.scenes[0]!.extras?.clipDrives).toEqual({ [WINDING_CLIP]: { drive: 'time' } });
    const moved = new Set(g.animations[0]!.channels.map(c => g.nodes[c.target.node]!.name));
    expect([...moved].sort()).toEqual(['cage', 'rope', 'sheave-a', 'sheave-b']);
    const n = sampleCount(glb), rest = glbStats(poseGlb(glb, 0));
    for (const k of [0, Math.floor(n / 4), Math.floor(n / 2)]) expect(findCoplanarOverlaps(poseGlb(glb, k)), `sample ${k}`).toEqual([]);
    // at the bottom of the wind the cage (its floor 1.27 m over the 0.2 m yard at bank) has sunk into the shaft
    expect(rest.min[1]).toBe(0);
    expect(glbStats(poseGlb(glb, Math.floor(n / 2))).min[1]).toBeCloseTo(0.2 + 1.27 - CAGE_SINK, 2);
    expect(glbStats(poseGlb(glb, n - 1))).toEqual(rest);
    expect(mine.buildLod!(p).animations()).toEqual([]);
  }
});

// The logging camp is buildings and wood: no trees and no vehicles (the game places those).
it('keeps trees and vehicles out of the logging camp', () => {
  const camp = PRIMARY_INDUSTRY.find(d => proceduralId(d.id) === 'proc-building-industry-logging-camp')!;
  for (const mat of ['needle', 'tyre']) expect(materialPositions(camp.build({}), mat)).toHaveLength(0);
});
