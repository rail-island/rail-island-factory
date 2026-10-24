import { palace, palaceLod, PALACE_PARAMS } from './palace.ts';
export { palace, palaceLod } from './palace.ts';
import { colosseum } from './colosseum.ts';
export { colosseum } from './colosseum.ts';
// Remaining historical families, drawn in metres with a grounded origin.
import { MeshBuilder } from './meshBuilder.ts';
import { TOWER_PALETTE } from './towerParts.ts';
import { type ProceduralDesign } from './design.ts';
import { castle, pagoda, castleLod, pagodaLod, CASTLE_PARAMS } from './historicalLandmarks.ts';
export { castle, pagoda, castleLod, pagodaLod } from './historicalLandmarks.ts';
const palette={...TOWER_PALETTE, plaster:{color:'#dfcba4'}, tile:{color:'#883a31'}, water:{color:'#7695a2'}};
// Plain literals, no .map(): a call at module scope cannot be tree-shaken, so each
// standalone JS model (jsModel.ts) would carry every builder of this module.
const HIST_CATALOG = {category:'Historical',group:'hist_center',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island procedural reconstruction'};
export const LEGACY_BUILDINGS:ProceduralDesign[]=[
  {id:'bld-castle',title:'Castle',build:castle,buildLod:castleLod,params:CASTLE_PARAMS,catalog:HIST_CATALOG},
  {id:'bld-hist-colosseum',game:{ plaza: { cities: ['city'], layouts: ['radial'], round: true, apron: 2 } },title:'Colosseum',build:colosseum,buildLod:colosseumLod,catalog:HIST_CATALOG},
  {id:'bld-hist-pagoda',game:{ plaza: { cities: ['town'] } },title:'Pagoda',build:pagoda,buildLod:pagodaLod,catalog:HIST_CATALOG},
  {id:'bld-hist-palace',game:{ plaza: { cities: ['city'], fit: 'footprint' } },title:'Palace',build:palace,buildLod:palaceLod,params:PALACE_PARAMS,catalog:HIST_CATALOG},
];

// Preserve the large openings, separate towers and tiered roofs at map scale.
export function colosseumLod(): MeshBuilder {
  const m=new MeshBuilder(palette),n=16;
  for(let i=0;i<n;i++){
    const a=-i*Math.PI*2/n,b=-(i+1)*Math.PI*2/n;
    const point=(t:number,r:number,y:number):[number,number,number]=>[94*r*Math.cos(t),y,79*r*Math.sin(t)];
    const oa=point(a,1,0),ob=point(b,1,0),ia=point(a,.52,0),ib=point(b,.52,0);
    const height=(t:number)=>Math.sin(t)<-0.01?48:23.2;
    const oat=point(a,1,height(a)),obt=point(b,1,height(b)),iat=point(a,.52,8),ibt=point(b,.52,8);
    m.quad('sandstone',oa,ob,obt,oat);m.quad('sandstone',ib,ia,iat,ibt);
    m.quad('sandstone',oat,obt,ibt,iat);m.quad('sandstone',ob,oa,ia,ib);
  }return m;
}

