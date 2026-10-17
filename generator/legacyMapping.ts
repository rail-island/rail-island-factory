// Build-time audit and export. No game checkout is needed to build the factory.
import sources from './legacyCatalog.json';
import targets from './legacyTargets.json';
import commercial from '../assets/commercial/inventory.json';
import { glbStats } from './glbStats.ts';
import { proceduralId } from './modelId.ts';
import { resolveParams, type ParamValues, type ProceduralDesign } from './design.ts';
import type { LegacyModelTable } from './modelReference.ts';

/** A model's box size, as the table measures it: its GLB's extents along x, y and z. */
export type MeasureModel = (design: ProceduralDesign, params: ParamValues, modelId: string) => number[];

export const measureModel: MeasureModel = (design, params, modelId) => {
  const stats = glbStats(design.build(params).toGlb(modelId));
  return stats.max.map((v, i) => v - stats.min[i]!);
};

type Correspondence = Record<string, {designId:string; params:Record<string,string>; quality:string; reason?:string}>;

/** Each legacy model's target: its design and resolved values, in the table's order. */
export function legacyTargets(designs: ReadonlyMap<string, ProceduralDesign>) {
  const correspondence = targets as Correspondence;
  return sources.map((source) => {
    const stored = correspondence[source.id];
    if (!stored) throw new Error(`Missing legacy mapping: ${source.id}`);
    const street = commercial.models.find(x => x.legacyId === source.id && x.status === 'covered');
    const target = street ? { ...stored, designId:street.targetId!, params:street.params! } : stored;
    const modelId = proceduralId(target.designId);
    const design = designs.get(modelId);
    if (!design) throw new Error(`Missing target for ${source.id}: ${modelId}`);
    const params = resolveParams(design.params ?? [], target.params as Record<string,string>);
    return { source, target, modelId, design, params };
  });
}

/**
 * The legacy table: every old model id onto its design, values and scale.
 * `measure` sizes a target model (once per design and values); the tests pass
 * one that reads sizes they measured ahead.
 */
export function buildLegacyMapping(designs: ReadonlyMap<string, ProceduralDesign>, measure: MeasureModel = measureModel): LegacyModelTable {
  const entries: LegacyModelTable['entries'] = {};
  const measured = new Map<string, number[]>();
  for (const { source, target, modelId, design, params } of legacyTargets(designs)) {
    const cacheKey = JSON.stringify([modelId, params]);
    let size = measured.get(cacheKey);
    if (!size) {
      size = measure(design, params, modelId);
      measured.set(cacheKey, size);
    }
    // Uniform scale cannot preserve three differing proportions. Preserve building
    // height or vehicle length, and expose both boxes for review by the importer.
    const axis = source.kind === 'building' ? 'height' : ['aircraft','ship'].includes(source.category) ? 'length' : 'game';
    const before = axis === 'height' ? source.sizeY : source.sizeX;
    const after = axis === 'height' ? size[1]! : size[Math.abs(design.catalog?.yaw ?? 0) % 180 === 90 ? 2 : 0]!;
    if (!(before > 0 && after > 0)) throw new Error(`Invalid bounds for ${source.id}`);
    // A building keeps its height unless that would give it a bigger plan than the
    // old model's: a saved map's footprint, blocking and neighbours are the old
    // model's, so the plan area is capped there (scale^2 * target area <= source
    // area) and the building comes out lower instead.
    let scale = axis === 'game' ? 1 : before / after;
    let scaleAxis: 'height' | 'length' | 'game' | 'footprint' = axis;
    if (axis === 'height') {
      const fit = Math.sqrt((source.sizeX * source.sizeZ) / (size[0]! * size[2]!));
      if (fit < scale) {
        scale = fit;
        scaleAxis = 'footprint';
      }
    }
    entries[source.id] = {
      modelId, params, scale,
      sourceDefaultScale: source.defaultScale ?? 1,
      archived: source.archived, quality: target.quality, scaleAxis,
      sourceSize: [source.sizeX,source.sizeY,source.sizeZ], targetSize: size as [number,number,number],
      ...(target.reason ? { reason:target.reason } : {}),
    };
  }
  return {version:1, entries};
}
