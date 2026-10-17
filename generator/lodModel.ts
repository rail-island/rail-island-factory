import type { ProceduralDesign, ParamValues } from './design.ts';
/** A design's distant model: its own dedicated builder, the same one the standalone export calls. */
export function buildLodModel(design: ProceduralDesign, values?: ParamValues) {
  return design.buildLod(values);
}
