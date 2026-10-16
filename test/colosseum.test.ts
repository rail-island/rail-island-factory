import { describe, expect, it } from 'vitest';
import { colosseum } from '../generator/colosseum';
import { designGlb, DESIGNS } from '../generator/generate';
import { glbStats } from '../generator/glbStats';
import { findCoplanarOverlaps } from '../generator/coplanar';

describe('Colosseum', () => {
  it('keeps the canonical id, oval proportions and requested triangle budget', () => {
    expect(DESIGNS.has('proc-building-hist-colosseum')).toBe(true);
    const s = glbStats(designGlb('proc-building-hist-colosseum'));
    expect(s.triangles).toBeGreaterThanOrEqual(20000);
    expect(s.triangles).toBeLessThanOrEqual(30000);
    expect(s.min).toEqual([-94, 0, -79]);
    expect(s.max).toEqual([94, 48, 79]);
    expect(s.materials).toBeLessThanOrEqual(5);
  });
  it('is deterministic and has no coplanar material flicker', () => {
    const a = colosseum().toGlb('test');
    expect(a).toEqual(colosseum().toGlb('test'));
    expect(findCoplanarOverlaps(a)).toEqual([]);
  });
});
