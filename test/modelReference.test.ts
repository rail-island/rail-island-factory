import { beforeAll, describe, expect, it } from 'vitest';
import sources from '../generator/legacyCatalog.json';
import { DESIGNS } from '../generator/generate.ts';
import { VEHICLE_CATALOG } from '../generator/vehicles.ts';
import { SKYSCRAPER_CATALOG } from '../generator/skyscrapers.ts';
import { metaEntry } from '../generator/catalog.ts';
import { buildLegacyMapping, legacyTargets, measureModel } from '../generator/legacyMapping.ts';
import { proceduralId, isProceduralId } from '../generator/modelId.ts';
import { resolveModelReference, type LegacyModelTable } from '../generator/modelReference.ts';
let table:LegacyModelTable;
const models=new Map([...DESIGNS.values()].map(d=>[d.id,metaEntry(d,d.catalog??(d.id.startsWith("proc-vehicle-")?VEHICLE_CATALOG:SKYSCRAPER_CATALOG))]));
// The table measures a few hundred models: measure them ahead, yielding between
// them so the worker keeps answering Vitest (test/setup.ts), then build it.
beforeAll(async()=>{
  const sizes=new Map<string,number[]>();
  for(const {design,params,modelId} of legacyTargets(DESIGNS)){
    const key=JSON.stringify([modelId,params]);
    if(sizes.has(key))continue;
    sizes.set(key,measureModel(design,params,modelId));
    await new Promise<void>(resolve=>setImmediate(resolve));
  }
  table=buildLegacyMapping(DESIGNS,(_d,params,modelId)=>sizes.get(JSON.stringify([modelId,params]))!);
},120_000);
describe('legacy references and procedural IDs',()=>{
 it('covers the complete creator snapshot, including all archived IDs',()=>{
  expect(Object.keys(table.entries).sort()).toEqual(sources.map(s=>s.id).sort());
  expect(sources.filter(s=>s.archived)).toHaveLength(77);
  for(const s of sources){const e=table.entries[s.id]!;expect(e.archived).toBe(s.archived);expect(models.has(e.modelId)).toBe(true);expect(isProceduralId(e.modelId)).toBe(true);expect(Number.isFinite(e.scale)&&e.scale>0).toBe(true);}
 });
 it('never gives an old building a bigger plan than the old model had',()=>{
  // A saved map keeps the old model's footprint and blocking, so a mapped building
  // whose plan grew spilled into its neighbours (85 of 177 did, ind-building-n 20x).
  for(const s of sources.filter(s=>s.kind==='building')){
   const e=table.entries[s.id]!;
   const area=e.targetSize[0]*e.scale*e.targetSize[2]*e.scale;
   expect(area,s.id).toBeLessThanOrEqual(s.sizeX*s.sizeZ*(1+1e-9));
   if(e.scaleAxis==='height') expect(e.scale*e.targetSize[1]).toBeCloseTo(s.sizeY,6);
   else {expect(e.scaleAxis,s.id).toBe('footprint');expect(area/(s.sizeX*s.sizeZ)).toBeCloseTo(1,9);expect(e.scale*e.targetSize[1]).toBeLessThan(s.sizeY);}
  }
  expect(table.entries['ind-building-n']!.scaleAxis).toBe('footprint');
 });
 it('turns a cable cabin so it runs the way the old one did',()=>{
  // The tramway car is modelled long along Z; the game runs a cabin along X, as the
  // old cablecar-cabin (9.33 x 2.97 in plan) did.
  for(const s of sources.filter(s=>s.category==='cablecar')){
   const e=table.entries[s.id]!;const yaw=models.get(e.modelId)!.yaw??0;
   const quarter=Math.abs(yaw)%180===90;
   const [tx,,tz]=e.targetSize;const [x,z]=quarter?[tz,tx]:[tx,tz];
   expect(x>=z,s.id).toBe(s.sizeX>=s.sizeZ);
  }
 });
 it('has no ambiguity between old tower/industry GLBs and new procedures',()=>{
  expect(isProceduralId('tower-eiffel')).toBe(false);
  expect(isProceduralId('chemical-factory')).toBe(false);
  for(const id of DESIGNS.keys()){expect(isProceduralId(id)).toBe(true);expect(sources.some(s=>s.id===id)).toBe(false);}
 });
 it('multiplies the saved building scale exactly once and never mutates the map',()=>{
  const saved={id:'tower-eiffel',scale:.00551};const before=JSON.stringify(saved);
  const e=table.entries[saved.id]!;const result=resolveModelReference(table,models,saved.id,saved.scale)!;
  expect(result.scale).toBeCloseTo(saved.scale*e.scale,12);
  expect(result.scale*e.targetSize[1]).toBeCloseTo(saved.scale*e.sourceSize[1],8);
  expect(JSON.stringify(saved)).toBe(before);
  expect(resolveModelReference(table,models,result.modelId,result.scale,result.params)!.scale).toBe(result.scale);
 });
 it('uses old defaults only when a legacy building has no saved scale',()=>{
  const e=table.entries['village-building-type-a']!;
  expect(resolveModelReference(table,models,'village-building-type-a')!.scale).toBe(e.scale*e.sourceDefaultScale);
  expect(resolveModelReference(table,models,proceduralId('bld-fountain-classical'))!.scale).toBe(1);
  expect(resolveModelReference(table,models,proceduralId('tower-eiffel'))!.scale).toBe(.55);
 });
 it('uses unit defaultScale for buildings, ships and aircraft except Eiffel',()=>{
  for (const model of models.values()) {
   if (model.defaultScale !== undefined) expect(model.defaultScale, model.id).toBe(model.id === 'proc-building-tower-eiffel' ? .55 : 1);
  }
 });
 it('leaves ground vehicle scaling to the game, preserving an explicit instance scale',()=>{
  for(const s of sources.filter(s=>s.kind==='vehicle'&&!['aircraft','ship'].includes(s.category))){expect(table.entries[s.id]!.scale).toBe(1);expect(table.entries[s.id]!.scaleAxis).toBe('game');expect(models.get(table.entries[s.id]!.modelId)).not.toHaveProperty('defaultScale');}
  expect(resolveModelReference(table,models,'train-loco-electric-cd-163',2)!.scale).toBe(2);
 });
 it('resolves paint, unit and cargo parameters instead of dropping to defaults',()=>{
  expect(table.entries['train-loco-electric-cd-151-cez']!.params).toMatchObject({livery:'cd151Cez'});
  expect(table.entries['train-emu-cd-675-cd-975']!.params).toMatchObject({variant:'cd675',unit:'drivingTrailer'});
  for (const id of ['train-truck-n-nas-full-4', 'train-truck-n-pao-full-2']) {
    expect(table.entries[id]!.params).toMatchObject({cargo:'empty'});
    expect(table.entries[id]!.scale).toBe(1);
  }
  expect(table.entries['moto-bus-kar-b961']!.params).toMatchObject({variant:'b961'});
 });
 it('maps both DB 628 sets (the 628 and its n-Wagen coaches) onto the cars of the one DB 628 design',()=>{
  const sets = {
   mint: {'train-dmu-db-628':'motorCar','train-coach-db-bnvriv':'bn','train-coach-db-abnvriv':'abn','train-coach-db-bdnrfiv':'bdnrf'},
   red: {'train-dmu-db-628vr':'motorCar','train-coach-db-bnvr':'bn','train-coach-db-abnvr':'abn','train-coach-db-bdnrf':'bdnrf'},
  };
  for (const [livery, cars] of Object.entries(sets))
   for (const [id, unit] of Object.entries(cars)) {
    expect(table.entries[id]!.modelId, id).toBe('proc-vehicle-db-628');
    expect(table.entries[id]!.params, id).toEqual({unit, livery});
   }
 });
 it('keeps unknown uploads and unknown procedural IDs distinguishable from known legacy IDs',()=>{
  expect(resolveModelReference(table,models,'user-upload-id')).toBeUndefined();
  expect(resolveModelReference(table,models,'__proto__')).toBeUndefined();
  expect(resolveModelReference(table,models,'proc-building-missing')).toBeUndefined();
  expect(()=>resolveModelReference(table,models,'tower-eiffel',NaN)).toThrow('scale');
  expect(()=>resolveModelReference(table,models,proceduralId('village-cottage'),1,{bogus:'yes'})).toThrow('parameter');
 });
});
