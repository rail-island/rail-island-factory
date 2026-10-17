// The dedicated LODs of the landmarks, towers and skyscrapers (docs/models/lod.md):
// every parameter combination fits 500 triangles, has no windows, stands on the
// ground and keeps the full model's height, footprint and colours.
import { describe, expect, it } from 'vitest';
import { SKYSCRAPERS } from '../generator/skyscrapers';
import { TOWERS } from '../generator/towers';
import { CHURCHES } from '../generator/churches';
import { CATHEDRALS } from '../generator/cathedrals';
import { GOTHIC_CATHEDRALS } from '../generator/gothicCathedrals';
import { LANDMARKS } from '../generator/landmarks';
import { coverageCombinations, type ProceduralDesign } from '../generator/design';
import { findCoplanarOverlaps } from '../generator/coplanar';
import { glbStats } from '../generator/glbStats';
import { collectTriangles, parseGlb } from '../generator/glbTriangles';

const GROUP: ProceduralDesign[] = [
  ...SKYSCRAPERS, ...CHURCHES, ...GOTHIC_CATHEDRALS,
  ...TOWERS.filter(d => !/eiffel|transmission/.test(d.id)),
  ...CATHEDRALS.filter(d => !/basil/.test(d.id)),
  ...LANDMARKS.filter(d => !/brandenburg/.test(d.id)),
];

/** The base colour of each material a GLB uses, as hex. */
function colours(glb: Uint8Array): Map<string, string> {
  const { json } = parseGlb(glb) as { json: { materials: Array<{ name: string; pbrMetallicRoughness?: { baseColorFactor?: number[] } }> } };
  return new Map(json.materials.map(m => [m.name, (m.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1]).slice(0, 3).map(v => v.toFixed(3)).join(',')]));
}

describe('landmark, tower and skyscraper LODs', () => {
  it('covers the 24 designs of the group, each with its own builder', () => {
    expect(GROUP).toHaveLength(24);
    for (const d of GROUP) expect(d.buildLod?.name).toBe(`${d.build.name}Lod`);
  });
  for (const d of GROUP) {
    for (const v of coverageCombinations(d.params, d.finishParams)) {
      it(`${d.id} ${JSON.stringify(v)}: fits 500 triangles, no windows, the full model's height and plan`, () => {
        const low = d.buildLod!(v), glb = low.toGlb('test');
        expect(low.triangleCount()).toBeLessThanOrEqual(500);
        expect(low.triangleCount()).toBeGreaterThan(100);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const { json, bin } = parseGlb(glb);
        expect(collectTriangles(json, bin).some(f => /glass|window/i.test(f.material))).toBe(false);
        const full = glbStats(d.build(v).toGlb('full')), lod = glbStats(glb);
        expect(lod.min[1]).toBeCloseTo(0, 3);
        // a thin finial or cross may go; the silhouette's height and plan stay
        expect(lod.max[1]).toBeGreaterThan(full.max[1] * 0.93);
        expect(lod.max[1]).toBeLessThanOrEqual(full.max[1] + 0.01);
        for (const k of [0, 2]) {
          expect(lod.max[k]! - lod.min[k]!).toBeGreaterThan((full.max[k]! - full.min[k]!) * 0.8);
          expect(lod.max[k]! - lod.min[k]!).toBeLessThanOrEqual(full.max[k]! - full.min[k]! + 0.01);
        }
      });
    }
  }
  it('paints a skyscraper\'s glass as wall colour of the chosen glazing', () => {
    const office = SKYSCRAPERS.find(d => d.id.endsWith('sky-glass-office'))!;
    for (const glazing of ['original', 'jade', 'bronze']) {
      const full = colours(office.build({ glazing }).toGlb('full')), low = colours(office.buildLod!({ glazing }).toGlb('low'));
      expect(low.get('facade')).toBe(full.get('glass'));
      expect(low.get('facadeDark')).toBe(full.get('glassDark'));
    }
  });
  it('keeps the twisting tower\'s twist and the terraced tower\'s step count', () => {
    const twisted = SKYSCRAPERS.find(d => d.id.endsWith('sky-twisted'))!;
    const straight = glbStats(twisted.buildLod!({ twist: 'straight' }).toGlb('a')), half = glbStats(twisted.buildLod!({ twist: 'half' }).toGlb('b'));
    expect(half.max[0]! - half.min[0]!).toBeGreaterThan(straight.max[0]! - straight.min[0]! + 1);
    const terraced = SKYSCRAPERS.find(d => d.id.endsWith('sky-terraced'))!;
    const decks = (n: string) => terraced.buildLod!({ terraces: n }).triangleCount();
    expect(decks('6')).toBeGreaterThan(decks('3'));
  });
});
