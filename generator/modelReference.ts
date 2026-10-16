// Pure runtime contract, exported as standalone JS alongside legacy-models.json.
import { isProceduralId } from './modelId.ts';
import { resolveParams, type ParamSpec, type ParamValues } from './design.ts';
export interface LegacyModelEntry {
  modelId:string;
  params:ParamValues;
  /** Multiply the saved instance scale by this; never multiply by defaultScale again. */
  scale:number;
  sourceDefaultScale:number;
  archived:boolean;
  quality:string;
  scaleAxis:'height'|'length'|'game';
  sourceSize:[number,number,number];
  targetSize:[number,number,number];
  reason?:string;
}
export interface LegacyModelTable {version:1;entries:Record<string,LegacyModelEntry>}
export interface ProceduralModelInfo {id:string; defaultScale?:number; params?:readonly ParamSpec[]}
export interface ModelReference {modelId:string;params:ParamValues;scale:number;legacy:boolean}
/** Resolve a render reference without changing the stored ID, params or scale. */
export function resolveModelReference(
  table:LegacyModelTable,
  models:ReadonlyMap<string,ProceduralModelInfo>,
  id:string,
  savedScale?:number,
  savedParams:ParamValues={},
):ModelReference | undefined {
  if (table.version !== 1) throw new Error('Unsupported legacy model table');
  if (savedScale !== undefined && (!Number.isFinite(savedScale) || savedScale <= 0)) throw new Error('Invalid instance scale');
  if (isProceduralId(id)) {
    const model=models.get(id);
    if (!model) return undefined;
    return {modelId:id,params:resolveParams(model.params??[],savedParams),scale:savedScale??model.defaultScale??1,legacy:false};
  }
  if (!Object.prototype.hasOwnProperty.call(table.entries,id)) return undefined;
  const entry=table.entries[id]!;
  const model=models.get(entry.modelId);
  if (!model) throw new Error(`Missing procedural model ${entry.modelId}`);
  return {modelId:entry.modelId,params:resolveParams(model.params??[],entry.params),scale:(savedScale??entry.sourceDefaultScale)*entry.scale,legacy:true};
}
