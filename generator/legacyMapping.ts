// Build-time audit and export. No game checkout is needed to build the factory.
import sources from './legacyCatalog.json';
import targets from './legacyTargets.json';
import commercial from '../assets/commercial/inventory.json';
import { glbStats } from './glbStats.ts';
import { proceduralId } from './modelId.ts';
import { resolveParams, type ProceduralDesign } from './design.ts';
import type { LegacyModelTable } from './modelReference.ts';

export function buildLegacyMapping(designs: ReadonlyMap<string, ProceduralDesign>): LegacyModelTable {
  const entries: LegacyModelTable['entries'] = {};
  const measured = new Map<string, number[]>();
  const correspondence = targets as Record<string, {designId:string; params:Record<string,string>; quality:string; reason?:string}>;
  for (const source of sources) {
    const stored = correspondence[source.id];
    if (!stored) throw new Error(`Missing legacy mapping: ${source.id}`);
    const street = commercial.models.find(x => x.legacyId === source.id && x.status === 'covered');
    const target = street ? { ...stored, designId:street.targetId!, params:street.params! } : stored;
    const modelId = proceduralId(target.designId);
    const design = designs.get(modelId);
    if (!design) throw new Error(`Missing target for ${source.id}: ${modelId}`);
    const params = resolveParams(design.params ?? [], target.params as Record<string,string>);
    const cacheKey = JSON.stringify([modelId, params]);
    let size = measured.get(cacheKey);
    if (!size) {
      const stats = glbStats(design.build(params).toGlb(modelId));
      size = stats.max.map((v, i) => v - stats.min[i]!);
      measured.set(cacheKey, size);
    }
    // Uniform scale cannot preserve three differing proportions. Preserve building
    // height or vehicle length, and expose both boxes for review by the importer.
    const axis = source.kind === 'building' ? 'height' : ['aircraft','ship'].includes(source.category) ? 'length' : 'game';
    const before = axis === 'height' ? source.sizeY : source.sizeX;
    const after = axis === 'height' ? size[1]! : size[Math.abs(design.catalog?.yaw ?? 0) % 180 === 90 ? 2 : 0]!;
    if (!(before > 0 && after > 0)) throw new Error(`Invalid bounds for ${source.id}`);
    entries[source.id] = {
      modelId, params, scale: axis === 'game' ? 1 : before / after,
      sourceDefaultScale: source.defaultScale ?? 1,
      archived: source.archived, quality: target.quality, scaleAxis: axis,
      sourceSize: [source.sizeX,source.sizeY,source.sizeZ], targetSize: size as [number,number,number],
      ...(target.reason ? { reason:target.reason } : {}),
    };
  }
  return {version:1, entries};
}
