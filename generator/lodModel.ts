import type { ProceduralDesign, ParamValues } from './design.ts';
import { buildLodGeometry, lodBudget, lodRecipe } from './lod.ts';
/** Same geometry path as the standalone export; dedicated recipes bypass envelopes. */
export function buildLodModel(design: ProceduralDesign, values?: ParamValues) {
  return design.buildLod ? design.buildLod(values) : design.build(values).lowDetail(faces=>buildLodGeometry(faces, lodBudget(design), lodRecipe(design)));
}
